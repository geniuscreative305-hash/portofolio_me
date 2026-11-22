import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";
import type { ApiResponse, PaginatedResponse, OrderItem } from "@/types";

// ── Helper: generate sequential daily order code ──────────────────────────────
async function generateOrderCode(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const prefix = `ORD-${dateStr}-`;

  const lastOrder = await prisma.order.findFirst({
    where: { orderCode: { startsWith: prefix } },
    orderBy: { orderCode: "desc" },
    select: { orderCode: true },
  });

  let nextNum = 1;
  if (lastOrder) {
    const parts = lastOrder.orderCode.split("-");
    nextNum = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

// GET /api/orders — admin paginated list
export async function GET(req: NextRequest) {
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

// POST /api/orders — public order submission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientName, clientWhatsapp, serviceId, projectBrief, budgetEstimate } = body;

    if (!clientName || !clientWhatsapp || !serviceId || !projectBrief || !budgetEstimate) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Verify service exists and is active
    const service = await prisma.service.findFirst({
      where: { id: serviceId, isActive: true },
    });
    if (!service) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Service not found or inactive" }, { status: 404 });
    }

    // Verify site is open for orders
    const setting = await prisma.siteSetting.findUnique({ where: { id: "global" } });
    if (!setting?.isOpenOrder) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Order system is currently closed" }, { status: 503 });
    }

    const orderCode = await generateOrderCode();

    const order = await prisma.order.create({
      data: {
        orderCode,
        clientName,
        clientWhatsapp,
        serviceId,
        projectBrief,
        budgetEstimate,
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
      `Halo! Saya ingin konfirmasi pesanan saya:\n\n*Order Code:* ${orderCode}\n*Nama:* ${clientName}\n*Layanan:* ${service.title}\n*Brief:* ${projectBrief}\n*Budget:* ${budgetEstimate}\n\nMohon dikonfirmasi. Terima kasih!`
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

