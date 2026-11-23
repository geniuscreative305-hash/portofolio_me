import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/blob";
import { requireAdmin } from "@/lib/auth";
import type { ApiResponse } from "@/types";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

// POST /api/upload — image upload via Vercel Blob (Strict Admin Only)
export async function POST(req: NextRequest) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) ?? "portfolio";

    if (!file) {
      return NextResponse.json<ApiResponse>({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Strict MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Format berkas tidak diizinkan. Hanya format JPEG, PNG, dan WebP yang didukung.",
        },
        { status: 400 }
      );
    }

    // Strict File Size validation (Max 4MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Ukuran berkas melebihi batas maksimal 4MB.",
        },
        { status: 400 }
      );
    }

    const result = await uploadImage(file, folder);

    return NextResponse.json<ApiResponse>({ success: true, data: result });
  } catch (err: unknown) {
    const e = err as Error;
    console.error("[upload POST]", e);
    return NextResponse.json<ApiResponse>(
      { success: false, error: e.message ?? "Upload failed" },
      { status: 400 }
    );
  }
}

