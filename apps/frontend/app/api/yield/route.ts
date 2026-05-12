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
  type Department,
  type YieldEndpointPayload,
  type KaminoStatsPayload,
} from "../_schemas";

function readYieldRows(raw: YieldEndpointPayload | null) {
  if (!raw?.data?.positions) return [];
  return raw.data.positions;
}

function readRateRows(raw: KaminoStatsPayload | null) {
  if (!raw?.data) return [];

  const market = raw.data.market || {};
  const vault = raw.data.vault || {};

  return [
    {
      id: "kamino-usdc",
      label: "USDC Market",
      symbol: "USDC",
      apy: market.usdcSupplyApy ?? vault.apy ?? 0,
      apr: market.usdcSupplyApy ?? vault.apy ?? 0,
      market: "Kamino",
      source: market.source ?? "kamino_api",
    },
  ];
}

function toYieldAmount(row: any) {
  // New structure may not have amountUsdc yet
  if (typeof row.amountUsdc === "number") return row.amountUsdc;
  if (typeof row.amount === "number") return row.amount;
  if (typeof row.idleThresholdUsdc === "number") return row.idleThresholdUsdc;
  if (typeof row.idleThreshold === "number") return lamportsToUsdc(row.idleThreshold);
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

    const departments = departmentsResponse.data?.data ?? [];
    const proposals = proposalsResponse.data?.data ?? [];
    const auditEvents = auditResponse.data?.data ?? [];

    const liveYieldRows = readYieldRows(yieldResponse.data);
    const statsRows = readRateRows(statsResponse.data);

    const totalThresholdUsdc = departments.reduce(
      (sum: number, department: Department) => sum + lamportsToUsdc(department.idleThreshold),
      0
    );

    const pendingProposals = proposals.filter((proposal) =>
      proposal.status?.toLowerCase().includes("pending")
    ).length;

    const liveYieldCapital = liveYieldRows.reduce((sum, row) => sum + toYieldAmount(row), 0);

    const latestAudit = auditEvents[0];

    const positions =
      liveYieldRows.length > 0
        ? liveYieldRows.map((row: any, index: number) => {
            const deptId = row.deptId ?? `department-${index + 1}`;
            const name = row.name ?? row.deptId ?? `Department ${index + 1}`;

            return {
              id: deptId,
              team: name,
              provider: "Kamino",
              market: "USDC Lending",
              amount: toYieldAmount(row),
              apy: row.apy ?? 0,
              active: true,
              autoReinvest: true,
              manageHref: `/department?deptId=${encodeURIComponent(deptId)}`,
              iconText: name.slice(0, 1).toUpperCase(),
            };
          })
        : // Fallback when no live positions
          departments.map((department: Department) => ({
            id: department.deptId,
            team: department.name,
            provider: "Awaiting yield position",
            market: department.isActive ? "Idle capital readiness" : "Inactive",
            amount: lamportsToUsdc(department.idleThreshold),
            apy: 0,
            active: department.isActive,
            autoReinvest: false,
            manageHref: `/department?deptId=${encodeURIComponent(department.deptId)}`,
            iconText: department.name.slice(0, 1).toUpperCase(),
          }));

    const marketRates = statsRows.slice(0, 3).map((row: any, index: number) => ({
      id: row.id ?? row.symbol ?? `rate-${index + 1}`,
      label: row.label ?? row.name ?? "USDC Market",
      apy: row.apy ?? row.apr ?? 0,
      iconText: (row.symbol ?? "U").slice(0, 1).toUpperCase(),
    }));

    const auditLog = auditEvents.slice(0, 3).map((event: any, index: number) => ({
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
        ? "Live yield positions from Kamino"
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
          subtext: `${departments.filter((d: Department) => d.isActive).length} active`,
          accent: "neutral" as const,
        },
        {
          id: "yield-proposals",
          title: "Pending Proposals",
          value: String(pendingProposals),
          subtext: latestAudit
            ? `Latest event ${formatRelativeFromUnix(latestAudit.timestamp)}`
            : "No audit events yet",
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
        message: yieldResponse.ok ? "Rendering live yield data from /api/yield" : "",
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const errorId = createErrorId("yield-api");
    logApiError(errorId, "Yield API failed", error);
    return errorResponse(500, "Yield API failed", errorId);
  }
}