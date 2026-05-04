"use client";

import React, { useEffect, useState } from "react";
import AiCardList from "./ui/aiCard";
import CardComponent from "./ui/cardComponent";
import DepartmentCards from "./ui/departmentCard";
import LiveCard from "./ui/liveCard";
import { dashboardMockData, type DashboardApiPayload } from "../../lib/mockData";

const DASHBOARD_API_URL = process.env.NEXT_PUBLIC_DASHBOARD_API_URL ?? "/api/dashboard";

async function fetchDashboardData(): Promise<DashboardApiPayload> {
  const response = await fetch(DASHBOARD_API_URL, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Dashboard fetch failed: ${response.status}`);
  }

  return response.json();
}

function normalizeDashboardData(payload: Partial<DashboardApiPayload>): DashboardApiPayload {
  return {
    summaryCards: payload.summaryCards ?? dashboardMockData.summaryCards,
    departments: payload.departments ?? dashboardMockData.departments,
    insights: payload.insights ?? dashboardMockData.insights,
    liveActivities: payload.liveActivities ?? dashboardMockData.liveActivities,
    proposal: payload.proposal ?? dashboardMockData.proposal,
    audit: payload.audit ?? dashboardMockData.audit,
    settings: payload.settings ?? dashboardMockData.settings,
  };
}

export const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardApiPayload>(dashboardMockData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const payload = await fetchDashboardData();
        if (isMounted) {
          setDashboardData(normalizeDashboardData(payload));
        }
      } catch {
        if (isMounted) {
          setDashboardData(dashboardMockData);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <CardComponent data={dashboardData.summaryCards} isLoading={isLoading} />
        <DepartmentCards data={dashboardData.departments} isLoading={isLoading} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AiCardList data={dashboardData.insights} isLoading={isLoading} />
          <LiveCard data={dashboardData.liveActivities} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
