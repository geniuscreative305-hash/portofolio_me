import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

const COOKIE_NAME = "admin_session";
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
    const token = cookieStore.get(COOKIE_NAME)?.value;
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
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Returns the raw token from cookies (for middleware use).
 */
export function getTokenFromCookieHeader(cookieHeader: string): string | undefined {
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match?.split("=")[1];
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

