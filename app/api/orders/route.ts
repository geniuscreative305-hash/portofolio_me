import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";
import { requireAdmin } from "@/lib/auth";
import { getClientIp, checkGeneralRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, PaginatedResponse, OrderItem } from "@/types";

// ── Helper: generate non-guessable sequential order code with random suffix ──
function generateRandomSuffix(len = 4): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateOrderCode(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const prefix = `ORD-${dateStr}-`;

  const countToday = await prisma.order.count({
    where: { orderCode: { startsWith: prefix } },
  });

  const nextNum = countToday + 1;
  const suffix = generateRandomSuffix(4);

  return `${prefix}${String(nextNum).padStart(3, "0")}-${suffix}`;
}

// GET /api/orders — Admin only paginated list
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "20", 10));
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status as never;
  if (search) {
    where.OR = [
      { orderCode: { contains: search, mode: "insensitive" } },
      { clientName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { service: { select: { title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json<ApiResponse<PaginatedResponse<OrderItem>>>({
    success: true,
    data: {
      items: items as unknown as OrderItem[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

// POST /api/orders — public order submission with anti-spam & strict validation
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: max 5 orders per 10 minutes per IP
    const rateCheck = checkGeneralRateLimit(`order:${ip}`, 5, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Terlalu banyak permintaan pemesanan dari perangkat ini. Silakan tunggu beberapa saat sebelum mencoba lagi.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Honeypot check: website_url must be completely empty/undefined
    if (body.website_url) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Spam request rejected." },
        { status: 400 }
      );
    }

    const { clientName, clientWhatsapp, serviceId, projectBrief, budgetEstimate } = body;

    // Strict validation
    if (
      typeof clientName !== "string" ||
      clientName.trim().length < 2 ||
      clientName.trim().length > 100
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Nama pemesan harus berupa teks antara 2 hingga 100 karakter." },
        { status: 400 }
      );
    }

    const cleanWhatsapp = typeof clientWhatsapp === "string" ? clientWhatsapp.replace(/\D/g, "") : "";
    if (cleanWhatsapp.length < 9 || cleanWhatsapp.length > 20) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Nomor WhatsApp harus valid (antara 9 hingga 20 digit angka)." },
        { status: 400 }
      );
    }

    if (typeof serviceId !== "string" || !serviceId.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "ID layanan wajib disertakan." },
        { status: 400 }
      );
    }

    if (
      typeof projectBrief !== "string" ||
      projectBrief.trim().length < 10 ||
      projectBrief.trim().length > 2000
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Brief proyek harus berisi penjelasan antara 10 hingga 2000 karakter." },
        { status: 400 }
      );
    }

    if (
      typeof budgetEstimate !== "string" ||
      budgetEstimate.trim().length < 2 ||
      budgetEstimate.trim().length > 100
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Estimasi budget harus berupa teks yang valid (maksimal 100 karakter)." },
        { status: 400 }
      );
    }

    // Verify service exists and is active
    const service = await prisma.service.findFirst({
      where: { id: serviceId.trim(), isActive: true },
    });
    if (!service) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Service not found or inactive" }, { status: 404 });
    }

    // Verify site is open for orders
    const setting = await prisma.siteSetting.findUnique({ where: { id: "global" } });
    if (!setting?.isOpenOrder) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Sistem pemesanan saat ini sedang ditutup sementara." }, { status: 503 });
    }

    const orderCode = await generateOrderCode();

    const order = await prisma.order.create({
      data: {
        orderCode,
        clientName: clientName.trim(),
        clientWhatsapp: cleanWhatsapp,
        serviceId: service.id,
        projectBrief: projectBrief.trim(),
        budgetEstimate: budgetEstimate.trim(),
        status: "PENDING",
      },
    });

    await logActivity({
      action: "CREATE",
      entityType: "Order",
      entityId: order.id,
      description: `New order ${orderCode} by ${clientName} for service: ${service.title}`,
    });

    // Build WhatsApp URL
    const wa = setting.whatsappNumber.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Halo! Saya ingin konfirmasi pesanan saya:\n\n*Order Code:* ${orderCode}\n*Nama:* ${clientName.trim()}\n*Layanan:* ${service.title}\n*Brief:* ${projectBrief.trim()}\n*Budget:* ${budgetEstimate.trim()}\n\nMohon dikonfirmasi. Terima kasih!`
    );
    const waUrl = `https://wa.me/${wa}?text=${msg}`;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { orderCode, waUrl },
      message: "Order created successfully",
    });
  } catch (err) {
    console.error("[orders POST]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

