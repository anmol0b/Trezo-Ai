import { NextResponse } from "next/server";
import { dashboardMockData } from "../../../lib/mockData";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { z } from "zod";
import { createErrorId, errorResponse, fetchWithTimeoutAndRetry, logApiError, parseWithSchema , backendHeaders } from "../_backend";


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
  data: z.array(
    z.object({
      pubkey: z.string(),
      deptAccount: z.string().optional(),
      status: z.string(),
      amountLamports: z.union([z.coerce.number(), z.string()]).optional(),
      approvalsCount: z.coerce.number().optional(),
      createdAt: z.union([z.coerce.number(), z.string()]).optional(),
    }),
  ).optional(),
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
      headers: backendHeaders(), // ← replace { "Content-Type": "application/json" } with this
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

function shortId(value: string, left = 6, right = 6) {
  if (!value) return "—";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function relativeMinutes(unixSeconds: number) {
  return `${Math.max(1, Math.floor((Date.now() / 1000 - unixSeconds) / 60))}m ago`;
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
    const departmentsData = departmentsRes.payload.success ? departmentsRes.payload.data ?? [] : [];
    const proposalsData = proposalsRes.payload.success ? proposalsRes.payload.data ?? [] : [];
    const auditData = auditEventsRes.payload.success ? auditEventsRes.payload.data ?? [] : [];
    const proposalVolumeUsdc = proposalsData.reduce((sum, item) => sum + toUsdcFromLamports(Number(item.amountLamports ?? 0)), 0);
    const pendingProposals = proposalsData.filter((p) => p.status.toLowerCase() === "pending");
    const activeDepartments = departmentsData.filter((department) => department.isActive);
    const inactiveDepartments = departmentsData.filter((department) => !department.isActive);

    const summaryCards = [
      {
        title: "Proposal Volume",
        value: proposalVolumeUsdc,
        currency: "USDC",
        description: "Derived from proposal amounts returned by the backend",
      },
      {
        title: "Active Departments",
        value: activeDepartments.length,
        description: departmentsData.length ? departmentsData.map((d) => d.name).join(" · ") : "No departments returned yet",
      },
      {
        title: "Pending Proposals",
        value: pendingProposals.length,
        description: treasuryData ? `Multisig threshold: ${treasuryData.multisigThreshold}` : "Treasury config unavailable",
      },
      {
        title: "Indexed Audit Events",
        value: auditData.length,
        description: auditData[0] ? `Latest ${relativeMinutes(auditData[0].timestamp)}` : "No audit events indexed yet",
      },
    ];

    const mappedDepartments = departmentsData.map((item) => ({
      id: item.deptId,
      name: item.name,
      walletAddress: item.pubkey,
      status: item.isActive ? "Active" : "Inactive",
      budgetSpent: 0,
      budgetTotal: Math.max(toUsdcFromLamports(item.idleThreshold), 1),
      currency: "USDC",
      spendingRule: `Idle threshold: ${toUsdcFromLamports(item.idleThreshold).toLocaleString("en-US")} USDC`,
      detailsHref: `/department?deptId=${encodeURIComponent(item.deptId)}`,
    }));

    const mappedLiveActivities = auditData.slice(0, 6).map((item, index) => ({
      id: `audit-${index}`,
      title: `Audit event ${shortId(item.signature)}`,
      subtitle: "Onchain activity observed",
      amount: item.amount,
      currency: "USDC",
      timeAgo: relativeMinutes(item.timestamp),
      tone: "info" as const,
    }));

    const mappedInsights = [
      pendingProposals.length > 0
        ? {
            id: "insight-pending-proposals",
            title: "Approval queue",
            message: `${pendingProposals.length} proposal${pendingProposals.length === 1 ? "" : "s"} are waiting for signer action.`,
            recommendation: "Review pending proposals and clear the approval backlog.",
            tone: "warning" as const,
            icon: "⏳",
            dismissLabel: "Dismiss",
            actionLabel: "Open Queue",
            actionHref: "/proposal?status=pending",
          }
        : null,
      inactiveDepartments.length > 0
        ? {
            id: "insight-inactive-departments",
            title: "Department coverage",
            message: `${inactiveDepartments.length} department${inactiveDepartments.length === 1 ? "" : "s"} are marked inactive in treasury config.`,
            recommendation: "Review department activation and idle thresholds in settings.",
            tone: "critical" as const,
            icon: "⚠",
            dismissLabel: "Dismiss",
            actionLabel: "Open Settings",
            actionHref: "/settings",
          }
        : null,
      activeDepartments.length > 0
        ? {
            id: "insight-yield-readiness",
            title: "Automation readiness",
            message: `${activeDepartments.length} active department${activeDepartments.length === 1 ? "" : "s"} have treasury thresholds configured.`,
            recommendation: "Review yield readiness and treasury automation coverage.",
            tone: "positive" as const,
            icon: "↗",
            dismissLabel: "Dismiss",
            actionLabel: "Open Yield",
            actionHref: "/yield",
          }
        : null,
      auditData.length === 0
        ? {
            id: "insight-empty-audit-feed",
            title: "Audit coverage",
            message: "No audit events have been indexed yet, so live activity is limited.",
            recommendation: "Open the audit feed to confirm the backend indexer is healthy.",
            tone: "warning" as const,
            icon: "🔎",
            dismissLabel: "Dismiss",
            actionLabel: "Open Audit",
            actionHref: "/audit",
          }
        : null,
    ].filter((item): item is NonNullable<typeof item> => Boolean(item));

    // const payload = {
    //   ...dashboardMockData,
    //   summaryCards,
    //   departments: mappedDepartments,
    //   insights: mappedInsights,
    //   liveActivities: mappedLiveActivities,
    // };
    const payload = {
      summaryCards,
      departments: mappedDepartments,
      insights: mappedInsights,
      liveActivities: mappedLiveActivities,
      proposal: dashboardMockData.proposal, 
      audit: dashboardMockData.audit,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch {
    const errorId = createErrorId("dashboard-api");
    logApiError(errorId, "Dashboard API failed");
    return errorResponse(500, "Dashboard API failed", errorId);
  }
}
