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

  const order = await prisma.order.findUnique({
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
  });

  if (!order) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json<ApiResponse<TrackerOrderItem>>({
    success: true,
    data: order as unknown as TrackerOrderItem,
  });
}

