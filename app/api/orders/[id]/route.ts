import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { requireAdmin } from "@/lib/auth";
import type { ApiResponse } from "@/types";

// PATCH /api/orders/[id] — update status or admin note (Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const { id } = params;
    const body = await req.json();
    const { status, adminNote } = body;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    await logActivity({
      action: "UPDATE",
      entityType: "Order",
      entityId: id,
      description: `Order ${order.orderCode} updated: ${Object.keys(updateData).join(", ")}`,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: order });
  } catch (err) {
    console.error("[orders PATCH]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}

// DELETE /api/orders/[id] (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const { id } = params;
    const order = await prisma.order.delete({ where: { id } });

    await logActivity({
      action: "DELETE",
      entityType: "Order",
      entityId: id,
      description: `Order ${order.orderCode} deleted`,
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error("[orders DELETE]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to delete order" }, { status: 500 });
  }
}

