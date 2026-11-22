import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/blob";
import type { ApiResponse } from "@/types";

// POST /api/upload — image upload via Vercel Blob
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) ?? "portfolio";

    if (!file) {
      return NextResponse.json<ApiResponse>({ success: false, error: "No file provided" }, { status: 400 });
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

