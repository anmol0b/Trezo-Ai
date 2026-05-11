import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import {
  COMPANY_ID,
  createErrorId,
  errorResponse,
  fetchBackendAndParse,
  formatRelativeFromUnix,
  lamportsToUsdc,
  logApiError,
  shortId,
} from "../_backend";
import {
  AuditEventsResponseSchema,
  DepartmentsResponseSchema,
  KaminoStatsSchema,
  ProposalsResponseSchema,
  TreasuryResponseSchema,
  YieldEndpointSchema,
  type FlexibleYieldRecord,
  type KaminoStatsPayload,
  type YieldEndpointPayload,
} from "../_schemas";

function readYieldRows(raw: YieldEndpointPayload | null) {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : raw.data ?? [];
}

function readRateRows(raw: KaminoStatsPayload | null) {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : raw.data ?? [];
}

function toYieldAmount(record: FlexibleYieldRecord) {
  if (typeof record.amountUsdc === "number") return record.amountUsdc;
  if (typeof record.amount === "number") return record.amount;
  if (typeof record.idleThresholdUsdc === "number") return record.idleThresholdUsdc;
  if (typeof record.idleThreshold === "number") return lamportsToUsdc(record.idleThreshold);
  return 0;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse(401, "Unauthorized");
    }

    const [treasuryResponse, departmentsResponse, proposalsResponse, auditResponse, yieldResponse, statsResponse] =
      await Promise.all([
        fetchBackendAndParse(`/api/treasury/${COMPANY_ID}`, TreasuryResponseSchema),
        fetchBackendAndParse(`/api/treasury/${COMPANY_ID}/departments`, DepartmentsResponseSchema),
        fetchBackendAndParse(`/api/proposals/${COMPANY_ID}`, ProposalsResponseSchema),
        fetchBackendAndParse("/api/audit/events", AuditEventsResponseSchema),
        fetchBackendAndParse(`/api/yield/${COMPANY_ID}`, YieldEndpointSchema),
        fetchBackendAndParse("/api/yield/kamino/stats", KaminoStatsSchema),
      ]);

    if (
      treasuryResponse.invalid ||
      departmentsResponse.invalid ||
      proposalsResponse.invalid ||
      auditResponse.invalid ||
      yieldResponse.invalid ||
      statsResponse.invalid
    ) {
      return errorResponse(502, "Invalid backend response shape");
    }

    const departments = departmentsResponse.data?.success ? departmentsResponse.data.data : [];
    const proposals = proposalsResponse.data?.success ? proposalsResponse.data.data : [];
    const auditEvents = auditResponse.data?.success ? auditResponse.data.data : [];
    const liveYieldRows = readYieldRows(yieldResponse.data);
    const statsRows = readRateRows(statsResponse.data);
    const totalThresholdUsdc = departments.reduce((sum, department) => sum + lamportsToUsdc(department.idleThreshold), 0);
    const pendingProposals = proposals.filter((proposal) => proposal.status.toLowerCase().includes("pending")).length;
    const liveYieldCapital = liveYieldRows.reduce((sum, row) => sum + toYieldAmount(row), 0);
    const latestAudit = auditEvents[0];

    const positions = liveYieldRows.length
      ? liveYieldRows.map((row, index) => {
          const deptId = row.deptId ?? row.department ?? `department-${index + 1}`;
          const name = row.name ?? row.department ?? row.deptId ?? `Department ${index + 1}`;
          return {
            id: deptId,
            team: name,
            provider: row.provider ?? row.protocol ?? "Yield provider",
            market: row.market ?? "Strategy",
            amount: toYieldAmount(row),
            apy: row.apy ?? 0,
            active: row.isActive ?? true,
            autoReinvest: row.autoReinvest ?? false,
            manageHref: `/department?deptId=${encodeURIComponent(deptId)}`,
            iconText: name.slice(0, 1).toUpperCase(),
          };
        })
      : departments.map((department) => ({
          id: department.deptId,
          team: department.name,
          provider: yieldResponse.ok ? "Awaiting position data" : "Yield route unavailable",
          market: department.isActive ? "Idle capital readiness" : "Inactive department",
          amount: lamportsToUsdc(department.idleThreshold),
          apy: 0,
          active: department.isActive,
          autoReinvest: false,
          manageHref: `/department?deptId=${encodeURIComponent(department.deptId)}`,
          iconText: department.name.slice(0, 1).toUpperCase(),
        }));

    const marketRates = statsRows.slice(0, 3).map((row, index) => ({
      id: row.id ?? row.symbol ?? row.market ?? `rate-${index + 1}`,
      label: row.label ?? row.name ?? row.market ?? row.symbol ?? `Market ${index + 1}`,
      apy: row.apy ?? row.apr ?? 0,
      iconText: (row.symbol ?? row.name ?? row.market ?? "M").slice(0, 1).toUpperCase(),
    }));

    const auditLog = (auditEvents.length ? auditEvents : []).slice(0, 3).map((event, index) => ({
      id: event.signature,
      type: index === 0 ? "Latest event" : "Audit event",
      message: `Observed onchain activity ${shortId(event.signature, 6, 6)}`,
      valueHighlight: `${event.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC`,
      timeAgo: formatRelativeFromUnix(event.timestamp),
      tone: index === 0 ? ("info" as const) : ("neutral" as const),
    }));

    const payload = {
      title: "Yield Operations",
      subtitle: liveYieldRows.length
        ? "Live yield positions from backend"
        : "Yield readiness from treasury configuration",
      summaryCards: [
        {
          id: "yield-live-capital",
          title: liveYieldRows.length ? "Capital In Yield" : "Configured Thresholds",
          value: (liveYieldRows.length ? liveYieldCapital : Math.max(totalThresholdUsdc, 0)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }),
          subtext: "USDC",
          accent: "success" as const,
        },
        {
          id: "yield-departments",
          title: "Tracked Departments",
          value: String(departments.length),
          subtext: `${departments.filter((department) => department.isActive).length} active`,
          accent: "neutral" as const,
        },
        {
          id: "yield-proposals",
          title: "Pending Proposals",
          value: String(pendingProposals),
          subtext: latestAudit ? `Latest event ${formatRelativeFromUnix(latestAudit.timestamp)}` : "No audit events yet",
          accent: pendingProposals > 0 ? ("success" as const) : ("neutral" as const),
        },
      ],
      positions,
      marketRates,
      auditLog,
      meta: {
        companyId: treasuryResponse.data?.data?.companyId ?? COMPANY_ID,
        treasuryPaused: treasuryResponse.data?.data?.isPaused ?? false,
        yieldEndpointAvailable: yieldResponse.ok,
        kaminoStatsAvailable: statsResponse.ok,
        message: yieldResponse.ok
          ? "Rendering live yield data from /api/yield."
          : "Backend /api/yield route is unavailable in this repo. The page is showing department thresholds instead of fake yield balances.",
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const errorId = createErrorId("yield-api");
    logApiError(errorId, "Yield API failed", error);
    return errorResponse(500, "Yield API failed", errorId);
  }
}
