import { z } from "zod";
import { NextResponse } from "next/server";

const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_RETRIES = 2;

export const BACKEND_BASE_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000";
export const COMPANY_ID = process.env.COMPANY_ID ?? "trezo-demo";

export function createErrorId(prefix = "api") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function logApiError(errorId: string, message: string, cause?: unknown) {
  console.error(`[${errorId}] ${message}`, cause);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const BACKEND_API_SECRET = process.env.BACKEND_API_SECRET;

export function backendHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(BACKEND_API_SECRET ? { 'x-api-key': BACKEND_API_SECRET } : {}),
    ...extra,
  };
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
    { error, errorId: errorId ?? createErrorId("api"), status },
    { status },
  );
}

export type ParsedBackendResponse<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  invalid: boolean;
};

export async function fetchBackendAndParse<T>(
  path: string,
  schema: z.ZodSchema<T>,
  init: RequestInit = {},
): Promise<ParsedBackendResponse<T>> {
  try {
    const response = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}${path}`, {
      cache: "no-store",
      ...init,
      headers: {
        ...backendHeaders(),
        ...(init.headers as Record<string, string> ?? {}),
      },
    });

    if (!response.ok) {
      return { ok: false, status: response.status, data: null, invalid: false };
    }

    const raw = await response.json();
    const parsed = parseWithSchema(schema, raw);

    return {
      ok: true,
      status: response.status,
      data: parsed.data,
      invalid: !parsed.data,
    };
  } catch {
    return { ok: false, status: 0, data: null, invalid: false };
  }
}

export function shortId(value: string, left = 4, right = 4) {
  if (!value) return "—";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export function formatUnixDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function formatRelativeFromUnix(unixSeconds: number) {
  const deltaSeconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (deltaSeconds < 60) return `${Math.max(1, deltaSeconds)}s ago`;
  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;
  return `${Math.floor(deltaHours / 24)}d ago`;
}

export function lamportsToUsdc(value: number) {
  return value / 1_000_000;
}