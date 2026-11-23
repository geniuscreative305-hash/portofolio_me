import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";
import { requireAdmin } from "@/lib/auth";
import type { ApiResponse, PaginatedResponse, PortfolioItem } from "@/types";

// GET /api/portfolio
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "20", 10));
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Prisma.PortfolioWhereInput = {};
  if (status) where.status = status as never;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.portfolio.findMany({
      where,
      include: { relatedService: { select: { id: true, title: true, slug: true } } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.portfolio.count({ where }),
  ]);

  return NextResponse.json<ApiResponse<PaginatedResponse<PortfolioItem>>>({
    success: true,
    data: {
      items: items as unknown as PortfolioItem[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

// POST /api/portfolio — admin create
export async function POST(req: NextRequest) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const body = await req.json();
    const {
      title, category, shortDesc, fullDescription,
      thumbnailUrl, techStack, liveDemoUrl, relatedServiceId,
      status, isFeatured,
    } = body;

    if (!title || !category || !shortDesc || !fullDescription || !thumbnailUrl) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        title, category, shortDesc, fullDescription,
        thumbnailUrl, techStack: techStack ?? [],
        liveDemoUrl: liveDemoUrl || null,
        relatedServiceId: relatedServiceId || null,
        status: status ?? "DRAFT",
        isFeatured: isFeatured ?? false,
      },
    });

    await logActivity({
      action: "CREATE",
      entityType: "Portfolio",
      entityId: portfolio.id,
      description: `Portfolio "${title}" created with status ${portfolio.status}`,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: portfolio });
  } catch (err) {
    console.error("[portfolio POST]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to create portfolio item" }, { status: 500 });
  }
}

