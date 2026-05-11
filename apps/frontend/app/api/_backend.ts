import { z } from "zod";
import { NextResponse } from "next/server";

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 1;

export function createErrorId(prefix = "api") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function logApiError(errorId: string, message: string, cause?: unknown) {
  console.error(`[${errorId}] ${message}`, cause);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithTimeoutAndRetry(
  url: string,
  init: RequestInit,
  retries = DEFAULT_RETRIES,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);

      // Retry transient backend issues only.
      if (res.status >= 500 && attempt < retries) {
        await sleep(150 * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (attempt < retries) {
        await sleep(150 * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export function parseWithSchema<T>(schema: z.ZodSchema<T>, raw: unknown): { data: T | null; error: string | null } {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: parsed.error.message };
  }
  return { data: parsed.data, error: null };
}

export function errorResponse(status: number, error: string, errorId?: string) {
  return NextResponse.json(
    {
      error,
      errorId: errorId ?? createErrorId("api"),
      status,
    },
    { status },
  );
}

