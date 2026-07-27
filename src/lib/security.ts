import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function validateBody<T extends z.ZodType>(schema: T, payload: unknown): z.infer<T> {
  return schema.parse(payload);
}

export function rateLimit(request: NextRequest, limit = 20, windowMs = 60_000) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  current.count += 1;
  return null;
}

export function assertCsrf(request: NextRequest) {
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  if (!unsafe) return null;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    return NextResponse.json({ error: "Missing origin" }, { status: 403 });
  }

  if (new URL(origin).host !== host) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  return null;
}
