import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { requireAdmin } from "@/lib/auth";
import type { ApiResponse, BulkActionPayload } from "@/types";

// POST /api/orders/bulk (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const body: BulkActionPayload = await req.json();
    const { ids, action } = body;

    if (!ids?.length) {
      return NextResponse.json<ApiResponse>({ success: false, error: "No IDs provided" }, { status: 400 });
    }

    if (action === "delete") {
      await prisma.order.deleteMany({ where: { id: { in: ids } } });
      await logActivity({
        action: "BULK_DELETE",
        entityType: "Order",
        description: `Bulk deleted ${ids.length} orders`,
      });
    } else {
      return NextResponse.json<ApiResponse>({ success: false, error: "Invalid bulk action" }, { status: 400 });
    }

    return NextResponse.json<ApiResponse>({ success: true, message: `Bulk ${action} completed on ${ids.length} items` });
  } catch (err) {
    console.error("[orders bulk]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Bulk action failed" }, { status: 500 });
  }
}

