"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CashCard, { type GovernanceRule } from "./ui/cashCard";
import SpendingCard, { type SpendingCardData } from "./ui/spendingCard";
import SpendingGraph, { type SpendingVelocityPoint } from "./ui/spendingGraph";
import {
  auditMockData,
  dashboardMockData,
  departmentMockData,
  departmentPageMockData,
  type DashboardApiPayload,
  type DepartmentApiPayload,
  type DepartmentPageApiPayload,
} from "../../../lib/mockData";
import type { AuditApiPayload } from "../audit/ui/types";
import DepartmentAuditSnapshot from "./ui/departmentAuditSnapshot";

const DEPARTMENT_PAGE_API_URL = process.env.NEXT_PUBLIC_DEPARTMENT_API_URL ?? "/api/department";
const DASHBOARD_API_URL = process.env.NEXT_PUBLIC_DASHBOARD_API_URL ?? "/api/dashboard";
type BackendStatus = "loading" | "connected" | "unauthorized" | "unavailable";

async function fetchDepartmentPageData(): Promise<DepartmentPageApiPayload> {
  const response = await fetch(DEPARTMENT_PAGE_API_URL, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Department fetch failed: ${response.status}`);
  }

  return response.json();
}

async function fetchDashboardData(): Promise<DashboardApiPayload> {
  const response = await fetch(DASHBOARD_API_URL, {
    method: "GET",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const err = new Error(`Dashboard fetch failed: ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  return response.json();
}

function normalizeAuditFromDashboard(payload: Partial<DashboardApiPayload>): AuditApiPayload {
  return payload.audit ?? auditMockData;
}

function mapDashboardToDepartment(payload: Partial<DashboardApiPayload>, deptId?: string | null): DepartmentApiPayload {
  const fallbackDepartment = dashboardMockData.departments[0]!;
  const primaryDepartment =
    (deptId ? payload.departments?.find((d) => d.id === deptId) : payload.departments?.[0]) ?? fallbackDepartment;
  const currency = primaryDepartment.currency ?? "USDC";

  const spendingCard: SpendingCardData = {
    spent: primaryDepartment.budgetSpent,
    cap: primaryDepartment.budgetTotal,
    currency,
    fiscalPeriod: "MAY 2025",
    heading: "Spending",
    subHeading: "Budget Status",
  };

  const governanceRules: GovernanceRule[] = [
    {
      id: "max-payout",
      label: "Max per payout",
      value: "$5,000 USDC",
      status: "healthy",
    },
    {
      id: "daily-limit",
      label: "Daily aggregate limit",
      value: "$20,000 USDC",
      status: "healthy",
    },
    {
      id: "privacy-protocol",
      label: "Privacy protocol",
      value: primaryDepartment.status ? `Stealth mode: ${primaryDepartment.status}` : "Stealth mode: Enabled",
      status: "toggle",
      enabled: true,
    },
  ];

  const spendingVelocity: SpendingVelocityPoint[] = departmentMockData.spendingVelocity.map((point) => ({
    ...point,
  }));

  return {
    breadcrumbs: {
      parent: "Departments",
      current: primaryDepartment.name,
    },
    title: `${primaryDepartment.name} Department`,
    spendingCard,
    governanceRules,
    spendingVelocity,
  };
}

export default function DepartmentPage() {
  const searchParams = useSearchParams();
  const deptId = searchParams.get("deptId");
  const [departmentData, setDepartmentData] = useState<DepartmentApiPayload>(departmentPageMockData.department);
  const [auditData, setAuditData] = useState<AuditApiPayload>(departmentPageMockData.audit);
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("loading");
  const [backendMessage, setBackendMessage] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        // If a deptId is provided, prefer dashboard payload so we can choose the right department client-side
        // without requiring any backend changes.
        const payload = deptId ? null : await fetchDepartmentPageData();
        if (mounted) {
          if (payload) {
            setDepartmentData(payload.department);
            setAuditData(payload.audit);
            setBackendStatus("connected");
            setBackendMessage("");
          } else {
            const dashboardPayload = await fetchDashboardData();
            setDepartmentData(mapDashboardToDepartment(dashboardPayload, deptId));
            setAuditData(normalizeAuditFromDashboard(dashboardPayload));
            setBackendStatus("connected");
            setBackendMessage("");
          }
        }
      } catch (e) {
        const status = (e as Error & { status?: number }).status;
        if (mounted) {
          setDepartmentData(mapDashboardToDepartment(dashboardMockData, deptId));
          setAuditData(normalizeAuditFromDashboard(dashboardMockData));
          if (status === 401) {
            setBackendStatus("unauthorized");
            setBackendMessage("You’re not signed in. Showing demo data.");
          } else {
            setBackendStatus("unavailable");
            setBackendMessage("Backend is unreachable or returned invalid data. Showing demo data.");
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [deptId]);

  const showBanner = backendStatus !== "connected";

  return (
    <div className="min-h-full bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
      <div className="w-full space-y-6">
        {showBanner ? (
          <div
            className={`rounded-2xl border p-4 text-sm font-medium ${
              backendStatus === "unauthorized"
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
                : "border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            }`}
            role="status"
          >
            <span className="font-semibold uppercase tracking-wide">
              {backendStatus === "loading"
                ? "Connecting…"
                : backendStatus === "unauthorized"
                  ? "Demo mode (unauthorized)"
                  : "Demo mode (backend unavailable)"}
            </span>
            {backendMessage ? <span className="ml-2">{backendMessage}</span> : null}
          </div>
        ) : null}
        <section className="space-y-3">
          {/* Breadcrumbs placeholder: reserving this space for upcoming navigation component. */}
          <div className="h-5" />
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            {departmentData.title}
          </h1>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,420px)_1fr]">
          <SpendingCard data={departmentData.spendingCard} isLoading={isLoading} />
          <CashCard rules={departmentData.governanceRules} isLoading={isLoading} />
        </section>

        <section>
          <SpendingGraph data={departmentData.spendingVelocity} isLoading={isLoading} />
        </section>

        <section>
          <DepartmentAuditSnapshot summary={auditData.summary} isLoading={isLoading} />
        </section>
      </div>
    </div>
  );
}
