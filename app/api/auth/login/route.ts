import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import bcrypt from "bcryptjs";
import type { ApiResponse } from "@/types";

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin || typeof pin !== "string") {
      return NextResponse.json<ApiResponse>({ success: false, error: "PIN is required" }, { status: 400 });
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { id: "global" },
      select: { adminPinHash: true },
    });

    if (!setting) {
      return NextResponse.json<ApiResponse>({ success: false, error: "System not configured" }, { status: 500 });
    }

    const isValid = await bcrypt.compare(pin, setting.adminPinHash);

    if (!isValid) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Invalid PIN" }, { status: 401 });
    }

    await createAdminSession();

    await logActivity({
      action: "LOGIN",
      entityType: "Auth",
      description: "Admin logged in successfully",
    });

    return NextResponse.json<ApiResponse>({ success: true, message: "Login successful" });
  } catch (err) {
    console.error("[auth/login POST]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Login failed" }, { status: 500 });
  }
}

