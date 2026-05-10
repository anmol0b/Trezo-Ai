"use client";

import { useEffect, useState } from "react";
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

function normalizeAuditFromDashboard(payload: Partial<DashboardApiPayload>): AuditApiPayload {
  return payload.audit ?? auditMockData;
}

function mapDashboardToDepartment(payload: Partial<DashboardApiPayload>): DepartmentApiPayload {
  const fallbackDepartment = dashboardMockData.departments[0]!;
  const primaryDepartment = payload.departments?.[0] ?? fallbackDepartment;
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
  const [departmentData, setDepartmentData] = useState<DepartmentApiPayload>(departmentPageMockData.department);
  const [auditData, setAuditData] = useState<AuditApiPayload>(departmentPageMockData.audit);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const payload = await fetchDepartmentPageData();
        if (mounted) {
          setDepartmentData(payload.department);
          setAuditData(payload.audit);
        }
      } catch {
        if (mounted) {
          setDepartmentData(mapDashboardToDepartment(dashboardMockData));
          setAuditData(normalizeAuditFromDashboard(dashboardMockData));
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
  }, []);

  return (
    <div className="min-h-full bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
      <div className="w-full space-y-6">
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
