import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/blob";
import { requireAdmin } from "@/lib/auth";
import { verifyImageMagicBytes, sanitizeFileName } from "@/lib/security";
import type { ApiResponse } from "@/types";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

// POST /api/upload — image upload via Vercel Blob with Deep Anti-Malware / Anti-Virus Inspection
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

    // 1. Filename sanitization & double-extension prevention (.php.jpg / .exe.png)
    const nameSanity = sanitizeFileName(file.name);
    if (!nameSanity.valid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Nama berkas tidak aman atau mengandung ekstensi berbahaya ganda.",
        },
        { status: 400 }
      );
    }

    // 2. Strict MIME type header validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Format berkas tidak diizinkan. Hanya format JPEG, PNG, dan WebP yang didukung.",
        },
        { status: 400 }
      );
    }

    // 3. Strict File Size validation (Max 4MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Ukuran berkas melebihi batas maksimal 4MB.",
        },
        { status: 400 }
      );
    }

    // 4. Deep Binary Magic-Byte Inspection (Anti-Virus / Anti-Malware Header Signature)
    const fileBuffer = await file.arrayBuffer();
    const magicInspection = verifyImageMagicBytes(fileBuffer);
    if (!magicInspection.valid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: magicInspection.error ?? "Deteksi berkas mencurigakan / potensi malware. Berkas ditolak.",
        },
        { status: 400 }
      );
    }

    const safeFile = new File([fileBuffer], nameSanity.cleanName, { type: file.type });
    const result = await uploadImage(safeFile, folder);

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

