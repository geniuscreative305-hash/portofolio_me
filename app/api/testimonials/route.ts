import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import type { ApiResponse, PaginatedResponse, TestimonialItem } from "@/types";

// GET /api/testimonials
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "20", 10));
  const approvedOnly = searchParams.get("approved") === "true";

  const where = approvedOnly ? { isApproved: true } : {};

  const [items, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.testimonial.count({ where }),
  ]);

  return NextResponse.json<ApiResponse<PaginatedResponse<TestimonialItem>>>({
    success: true,
    data: {
      items: items as unknown as TestimonialItem[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

// POST /api/testimonials — public submission (anti-spam)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderCode, clientName, clientRole, rating, content } = body;

    if (!orderCode || !clientName || !clientRole || !rating || !content) {
      return NextResponse.json<ApiResponse>({ success: false, error: "All fields are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Rating must be 1-5" }, { status: 400 });
    }

    // Anti-spam: verify order exists and testimonial not yet submitted
    const order = await prisma.order.findUnique({
      where: { orderCode },
      select: { id: true, hasSubmittedTestimonial: true, status: true },
    });

    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Order code not found" }, { status: 404 });
    }

    if (order.hasSubmittedTestimonial) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "A testimonial has already been submitted for this order",
      }, { status: 409 });
    }

    // Create testimonial + flip flag atomically
    const [testimonial] = await prisma.$transaction([
      prisma.testimonial.create({
        data: { orderCode, clientName, clientRole, rating, content, isApproved: false },
      }),
      prisma.order.update({
        where: { orderCode },
        data: { hasSubmittedTestimonial: true },
      }),
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: testimonial,
      message: "Thank you! Your testimonial is pending review.",
    });
  } catch (err) {
    console.error("[testimonials POST]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to submit testimonial" }, { status: 500 });
  }
}

