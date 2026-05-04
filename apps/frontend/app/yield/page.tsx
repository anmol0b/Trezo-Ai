"use client";

import { useEffect, useState } from "react";
import { yieldMockData } from "../../lib/mockData";
import ActivePositionsCard from "./ui/activePositionsCard";
import { AuditLogCard, MarketRatesCard } from "./ui/simpleListCard";
import SummaryCards from "./ui/summaryCards";
import type { YieldApiPayload } from "./ui/types";

const YIELD_API_URL = process.env.NEXT_PUBLIC_YIELD_API_URL ?? "/api/yield";

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
  const [yieldData, setYieldData] = useState<YieldApiPayload>(yieldMockData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const payload = await fetchYieldData();
        if (mounted) {
          setYieldData(payload);
        }
      } catch {
        if (mounted) {
          setYieldData(yieldMockData);
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
    <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <SummaryCards data={yieldData.summaryCards} isLoading={isLoading} />
        <ActivePositionsCard positions={yieldData.positions} isLoading={isLoading} />
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <MarketRatesCard data={yieldData.marketRates} isLoading={isLoading} />
          <AuditLogCard data={yieldData.auditLog} isLoading={isLoading} />
        </section>
      </div>
    </main>
  );
}
