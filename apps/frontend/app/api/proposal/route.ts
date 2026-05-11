import { NextResponse } from "next/server";
import { proposalMockData } from "../../../lib/mockData";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { z } from "zod";
import { createErrorId, errorResponse, fetchWithTimeoutAndRetry, logApiError, parseWithSchema, backendHeaders } from "../_backend";

const BACKEND_BASE_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000";
const COMPANY_ID = process.env.COMPANY_ID ?? "trezo-demo";

const BackendProposalsResponseSchema = z.object({
  success: z.boolean(),
  count: z.coerce.number().optional(),
  data: z
    .array(
      z.object({
        pubkey: z.string(),
        deptAccount: z.string(),
        amountLamports: z.coerce.number(),
        status: z.string(),
        approvalsCount: z.coerce.number().optional(),
        createdAt: z.coerce.number(),
        updatedAt: z.coerce.number().optional(),
        metadataUri: z.string().optional(),
      }),
    )
    .optional(),
});

const BackendTreasuryResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      multisigThreshold: z.coerce.number(),
    })
    .optional(),
});

function toUsdcFromLamports(value: number): number {
  return value / 1_000_000;
}

function formatDateFromUnixSeconds(seconds: number): string {
  return new Date(seconds * 1000).toLocaleDateString("en-US");
}

function normalizeStatus(status: string): "ready" | "pending" | "executed" | "flagged" | "cancelled" {
  const s = status.toLowerCase();
  if (s.includes("execut")) return "executed";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("flag")) return "flagged";
  if (s.includes("ready")) return "ready";
  return "pending";
}

async function fetchBackend<T>(path: string, schema: z.ZodSchema<T>): Promise<{ payload: T | null; invalid: boolean }> {
  try {
    const res = await fetchWithTimeoutAndRetry(`${BACKEND_BASE_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: backendHeaders(),
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse(401, "Unauthorized");
    }

    const [proposalsRes, treasuryRes] = await Promise.all([
      fetchBackend(`/api/proposals/${COMPANY_ID}`, BackendProposalsResponseSchema),
      fetchBackend(`/api/treasury/${COMPANY_ID}`, BackendTreasuryResponseSchema),
    ]);

    if (proposalsRes.invalid || treasuryRes.invalid) {
      return errorResponse(502, "Invalid backend response shape");
    }

    if (!proposalsRes.payload || !treasuryRes.payload) {
      return errorResponse(502, "Backend unavailable");
    }

    const threshold = treasuryRes.payload.success ? treasuryRes.payload.data?.multisigThreshold : undefined;
    const proposals = proposalsRes.payload.success ? proposalsRes.payload.data ?? [] : [];
    const total = proposalsRes.payload.success ? proposalsRes.payload.count ?? proposals.length : proposalMockData.totalActive;

    const mapped = proposals.length
      ? proposals.map((p, idx) => {
          const hash = p.pubkey;
          const shortHash = hash.length > 12 ? `${hash.slice(0, 4)}...${hash.slice(-4)}` : hash;
          const signed = p.approvalsCount ?? 0;
          const required = threshold ?? proposalMockData.proposals[0]?.approvals.required ?? 2;

          return {
            id: p.pubkey,
            index: String(idx + 1).padStart(3, "0"),
            vendor: "Metadata unavailable",
            hash: shortHash,
            department: p.deptAccount,
            amount: toUsdcFromLamports(p.amountLamports),
            currency: "USDC",
            category: "Unknown",
            aiScore: 0,
            approvals: {
              signed,
              required,
              reviewers: [],
            },
            status: normalizeStatus(p.status),
            date: formatDateFromUnixSeconds(p.createdAt),
          };
        })
      : proposalMockData.proposals;

    const pendingCount = proposals.filter((p) => normalizeStatus(p.status) === "pending").length;
    const executedCount = proposals.filter((p) => normalizeStatus(p.status) === "executed").length;
    const flaggedCount = proposals.filter((p) => normalizeStatus(p.status) === "flagged").length;

    const payload = {
      ...proposalMockData,
      totalActive: total,
      proposals: mapped,
      governanceMetrics: [
        {
          id: "pending-count",
          label: "Pending",
          value: String(pendingCount),
          helperText: "Awaiting signatures",
          helperTone: "neutral" as const,
        },
        {
          id: "executed-count",
          label: "Executed",
          value: String(executedCount),
          helperText: "Completed payouts",
          helperTone: "positive" as const,
        },
        {
          id: "flagged-count",
          label: "Flagged",
          value: String(flaggedCount),
          helperText: "Needs review",
          helperTone: "critical" as const,
        },
      ],
      auditFeed: [
        { id: "audit-prop-1", title: `Fetched ${proposals.length} proposals`, timeAgo: "just now", tone: "neutral" as const },
      ],
    };

    return NextResponse.json(payload, { status: 200 });
  } catch {
    const errorId = createErrorId("proposal-api");
    logApiError(errorId, "Proposal API failed");
    return errorResponse(500, "Proposal API failed", errorId);
  }
}
