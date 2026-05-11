import { NextResponse } from "next/server";
import { departmentPageMockData } from "../../../lib/mockData";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { z } from "zod";
import { createErrorId, errorResponse, fetchWithTimeoutAndRetry, logApiError, parseWithSchema } from "../_backend";

const BACKEND_BASE_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000";
const COMPANY_ID = process.env.COMPANY_ID ?? "trezo-demo";

const BackendDepartmentsResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .array(
      z.object({
        pubkey: z.string(),
        deptId: z.string(),
        name: z.string(),
        idleThreshold: z.coerce.number(),
        isActive: z.boolean(),
        createdAt: z.coerce.number().optional(),
      }),
    )
    .optional(),
});

const BackendAuditEventsResponseSchema = z.object({
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

function toUsdcFromLamports(value: number): number {
  return value / 1_000_000;
}

function formatUnixDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatRelativeFromUnix(unixSeconds: number) {
  const deltaSeconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  const deltaMinutes = Math.floor(deltaSeconds / 60);
  const deltaHours = Math.floor(deltaMinutes / 60);
  const deltaDays = Math.floor(deltaHours / 24);

  if (deltaSeconds < 60) return `${Math.max(1, deltaSeconds)}s ago`;
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  if (deltaHours < 24) return `${deltaHours}h ago`;
  return `${deltaDays}d ago`;
}

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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse(401, "Unauthorized");
    }
    const { searchParams } = new URL(req.url);
    const requestedDeptId = searchParams.get("deptId");

    const [departmentsRes, auditEventsRes] = await Promise.all([
      fetchBackend(`/api/treasury/${COMPANY_ID}/departments`, BackendDepartmentsResponseSchema),
      fetchBackend("/api/audit/events", BackendAuditEventsResponseSchema),
    ]);

    if (departmentsRes.invalid || auditEventsRes.invalid) {
      return errorResponse(502, "Invalid backend response shape");
    }

    if (!departmentsRes.payload || !auditEventsRes.payload) {
      return errorResponse(502, "Backend unavailable");
    }

    const departments = departmentsRes.payload.success ? departmentsRes.payload.data ?? [] : [];
    const primary =
      departments.find((department) => department.deptId === requestedDeptId || department.pubkey === requestedDeptId) ??
      departments[0];

    if (!primary) {
      return errorResponse(404, "No departments found");
    }

    const capUsdc = Math.max(1, toUsdcFromLamports(primary.idleThreshold));
    const auditEvents = auditEventsRes.payload.success ? auditEventsRes.payload.data ?? [] : [];
    const auditCount = auditEventsRes.payload.count ?? auditEvents.length;
    const totalAuditVolume = auditEvents.reduce((sum, event) => sum + event.amount, 0);
    const latestTimestamp = auditEvents.length ? Math.max(...auditEvents.map((event) => event.timestamp)) : null;
    const earliestTimestamp = auditEvents.length ? Math.min(...auditEvents.map((event) => event.timestamp)) : null;

    const payload = {
      ...departmentPageMockData,
      department: {
        breadcrumbs: {
          parent: "Departments",
          current: primary.name,
        },
        title: `${primary.name} Department`,
        spendingCard: {
          spent: 0,
          cap: capUsdc,
          currency: "USDC",
          fiscalPeriod: "MAY 2025",
          heading: "Spending",
          subHeading: "Budget Status",
        },
        governanceRules: [
          {
            id: "dept-status",
            label: "Department status",
            value: primary.isActive ? "Active" : "Inactive",
            status: primary.isActive ? "healthy" : "warning",
          },
          {
            id: "idle-threshold",
            label: "Idle threshold",
            value: `${capUsdc.toLocaleString("en-US")} USDC`,
            status: "healthy",
          },
          {
            id: "privacy-protocol",
            label: "Privacy protocol",
            value: "Stealth mode: Enabled",
            status: "toggle",
            enabled: true,
          },
        ],
        spendingVelocity: departmentPageMockData.department.spendingVelocity,
      },
      audit: auditEventsRes.payload.success
        ? {
            ...departmentPageMockData.audit,
            subtitle: `Latest events: ${auditEventsRes.payload.count ?? auditEventsRes.payload.data?.length ?? 0}`,
            summary: [
              {
                id: "events",
                label: "Indexed Events",
                value: String(auditCount),
              },
              {
                id: "volume",
                label: "Transferred Volume",
                value: totalAuditVolume.toLocaleString("en-US", { maximumFractionDigits: 2 }),
                unit: "USDC",
              },
              {
                id: "range",
                label: "Observed Range",
                value:
                  earliestTimestamp && latestTimestamp
                    ? `${formatUnixDate(earliestTimestamp)} - ${formatUnixDate(latestTimestamp)}`
                    : "No events yet",
                caption: latestTimestamp ? `Latest ${formatRelativeFromUnix(latestTimestamp)}` : "Waiting for first event",
              },
            ],
          }
        : departmentPageMockData.audit,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch {
    const errorId = createErrorId("department-api");
    logApiError(errorId, "Department API failed");
    return errorResponse(500, "Department API failed", errorId);
  }
}
