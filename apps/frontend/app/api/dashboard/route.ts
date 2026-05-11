import { NextResponse } from "next/server";
import { dashboardMockData } from "../../../lib/mockData";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { z } from "zod";
import { createErrorId, errorResponse, fetchWithTimeoutAndRetry, logApiError, parseWithSchema } from "../_backend";

const BACKEND_BASE_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000";
const COMPANY_ID = process.env.COMPANY_ID ?? "trezo-demo";

const TreasuryResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      pubkey: z.string(),
      companyId: z.string(),
      departmentCount: z.coerce.number(),
      proposalCount: z.coerce.number(),
      isPaused: z.boolean(),
      multisigThreshold: z.coerce.number(),
    })
    .optional(),
});

const DepartmentsResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .array(
      z.object({
        pubkey: z.string(),
        deptId: z.string(),
        name: z.string(),
        idleThreshold: z.coerce.number(),
        isActive: z.boolean(),
      }),
    )
    .optional(),
});

const ProposalsResponseSchema = z.object({
  success: z.boolean(),
  count: z.coerce.number().optional(),
  data: z
    .array(
      z.object({
        pubkey: z.string(),
        deptAccount: z.string(),
        amountLamports: z.coerce.number(),
        status: z.string(),
        createdAt: z.coerce.number(),
      }),
    )
    .optional(),
});

const AuditEventsResponseSchema = z.object({
  success: z.boolean(),
  count: z.coerce.number().optional(),
  data: z
    .array(
      z.object({
        signature: z.string(),
        timestamp: z.coerce.number(),
        amount: z.coerce.number(),
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

function toUsdcFromLamports(value: number): number {
  return value / 1_000_000;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse(401, "Unauthorized");
    }

    const [treasuryRes, departmentsRes, proposalsRes, auditEventsRes] = await Promise.all([
      fetchBackend(`/api/treasury/${COMPANY_ID}`, TreasuryResponseSchema),
      fetchBackend(`/api/treasury/${COMPANY_ID}/departments`, DepartmentsResponseSchema),
      fetchBackend(`/api/proposals/${COMPANY_ID}`, ProposalsResponseSchema),
      fetchBackend("/api/audit/events", AuditEventsResponseSchema),
    ]);

    if (treasuryRes.invalid || departmentsRes.invalid || proposalsRes.invalid || auditEventsRes.invalid) {
      return errorResponse(502, "Invalid backend response shape");
    }

    if (!treasuryRes.payload || !departmentsRes.payload || !proposalsRes.payload || !auditEventsRes.payload) {
      return errorResponse(502, "Backend unavailable");
    }

    const treasuryData = treasuryRes.payload.success ? treasuryRes.payload.data : undefined;
    const departmentsData = departmentsRes.payload.success ? departmentsRes.payload.data : undefined;
    const proposalsData = proposalsRes.payload.success ? proposalsRes.payload.data : undefined;
    const auditData = auditEventsRes.payload.success ? auditEventsRes.payload.data : undefined;

    const treasuryBalanceUsdc =
      proposalsData?.reduce((sum, item) => sum + toUsdcFromLamports(item.amountLamports), 0) ?? null;

    const summaryCards = [
      {
        title: "Treasury Balance",
        value: treasuryBalanceUsdc ?? 0,
        currency: "USDC",
        description: treasuryData ? `Company: ${treasuryData.companyId}` : "",
      },
      {
        title: "Active Departments",
        value: departmentsData?.filter((d) => d.isActive).length ?? 0,
        description: departmentsData?.length
          ? departmentsData.map((d) => d.name).join(" · ")
          : "",
      },
      {
        title: "Pending Proposals",
        value:
          proposalsData?.filter((p) => p.status.toLowerCase() === "pending").length ??
          treasuryData?.proposalCount ??
          0,
        description: treasuryData ? `Multisig threshold: ${treasuryData.multisigThreshold}` : "",
      },
      {
        title: "Yield Earned Today",
        value: 0,
        currency: "USDC",
        description: "Yield endpoint wiring next",
      },
    ];

    const mappedDepartments =
      departmentsData?.map((item) => ({
        id: item.deptId,
        name: item.name,
        walletAddress: item.pubkey,
        status: item.isActive ? "Active" : "Inactive",
        budgetSpent: 0,
        budgetTotal: Math.max(toUsdcFromLamports(item.idleThreshold), 1),
        currency: "USDC",
        spendingRule: `Idle threshold: ${toUsdcFromLamports(item.idleThreshold).toLocaleString("en-US")} USDC`,
        detailsHref: "/department",
      })) ?? [];

    const mappedLiveActivities =
      auditData?.slice(0, 6).map((item, index) => ({
        id: `audit-${index}`,
        title: "Audit event",
        subtitle: item.signature,
        amount: item.amount,
        currency: "USDC",
        timeAgo: `${Math.max(1, Math.floor((Date.now() / 1000 - item.timestamp) / 60))}m ago`,
        tone: "info" as const,
      })) ?? [];

    const payload = {
      ...dashboardMockData,
      summaryCards,
      departments: mappedDepartments,
      liveActivities: mappedLiveActivities,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch {
    const errorId = createErrorId("dashboard-api");
    logApiError(errorId, "Dashboard API failed");
    return errorResponse(500, "Dashboard API failed", errorId);
  }
}
