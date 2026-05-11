import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../auth/[...nextauth]/options";
import {
  BACKEND_BASE_URL,
  createErrorId,
  errorResponse,
  fetchWithTimeoutAndRetry,
  logApiError,
  parseWithSchema,
  backendHeaders,
} from "../_backend";
import { FiatStatusSchema } from "../_schemas";

const FiatConvertRequestSchema = z.object({
  amountUsdc: z.coerce.number().positive(),
  targetCurrency: z.string().min(1),
  targetIban: z.string().min(1),
  reference: z.string().min(1),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse(401, "Unauthorized");
    }

    const { searchParams } = new URL(req.url);
    const conversionId = searchParams.get("conversionId");

    if (!conversionId) {
      return errorResponse(400, "conversionId is required");
    }

    const response = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}/api/fiat/status/${conversionId}`, {
      method: "GET",
      cache: "no-store",
      headers: backendHeaders(),
    });

    if (!response.ok) {
      return errorResponse(response.status, "Failed to fetch fiat conversion status");
    }

    const rawPayload = await response.json();
    const parsedPayload = parseWithSchema(FiatStatusSchema, rawPayload);

    if (!parsedPayload.data) {
      return errorResponse(502, "Invalid fiat status response");
    }

    return NextResponse.json(parsedPayload.data, { status: 200 });
  } catch (error) {
    const errorId = createErrorId("fiat-get");
    logApiError(errorId, "Fiat status fetch failed", error);
    return errorResponse(500, "Fiat status fetch failed", errorId);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse(401, "Unauthorized");
    }

    const rawBody = await req.json();
    const parsedBody = parseWithSchema(FiatConvertRequestSchema, rawBody);

    if (!parsedBody.data) {
      return errorResponse(400, "Invalid fiat conversion payload");
    }

    const response = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}/api/fiat/convert`, {
      method: "POST",
      headers: backendHeaders(),
      body: JSON.stringify(parsedBody.data),
    });

    if (!response.ok) {
      return errorResponse(response.status, "Fiat conversion request failed");
    }

    const rawPayload = await response.json();
    const parsedPayload = parseWithSchema(FiatStatusSchema, rawPayload);

    if (!parsedPayload.data) {
      return errorResponse(502, "Invalid fiat conversion response");
    }

    return NextResponse.json(parsedPayload.data, { status: 200 });
  } catch (error) {
    const errorId = createErrorId("fiat-post");
    logApiError(errorId, "Fiat conversion request failed", error);
    return errorResponse(500, "Fiat conversion request failed", errorId);
  }
}
