import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { requireAdmin } from "@/lib/auth";
import { getClientIp, checkGeneralRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, PaginatedResponse, TestimonialItem } from "@/types";

// GET /api/testimonials — public approved list or admin full list
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const approvedOnly = searchParams.get("approved") === "true";

  // If requesting non-approved testimonials, require admin session
  if (!approvedOnly) {
    const authError = await requireAdmin(req);
    if (authError) return authError;
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "20", 10));

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

// POST /api/testimonials — public submission with anti-spam, honeypot & strict validation
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: max 5 submissions per 10 minutes per IP
    const rateCheck = checkGeneralRateLimit(`testimonial:${ip}`, 5, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Terlalu banyak pengiriman testimonial dari perangkat ini. Silakan tunggu beberapa saat.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Honeypot check: website_url must be empty
    if (body.website_url) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Spam submission rejected." },
        { status: 400 }
      );
    }

    const { orderCode, clientName, clientRole, rating, content } = body;

    if (
      typeof orderCode !== "string" ||
      !/^ORD-[A-Z0-9-]+$/i.test(orderCode.trim()) ||
      orderCode.trim().length > 50
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Format kode order tidak valid." },
        { status: 400 }
      );
    }

    if (
      typeof clientName !== "string" ||
      clientName.trim().length < 2 ||
      clientName.trim().length > 100
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Nama harus berupa teks antara 2 hingga 100 karakter." },
        { status: 400 }
      );
    }

    if (
      typeof clientRole !== "string" ||
      clientRole.trim().length < 2 ||
      clientRole.trim().length > 100
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Jabatan / role harus berupa teks antara 2 hingga 100 karakter." },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Rating harus berupa angka bulat 1 sampai 5." },
        { status: 400 }
      );
    }

    if (
      typeof content !== "string" ||
      content.trim().length < 5 ||
      content.trim().length > 1000
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Isi ulasan harus antara 5 hingga 1000 karakter." },
        { status: 400 }
      );
    }

    const cleanOrderCode = orderCode.trim().toUpperCase();

    // Anti-spam: verify order exists and testimonial not yet submitted
    const order = await prisma.order.findUnique({
      where: { orderCode: cleanOrderCode },
      select: { id: true, hasSubmittedTestimonial: true, status: true },
    });

    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Kode order tidak ditemukan." }, { status: 404 });
    }

    if (order.hasSubmittedTestimonial) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "Testimonial untuk kode pesanan ini sudah pernah dikirimkan sebelumnya.",
      }, { status: 409 });
    }

    // Create testimonial + flip flag atomically
    const [testimonial] = await prisma.$transaction([
      prisma.testimonial.create({
        data: {
          orderCode: cleanOrderCode,
          clientName: clientName.trim(),
          clientRole: clientRole.trim(),
          rating: numRating,
          content: content.trim(),
          isApproved: false,
        },
      }),
      prisma.order.update({
        where: { orderCode: cleanOrderCode },
        data: { hasSubmittedTestimonial: true },
      }),
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: testimonial,
      message: "Terima kasih! Testimonial Anda telah diterima dan akan ditampilkan setelah ditinjau.",
    });
  } catch (err) {
    console.error("[testimonials POST]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to submit testimonial" }, { status: 500 });
  }
}

