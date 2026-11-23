import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { requireAdmin } from "@/lib/auth";
import type { ApiResponse } from "@/types";

// PATCH /api/services/[id] (Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const { id } = params;
    const body = await req.json();

    const service = await prisma.service.update({
      where: { id },
      data: body,
    });

    await logActivity({
      action: "UPDATE",
      entityType: "Service",
      entityId: id,
      description: `Service "${service.title}" updated`,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: service });
  } catch (err) {
    console.error("[services PATCH]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to update service" }, { status: 500 });
  }
}

// DELETE /api/services/[id] (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const { id } = params;
    const service = await prisma.service.delete({ where: { id } });

    await logActivity({
      action: "DELETE",
      entityType: "Service",
      entityId: id,
      description: `Service "${service.title}" deleted`,
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error("[services DELETE]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to delete service" }, { status: 500 });
  }
}

