"use client";

import { useEffect, useState } from "react";
import ActivePositionsCard from "./ui/activePositionsCard";
import { AuditLogCard, MarketRatesCard } from "./ui/simpleListCard";
import SummaryCards from "./ui/summaryCards";
import type { YieldApiPayload } from "./ui/types";

const YIELD_API_URL = process.env.NEXT_PUBLIC_YIELD_API_URL ?? "/api/yield";

const EMPTY_YIELD_DATA: YieldApiPayload = {
  title: "Yield Operations",
  subtitle: "Loading treasury yield data",
  summaryCards: [
    { id: "yield-live-capital", title: "Capital In Yield", value: "0", subtext: "USDC", accent: "neutral" },
    { id: "yield-departments", title: "Tracked Departments", value: "0", subtext: "0 active", accent: "neutral" },
    { id: "yield-proposals", title: "Pending Proposals", value: "0", subtext: "Waiting for backend", accent: "neutral" },
  ],
  positions: [],
  marketRates: [],
  auditLog: [],
  meta: {
    companyId: "loading",
    treasuryPaused: false,
    yieldEndpointAvailable: false,
    kaminoStatsAvailable: false,
    message: "Loading backend coverage",
  },
};

async function fetchYieldData(): Promise<YieldApiPayload> {
  const response = await fetch(YIELD_API_URL, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Yield fetch failed: ${response.status}`);
  }

  return response.json();
}

export default function YieldPage() {
  const [yieldData, setYieldData] = useState<YieldApiPayload>(EMPTY_YIELD_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const payload = await fetchYieldData();
        if (mounted) {
          setYieldData(payload);
          setPageError("");
        }
      } catch (error) {
        if (mounted) {
          setPageError(error instanceof Error ? error.message : "Yield request failed");
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
        {pageError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
            {pageError}
          </div>
        ) : null}

        <section className="space-y-3">
          <div className="h-5" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Company {yieldData.meta?.companyId ?? "unknown"}
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
                {yieldData.title ?? "Yield Operations"}
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{yieldData.subtitle}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  yieldData.meta?.yieldEndpointAvailable
                    ? "border border-emerald-300/70 bg-emerald-100 text-emerald-700 dark:border-emerald-600/40 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "border border-amber-300/70 bg-amber-100 text-amber-700 dark:border-amber-600/40 dark:bg-amber-900/30 dark:text-amber-300"
                }`}
              >
                {yieldData.meta?.yieldEndpointAvailable ? "Live yield route" : "Derived from treasury config"}
              </span>
              {yieldData.meta?.treasuryPaused ? (
                <span className="inline-flex items-center rounded-full border border-rose-300/70 bg-rose-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700 dark:border-rose-600/40 dark:bg-rose-900/30 dark:text-rose-300">
                  Treasury paused
                </span>
              ) : null}
            </div>
          </div>

          {yieldData.meta?.message ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              {yieldData.meta.message}
            </div>
          ) : null}
        </section>

        <SummaryCards data={yieldData.summaryCards} isLoading={isLoading} />
        <ActivePositionsCard positions={yieldData.positions} isLoading={isLoading} />
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <MarketRatesCard data={yieldData.marketRates} isLoading={isLoading} />
          <AuditLogCard data={yieldData.auditLog} isLoading={isLoading} />
        </section>
      </div>
    </div>
  );
}
