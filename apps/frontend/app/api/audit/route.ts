import { NextResponse } from "next/server";
import { auditMockData } from "../../../lib/mockData";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { z } from "zod";
import { createErrorId, errorResponse, fetchWithTimeoutAndRetry, logApiError, parseWithSchema } from "../_backend";

const BACKEND_BASE_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000";

const BackendAuditEventsResponseSchema = z.object({
  success: z.boolean(),
  count: z.coerce.number().optional(),
  data: z
    .array(
      z.object({
        signature: z.string(),
        timestamp: z.coerce.number(),
        ephemeralPubkey: z.string().optional(),
        encryptedNote: z.string().optional(),
        amount: z.coerce.number(),
        slot: z.coerce.number().optional(),
      }),
    )
    .optional(),
});

async function fetchBackend<T>(path: string, schema: z.ZodSchema<T>): Promise<{ payload: T | null; invalid: boolean }> {
  try {
    const res = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return { payload: null, invalid: false };
    const raw = await res.json();
    const parsed = parseWithSchema(schema, raw);
    if (!parsed.data) return { payload: null, invalid: true };
    return { payload: parsed.data, invalid: false };
  } catch {
    return { payload: null, invalid: false };
  }
}

function short(value: string, left = 4, right = 4) {
  if (!value) return "—";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse(401, "Unauthorized");
    }

    const eventsRes = await fetchBackend("/api/audit/events", BackendAuditEventsResponseSchema);
    if (eventsRes.invalid) {
      return errorResponse(502, "Invalid backend response shape");
    }

    if (!eventsRes.payload) {
      return errorResponse(502, "Backend unavailable");
    }

    const events = eventsRes.payload.success ? eventsRes.payload.data ?? [] : [];
    if (!events.length) {
      return errorResponse(404, "No audit events found");
    }

    const totalVolume = events.reduce((sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0), 0);
    const latestTs = Math.max(...events.map((e) => e.timestamp ?? 0));
    const earliestTs = Math.min(...events.map((e) => e.timestamp ?? 0));

    const payload = {
      ...auditMockData,
      subtitle: `Audit events (backend): ${eventsRes.payload.count ?? events.length}`,
      summary: [
        {
          id: "payouts",
          label: "Total Events",
          value: String(eventsRes.payload.count ?? events.length),
          trend: { direction: "up" as const, label: "live" },
        },
        {
          id: "volume",
          label: "Total Volume",
          value: totalVolume.toLocaleString("en-US", { maximumFractionDigits: 2 }),
          unit: "USDC",
        },
        {
          id: "range",
          label: "Date Range",
          value: `${new Date(earliestTs * 1000).toLocaleDateString("en-US")} - ${new Date(latestTs * 1000).toLocaleDateString("en-US")}`,
          caption: "From backend audit feed",
        },
      ],
      transactions: events.slice(0, 50).map((e, idx) => ({
        id: `evt-${idx}`,
        date: new Date(e.timestamp * 1000).toLocaleDateString("en-US"),
        vendor: "—",
        department: "—",
        amount: e.amount,
        currency: "USDC",
        addressDisplay: short(e.ephemeralPubkey ?? "—"),
        signatureDisplay: short(e.signature),
        explorerUrl: "https://solscan.io",
      })),
      metadata: {
        ...auditMockData.metadata,
        rows: [
          { id: "source", label: "Source", value: "Backend: /api/audit/events" },
          { id: "latest", label: "Latest slot", value: String(events.find((e) => e.slot != null)?.slot ?? "—") },
          ...auditMockData.metadata.rows.slice(0, 1),
        ],
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch {
    const errorId = createErrorId("audit-api");
    logApiError(errorId, "Audit API failed");
    return errorResponse(500, "Audit API failed", errorId);
  }
}
