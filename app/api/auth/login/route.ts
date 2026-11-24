import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { getClientIp, checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import type { ApiResponse } from "@/types";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { getClientIp, checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from "@/lib/rate-limit";
import { detectSqlInjection, timingSafeMatch } from "@/lib/security";
import bcrypt from "bcryptjs";
import type { ApiResponse } from "@/types";

// POST /api/auth/login — Two-Tier Hardened Admin Gate & Obfuscated Payload Protection
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkLoginRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Terlalu banyak percobaan login yang gagal. Akses diblokir sementara selama ${rateCheck.remainingMinutes ?? 15} menit demi keamanan.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 1. Honeypot Trap Check: Automated bot scraper detector
    if (body._auth_usr_trap || body.username || body.user_login) {
      recordFailedLogin(ip);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Threat signature detected. Access revoked." },
        { status: 400 }
      );
    }

    // 2. Resolve Obfuscated Special Parameter Keys
    const resolvedPin = (body._sec_adm_token ?? body.pin ?? "").toString();
    const resolvedGate = (body._sec_gate_token ?? body.gateKey ?? "").toString();

    // 3. SQL Injection Defense
    if (detectSqlInjection(resolvedPin) || detectSqlInjection(resolvedGate)) {
      recordFailedLogin(ip);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Pola karakter berbahaya terdeteksi. Permintaan dibatalkan." },
        { status: 400 }
      );
    }

    // 4. Tier 1: Security Gate Access Passkey Verification (Timing-Safe)
    const expectedGate = process.env.ADMIN_GATE_KEY || "ADMIN-PRO-2026";
    if (!resolvedGate || !timingSafeMatch(resolvedGate.trim(), expectedGate)) {
      const failStatus = recordFailedLogin(ip);
      if (failStatus.blocked) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Passkey keamanan salah 5 kali berturut-turut. Akses login diblokir selama 15 menit.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Passkey Gerbang Keamanan (Gate Key) tidak valid." },
        { status: 401 }
      );
    }

    // 5. Tier 2: Master Security PIN Verification (Bcrypt)
    if (!resolvedPin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Admin Security PIN wajib diisi." },
        { status: 400 }
      );
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { id: "global" },
      select: { adminPinHash: true },
    });

    if (!setting) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Sistem belum terkonfigurasi." }, { status: 500 });
    }

    const isValid = await bcrypt.compare(resolvedPin, setting.adminPinHash);

    if (!isValid) {
      const failStatus = recordFailedLogin(ip);
      if (failStatus.blocked) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Kombinasi kredensial salah 5 kali berturut-turut. Akses login diblokir sementara selama 15 menit.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Admin Security PIN salah. Silakan periksa kembali." },
        { status: 401 }
      );
    }

    // Success — reset rate limiting counter for this IP
    resetLoginAttempts(ip);

    await createAdminSession();

    await logActivity({
      action: "LOGIN",
      entityType: "Auth",
      description: "Admin authenticated via Hardened Security Gate",
    });

    return NextResponse.json<ApiResponse>({ success: true, message: "Autentikasi berhasil." });
  } catch (err) {
    console.error("[auth/login POST]", err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Gagal memproses autentikasi." }, { status: 500 });
  }
}

