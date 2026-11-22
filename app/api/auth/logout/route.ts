import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import type { ApiResponse } from "@/types";

// POST /api/auth/logout
export async function POST() {
  await destroyAdminSession();
  await logActivity({
    action: "LOGOUT",
    entityType: "Auth",
    description: "Admin logged out",
  });
  return NextResponse.json<ApiResponse>({ success: true });
}

