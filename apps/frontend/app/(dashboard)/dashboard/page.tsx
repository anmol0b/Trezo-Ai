"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AiCardList from "./ui/aiCard";
import CardComponent from "./ui/cardComponent";
import DepartmentCards from "./ui/departmentCard";
import LiveCard from "./ui/liveCard";
import { dashboardMockData, type DashboardApiPayload } from "../../../lib/mockData";

const DASHBOARD_API_URL = process.env.NEXT_PUBLIC_DASHBOARD_API_URL ?? "/api/dashboard";
const DISMISSED_INSIGHTS_KEY = "kosh.dismissedInsights.v1";

type BackendStatus = "loading" | "connected" | "unauthorized" | "unavailable";

async function fetchDashboardData(): Promise<DashboardApiPayload> {
  const response = await fetch(DASHBOARD_API_URL, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = new Error(`Dashboard fetch failed: ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
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
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardApiPayload>(dashboardMockData);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedInsightIds, setDismissedInsightIds] = useState<Set<string>>(() => new Set());
  const dismissedRef = useRef<Set<string>>(new Set());
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("loading");

  const persistDismissed = (next: Set<string>) => {
    dismissedRef.current = next;
    try {
      localStorage.setItem(DISMISSED_INSIGHTS_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // ignore (storage might be blocked)
    }
  };

  const visibleInsights = useMemo(
    () => dashboardData.insights.filter((item) => !dismissedInsightIds.has(item.id)),
    [dashboardData.insights, dismissedInsightIds],
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const payload = await fetchDashboardData();
        if (isMounted) {
          setDashboardData(normalizeDashboardData(payload));
          setBackendStatus("connected");
        }
      } catch (e) {
        const status = (e as Error & { status?: number }).status;
        if (isMounted) {
          if (status === 401) {
            setBackendStatus("unauthorized");
          } else {
            setBackendStatus("unavailable");
          }
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_INSIGHTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const next = new Set(parsed.filter((v) => typeof v === "string"));
      dismissedRef.current = next;
      setDismissedInsightIds(next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Poll for new backend data; keep dismissals sticky.
    const id = window.setInterval(async () => {
      try {
        const payload = await fetchDashboardData();
        setDashboardData(normalizeDashboardData(payload));
        setBackendStatus("connected");
      } catch {
        // Keep current UI but surface the degraded state.
        setBackendStatus((prev) => (prev === "unauthorized" ? prev : "unavailable"));
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="theme-bg min-h-full p-4 md:p-6">
      <div className="w-full space-y-6">
        <CardComponent data={dashboardData.summaryCards} isLoading={isLoading} />
        <DepartmentCards data={dashboardData.departments} isLoading={isLoading} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AiCardList
            data={visibleInsights}
            isLoading={isLoading}
            onDismiss={(id) => {
              setDismissedInsightIds((prev) => {
                const next = new Set([...prev, id]);
                persistDismissed(next);
                return next;
              });
            }}
            onAction={(id, href) => {
              // If the card doesn't specify a destination, default to proposal.
              const target = href && href !== "#" ? href : "/proposal";
              router.push(target);
              // Optional: dismiss after action to reduce noise.
              setDismissedInsightIds((prev) => {
                const next = new Set([...prev, id]);
                persistDismissed(next);
                return next;
              });
            }}
          />
          <LiveCard
            data={dashboardData.liveActivities}
            isLoading={isLoading}
            statusLabel={
              backendStatus === "connected"
                ? "Live backend"
                : backendStatus === "unauthorized"
                  ? "Demo data"
                  : backendStatus === "loading"
                    ? "Connecting"
                    : "Activity feed"
            }
            latencyLabel={
              backendStatus === "connected"
                ? "audit feed"
                : backendStatus === "unauthorized"
                  ? "sign in required"
                  : backendStatus === "loading"
                    ? "initializing"
                    : "offline"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
