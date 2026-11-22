import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import type { ApiResponse, PaginatedResponse, ServiceItem } from "@/types";

// GET /api/services — public + admin list
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "true";

  const where = activeOnly ? { isActive: true } : {};

  const items = await prisma.service.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json<ApiResponse<ServiceItem[]>>({
    success: true,
    data: items as unknown as ServiceItem[],
  });
}

// POST /api/services — admin create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, category, shortDesc, priceStart, features, isActive, sortOrder } = body;

    if (!title || !slug || !category || !shortDesc || priceStart === undefined) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: { title, slug, category, shortDesc, priceStart, features: features ?? [], isActive: isActive ?? true, sortOrder: sortOrder ?? 0 },
    });

    await logActivity({
      action: "CREATE",
      entityType: "Service",
      entityId: service.id,
      description: `Service "${title}" created`,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: service });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "P2002") {
      return NextResponse.json<ApiResponse>({ success: false, error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to create service" }, { status: 500 });
  }
}

