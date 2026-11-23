import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

// In-memory store persistent across warm lambda / node server invocations
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Extracts client IP from NextRequest headers
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Login rate limiter: blocks for 15 minutes after 5 failed attempts
 */
export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  remainingMinutes?: number;
  attemptsLeft?: number;
} {
  const key = `login:${ip}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (record?.blockedUntil && record.blockedUntil > now) {
    const remainingMinutes = Math.ceil((record.blockedUntil - now) / (60 * 1000));
    return { allowed: false, remainingMinutes };
  }

  const attempts = record?.count ?? 0;
  return { allowed: true, attemptsLeft: Math.max(0, 5 - attempts) };
}

export function recordFailedLogin(ip: string): { blocked: boolean; remainingMinutes?: number } {
  const key = `login:${ip}`;
  const now = Date.now();
  const record = rateLimitStore.get(key) ?? { count: 0, resetAt: now + 15 * 60 * 1000 };

  record.count += 1;
  record.resetAt = now + 15 * 60 * 1000;

  if (record.count >= 5) {
    record.blockedUntil = now + 15 * 60 * 1000;
    rateLimitStore.set(key, record);
    return { blocked: true, remainingMinutes: 15 };
  }

  rateLimitStore.set(key, record);
  return { blocked: false };
}

export function resetLoginAttempts(ip: string): void {
  rateLimitStore.delete(`login:${ip}`);
}

/**
 * General purpose sliding-window rate limiter for public forms / endpoints
 */
export function checkGeneralRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true };
}

