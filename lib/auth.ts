import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-zk_x9k_vault" : "zk_x9k_vault";
const FALLBACK_COOKIE_NAMES = ["__Host-zk_x9k_vault", "zk_x9k_vault", "admin_session"];
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-me"
);

export interface AdminPayload {
  role: "admin";
  iat: number;
}

/**
 * Server-side guard to strictly enforce admin authorization in API routes.
 * Returns null if authorized, or a 401 NextResponse if unauthorized.
 */
export async function requireAdmin(req?: NextRequest): Promise<NextResponse | null> {
  let session = await verifyAdminSession();

  if (!session && req) {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = getTokenFromCookieHeader(cookieHeader);
    if (token) {
      session = await verifyToken(token);
    }
  }

  if (!session || session.role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized: Admin session required" },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Creates a signed JWT and sets it as an HTTP-only cookie.
 */
export async function createAdminSession(): Promise<void> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/**
 * Verifies the admin session cookie. Returns payload or null if invalid.
 */
export async function verifyAdminSession(): Promise<AdminPayload | null> {
  try {
    const cookieStore = cookies();
    let token: string | undefined;
    for (const name of FALLBACK_COOKIE_NAMES) {
      const val = cookieStore.get(name)?.value;
      if (val) {
        token = val;
        break;
      }
    }
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

/**
 * Destroys the admin session cookie.
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = cookies();
  for (const name of FALLBACK_COOKIE_NAMES) {
    cookieStore.delete(name);
  }
}

/**
 * Returns the raw token from cookies (for middleware use).
 */
export function getTokenFromCookieHeader(cookieHeader: string): string | undefined {
  const cookiesList = cookieHeader.split(";").map((c) => c.trim());
  for (const name of FALLBACK_COOKIE_NAMES) {
    const match = cookiesList.find((c) => c.startsWith(`${name}=`));
    if (match) {
      return match.split("=")[1];
    }
  }
  return undefined;
}

/**
 * Verifies a raw JWT token string (Edge-compatible, no cookies API).
 */
export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

