import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { getClientIp, checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import type { ApiResponse } from "@/types";

// POST /api/auth/login — Brute-force protected admin login
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkLoginRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Terlalu banyak percobaan login yang gagal. Akun diblokir sementara selama ${rateCheck.remainingMinutes ?? 15} menit demi keamanan.`,
        },
        { status: 429 }
      );
    }

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
      const failStatus = recordFailedLogin(ip);
      if (failStatus.blocked) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "PIN salah 5 kali berturut-turut. Akses login diblokir sementara selama 15 menit.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json<ApiResponse>({ success: false, error: "PIN salah. Silakan coba lagi." }, { status: 401 });
    }

    // Success — reset rate limiting counter for this IP
    resetLoginAttempts(ip);

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

