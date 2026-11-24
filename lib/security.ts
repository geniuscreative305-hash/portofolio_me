import crypto from "crypto";

/**
 * SQL Injection pattern detection (Defense-in-Depth)
 * Checks string inputs for common SQL injection signatures
 */
const SQLI_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|TRUNCATE)\b)/i,
  /(--|\#|\/\*)/,
  /('\s*OR\s*['"\d\w]+\s*=\s*['"\d\w]+)/i,
  /("\s*OR\s*['"\d\w]+\s*=\s*['"\d\w]+)/i,
  /(;\s*(WAITFOR|DELAY|BENCHMARK|SLEEP)\s*\()/i,
  /(\bxp_cmdshell\b)/i,
  /(\bSCHEMA\(\)|\bDATABASE\(\)|\bUSER\(\)|\bVERSION\(\))/i,
];

export function detectSqlInjection(input: unknown): boolean {
  if (typeof input !== "string") return false;
  return SQLI_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Timing-safe string comparison to protect against timing attacks
 */
export function timingSafeMatch(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validates binary magic bytes (file signature) directly from file buffer
 * Strictly allows only genuine JPEG, PNG, or WebP images.
 * Rejects executables (MZ / ELF), PHP webshells, or HTML trojans disguised as images.
 */
export function verifyImageMagicBytes(buffer: ArrayBuffer): {
  valid: boolean;
  format?: "jpeg" | "png" | "webp";
  error?: string;
} {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 16) {
    return { valid: false, error: "Berkas terlalu kecil atau rusak." };
  }

  // Check for malicious executable signatures:
  // Windows EXE/DLL ('MZ' -> 0x4D, 0x5A)
  if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
    return { valid: false, error: "Berkas executable (EXE/DLL) terdeteksi dan diblokir." };
  }
  // Linux ELF binary (0x7F, 'E', 'L', 'F')
  if (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) {
    return { valid: false, error: "Berkas binary Linux terdeteksi dan diblokir." };
  }
  // PHP / Script tag opening ("<?php" or "<script")
  const textHead = new TextDecoder("utf-8").decode(bytes.slice(0, 64)).toLowerCase();
  if (textHead.includes("<?php") || textHead.includes("<script") || textHead.includes("<html")) {
    return { valid: false, error: "Script berbahaya / web shell terdeteksi dan diblokir." };
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, format: "jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { valid: true, format: "png" };
  }

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { valid: true, format: "webp" };
  }

  return {
    valid: false,
    error: "Tanda tangan biner tidak cocok dengan format gambar resmi (bukan JPEG, PNG, atau WebP murni).",
  };
}

/**
 * Sanitizes uploaded filename:
 * - Rejects double extensions (e.g., .php.jpg)
 * - Removes path traversal (../)
 * - Removes null bytes (%00)
 */
export function sanitizeFileName(filename: string): { cleanName: string; valid: boolean } {
  if (filename.includes("\0") || filename.includes("%00") || filename.includes("..")) {
    return { cleanName: "", valid: false };
  }

  const parts = filename.split(".");
  // Reject multiple extensions like avatar.php.png
  if (parts.length > 2) {
    const dangerousExts = ["php", "exe", "sh", "phtml", "py", "pl", "cgi", "bat", "cmd", "js", "html", "htm"];
    const hasDangerous = parts.slice(1, -1).some((ext) => dangerousExts.includes(ext.toLowerCase()));
    if (hasDangerous) {
      return { cleanName: "", valid: false };
    }
  }

  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return { cleanName, valid: true };
}
