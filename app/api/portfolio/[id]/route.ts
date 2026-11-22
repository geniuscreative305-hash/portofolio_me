import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteBlob } from "@/lib/blob";
import { logActivity } from "@/lib/activity-logger";
import type { ApiResponse } from "@/types";

// PATCH /api/portfolio/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // If thumbnailUrl is changing, delete the old blob
    if (body.thumbnailUrl) {
      const existing = await prisma.portfolio.findUnique({
        where: { id },
        select: { thumbnailUrl: true },
      });
      if (existing?.thumbnailUrl && existing.thumbnailUrl !== body.thumbnailUrl) {
        await deleteBlob(existing.thumbnailUrl);
      }
    }

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: body,
    });

    await logActivity({
      action: "UPDATE",
      entityType: "Portfolio",
      entityId: id,
      description: `Portfolio "${portfolio.title}" updated`,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: portfolio });
  } catch (err) {
    console.error("[portfolio PATCH]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to update portfolio" }, { status: 500 });
  }
}

// DELETE /api/portfolio/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const portfolio = await prisma.portfolio.delete({ where: { id } });

    // Auto-cleanup blob
    await deleteBlob(portfolio.thumbnailUrl);

    await logActivity({
      action: "DELETE",
      entityType: "Portfolio",
      entityId: id,
      description: `Portfolio "${portfolio.title}" deleted and blob cleaned up`,
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error("[portfolio DELETE]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to delete portfolio" }, { status: 500 });
  }
}

