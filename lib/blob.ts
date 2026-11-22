import { put, del } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

export interface UploadResult {
  url: string;
  pathname: string;
}

/**
 * Uploads an image file to Vercel Blob.
 * Validates type (jpg/png/webp) and size (max 4MB).
 */
export async function uploadImage(
  file: File,
  folder: string = "portfolio"
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: jpg, png, webp`);
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 4MB`
    );
  }

  const ext = file.type.split("/")[1];
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return { url: blob.url, pathname: blob.pathname };
}

/**
 * Deletes a Vercel Blob by its URL.
 * Silently ignores if URL is null/empty or not a Blob URL.
 */
export async function deleteBlob(url: string | null | undefined): Promise<void> {
  if (!url) return;
  if (!url.includes("blob.vercel-storage.com")) return;

  try {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  } catch (err) {
    console.warn(`[blob] Failed to delete ${url}:`, err);
  }
}

/**
 * Deletes multiple Vercel Blob URLs in parallel.
 */
export async function deleteBlobMany(urls: (string | null | undefined)[]): Promise<void> {
  await Promise.allSettled(urls.map(deleteBlob));
}

