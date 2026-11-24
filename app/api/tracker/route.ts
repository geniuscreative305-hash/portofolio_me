import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, checkGeneralRateLimit } from "@/lib/rate-limit";
import { detectSqlInjection } from "@/lib/security";
import type { ApiResponse, TrackerOrderItem } from "@/types";

// GET /api/tracker?code=ORD-...
// Strict zero-PII public order tracker (no clientName, clientWhatsapp, projectBrief, budgetEstimate, or DB ids)
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkGeneralRateLimit(`tracker:${ip}`, 30, 60 * 1000); // 30 requests / min
  if (!rateLimit.allowed) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Terlalu banyak permintaan pelacakan. Silakan tunggu beberapa saat." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code || typeof code !== "string" || code.trim().length > 50 || detectSqlInjection(code)) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Kode order wajib diisi dan valid." }, { status: 400 });
  }

  const cleanCode = code.trim().toUpperCase();

  const [order, setting] = await Promise.all([
    prisma.order.findUnique({
      where: { orderCode: cleanCode },
      select: {
        orderCode: true,
        status: true,
        adminNote: true,
        updatedAt: true,
        hasSubmittedTestimonial: true,
        service: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.siteSetting.findUnique({
      where: { id: "global" },
      select: { whatsappNumber: true },
    }),
  ]);

  if (!order) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Pesanan dengan kode tersebut tidak ditemukan. Mohon periksa kembali kode order Anda." },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<TrackerOrderItem>>({
    success: true,
    data: {
      orderCode: order.orderCode,
      status: order.status,
      adminNote: order.adminNote,
      updatedAt: order.updatedAt.toISOString(),
      service: order.service,
      hasSubmittedTestimonial: order.hasSubmittedTestimonial,
      adminWhatsapp: setting?.whatsappNumber || "6281234567890",
    },
  });
}

