import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, TrackerOrderItem } from "@/types";

// GET /api/tracker?code=ORD-...
// Returns order data WITHOUT clientWhatsapp for public use
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Order code required" }, { status: 400 });
  }

  const [order, setting] = await Promise.all([
    prisma.order.findUnique({
      where: { orderCode: code.trim().toUpperCase() },
      select: {
        id: true,
        orderCode: true,
        clientName: true,
        // clientWhatsapp intentionally excluded
        serviceId: true,
        service: { select: { title: true, slug: true } },
        projectBrief: true,
        budgetEstimate: true,
        status: true,
        adminNote: true,
        hasSubmittedTestimonial: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.siteSetting.findUnique({
      where: { id: "global" },
      select: { whatsappNumber: true },
    }),
  ]);

  if (!order) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Pesanan dengan kode tersebut tidak ditemukan. Mohon periksa kembali kode order Anda." }, { status: 404 });
  }

  return NextResponse.json<ApiResponse<TrackerOrderItem>>({
    success: true,
    data: {
      ...order,
      adminWhatsapp: setting?.whatsappNumber || "6281234567890",
    } as unknown as TrackerOrderItem,
  });
}

