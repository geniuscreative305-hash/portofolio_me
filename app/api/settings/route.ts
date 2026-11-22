import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import bcrypt from "bcryptjs";
import type { ApiResponse, SiteSettingItem } from "@/types";

// GET /api/settings — returns public-safe settings (no pinHash)
export async function GET() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: "global" },
    select: {
      id: true,
      heroRoles: true,
      heroHeadline: true,
      heroSubheadline: true,
      whatsappNumber: true,
      isOpenOrder: true,
      updatedAt: true,
    },
  });

  if (!setting) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Settings not found" }, { status: 404 });
  }

  return NextResponse.json<ApiResponse<SiteSettingItem>>({ success: true, data: setting as unknown as SiteSettingItem });
}

// PATCH /api/settings
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { heroRoles, heroHeadline, heroSubheadline, whatsappNumber, isOpenOrder, currentPin, newPin } = body;

    const updateData: Record<string, unknown> = {};

    if (heroRoles !== undefined) updateData.heroRoles = heroRoles;
    if (heroHeadline !== undefined) updateData.heroHeadline = heroHeadline;
    if (heroSubheadline !== undefined) updateData.heroSubheadline = heroSubheadline;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
    if (isOpenOrder !== undefined) updateData.isOpenOrder = isOpenOrder;

    // PIN change — verify current PIN first
    if (newPin) {
      if (!currentPin) {
        return NextResponse.json<ApiResponse>({ success: false, error: "Current PIN required to change PIN" }, { status: 400 });
      }

      const setting = await prisma.siteSetting.findUnique({
        where: { id: "global" },
        select: { adminPinHash: true },
      });

      const isValid = await bcrypt.compare(currentPin, setting!.adminPinHash);
      if (!isValid) {
        return NextResponse.json<ApiResponse>({ success: false, error: "Current PIN is incorrect" }, { status: 401 });
      }

      updateData.adminPinHash = await bcrypt.hash(newPin, 12);
    }

    const updated = await prisma.siteSetting.update({
      where: { id: "global" },
      data: updateData,
      select: {
        id: true, heroRoles: true, heroHeadline: true, heroSubheadline: true,
        whatsappNumber: true, isOpenOrder: true, updatedAt: true,
      },
    });

    await logActivity({
      action: "SETTINGS_UPDATE",
      entityType: "SiteSetting",
      description: `Settings updated: ${Object.keys(updateData).filter((k) => k !== "adminPinHash").join(", ")}${newPin ? ", adminPin" : ""}`,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: updated });
  } catch (err) {
    console.error("[settings PATCH]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}

