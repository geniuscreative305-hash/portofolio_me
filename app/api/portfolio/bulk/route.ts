import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteBlobMany } from "@/lib/blob";
import { logActivity } from "@/lib/activity-logger";
import type { ApiResponse, BulkActionPayload } from "@/types";

// POST /api/portfolio/bulk
export async function POST(req: NextRequest) {
  try {
    const body: BulkActionPayload = await req.json();
    const { ids, action } = body;

    if (!ids?.length) {
      return NextResponse.json<ApiResponse>({ success: false, error: "No IDs provided" }, { status: 400 });
    }

    if (action === "delete") {
      // Fetch thumbnail URLs before deleting for blob cleanup
      const items = await prisma.portfolio.findMany({
        where: { id: { in: ids } },
        select: { thumbnailUrl: true },
      });

      await prisma.portfolio.deleteMany({ where: { id: { in: ids } } });
      await deleteBlobMany(items.map((i) => i.thumbnailUrl));

      await logActivity({
        action: "BULK_DELETE",
        entityType: "Portfolio",
        description: `Bulk deleted ${ids.length} portfolio items and cleaned up blobs`,
      });
    } else if (action === "publish") {
      await prisma.portfolio.updateMany({
        where: { id: { in: ids } },
        data: { status: "PUBLISHED" },
      });
      await logActivity({
        action: "BULK_UPDATE",
        entityType: "Portfolio",
        description: `Bulk published ${ids.length} portfolio items`,
      });
    } else if (action === "draft") {
      await prisma.portfolio.updateMany({
        where: { id: { in: ids } },
        data: { status: "DRAFT" },
      });
      await logActivity({
        action: "BULK_UPDATE",
        entityType: "Portfolio",
        description: `Bulk set ${ids.length} portfolio items to DRAFT`,
      });
    } else {
      return NextResponse.json<ApiResponse>({ success: false, error: "Invalid bulk action" }, { status: 400 });
    }

    return NextResponse.json<ApiResponse>({ success: true, message: `Bulk ${action} completed on ${ids.length} items` });
  } catch (err) {
    console.error("[portfolio bulk]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Bulk action failed" }, { status: 500 });
  }
}

