import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookieHeader, verifyToken } from "@/lib/auth";
import { detectSqlInjection } from "@/lib/security";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

// Honeypot trap routes commonly probed by automated scanners and bots
const BOT_TRAP_PATHS = [
  "/wp-admin",
  "/wp-login.php",
  "/administrator",
  "/phpmyadmin",
  "/.env",
  "/.git",
  "/xmlrpc.php",
  "/admin.php",
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Honeypot Trap: Catch bot scanners targeting legacy/common CMS backdoor paths
  if (BOT_TRAP_PATHS.some((trap) => pathname.startsWith(trap) || pathname === trap)) {
    return new NextResponse(
      JSON.stringify({ error: "Access Denied: Threat signature detected." }),
      {
        status: 403,
        headers: { "Content-Type": "application/json", "X-Robots-Tag": "noindex, nofollow" },
      }
    );
  }

  // 2. SQL Injection Inspection on Query Parameters
  if (search && detectSqlInjection(decodeURIComponent(search))) {
    return new NextResponse(
      JSON.stringify({ error: "Bad Request: Malicious payload detected." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 3. Admin Authentication Guard
  if (pathname.startsWith("/admin")) {
    // Allow public login page
    if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Verify JWT from secure session cookie
    const cookieHeader = request.headers.get("cookie") ?? "";
    const token = getTokenFromCookieHeader(cookieHeader);

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("__Host-zk_x9k_vault");
      response.cookies.delete("zk_x9k_vault");
      response.cookies.delete("admin_session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/wp-admin/:path*",
    "/wp-login.php",
    "/administrator/:path*",
    "/phpmyadmin/:path*",
    "/.env",
    "/.git",
    "/api/:path*",
  ],
};

