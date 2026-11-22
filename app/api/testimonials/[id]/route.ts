import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import type { ApiResponse } from "@/types";

// PATCH /api/testimonials/[id] — approve / unapprove
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { isApproved } = await req.json();

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: { isApproved },
    });

    await logActivity({
      action: isApproved ? "APPROVE" : "UNAPPROVE",
      entityType: "Testimonial",
      entityId: id,
      description: `Testimonial by ${testimonial.clientName} ${isApproved ? "approved" : "unapproved"}`,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: testimonial });
  } catch (err) {
    console.error("[testimonials PATCH]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to update testimonial" }, { status: 500 });
  }
}

// DELETE /api/testimonials/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const testimonial = await prisma.testimonial.delete({ where: { id } });

    await logActivity({
      action: "DELETE",
      entityType: "Testimonial",
      entityId: id,
      description: `Testimonial by ${testimonial.clientName} deleted`,
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error("[testimonials DELETE]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to delete testimonial" }, { status: 500 });
  }
}

