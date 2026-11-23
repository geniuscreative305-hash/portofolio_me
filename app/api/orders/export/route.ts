import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";
import { requireAdmin } from "@/lib/auth";
import type { ApiResponse } from "@/types";

// GET /api/orders/export — CSV export (Admin only)
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status as never;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const orders = await prisma.order.findMany({
    where,
    include: { service: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  const csvHeader = "Order Code,Client Name,Service,Budget Estimate,Status,Project Brief,Admin Note,Created At\n";
  const csvRows = orders
    .map((o) =>
      [
        o.orderCode,
        `"${o.clientName.replace(/"/g, '""')}"`,
        `"${o.service.title.replace(/"/g, '""')}"`,
        `"${o.budgetEstimate.replace(/"/g, '""')}"`,
        o.status,
        `"${o.projectBrief.replace(/"/g, '""')}"`,
        `"${(o.adminNote ?? "").replace(/"/g, '""')}"`,
        o.createdAt.toISOString(),
      ].join(",")
    )
    .join("\n");

  const csv = csvHeader + csvRows;

  await logActivity({
    action: "EXPORT",
    entityType: "Order",
    description: `Exported ${orders.length} orders to CSV`,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

