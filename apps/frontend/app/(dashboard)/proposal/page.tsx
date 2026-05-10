"use client";

import { useEffect, useState } from "react";
import GovernanceMetrics from "./ui/governanceMetrics";
import LiveAuditFeed from "./ui/liveAuditFeed";
import ProposalFilters from "./ui/proposalFilters";
import ProposalTable from "./ui/proposalTable";
import { proposalMockData, type ProposalApiPayload } from "../../../lib/mockData";

const PROPOSAL_API_URL = process.env.NEXT_PUBLIC_PROPOSAL_API_URL ?? "/api/proposal";

async function fetchProposalData(): Promise<ProposalApiPayload> {
  const response = await fetch(PROPOSAL_API_URL, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Proposal fetch failed: ${response.status}`);
  }

  return response.json();
}

export default function ProposalPage() {
  const [proposalData, setProposalData] = useState<ProposalApiPayload>(proposalMockData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const payload = await fetchProposalData();
        if (mounted) {
          setProposalData(payload);
        }
      } catch {
        if (mounted) {
          setProposalData(proposalMockData);
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
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <section className="space-y-4">
          {/* Breadcrumbs placeholder: reserving this space for upcoming navigation component. */}
          <div className="h-5" />

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
                {proposalData.title}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                {proposalData.subtitle} ({proposalData.totalActive} active)
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-xl border border-violet-300 bg-violet-500/80 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-violet-500 dark:border-violet-500/50 dark:bg-violet-500/60"
            >
              + New Proposal
            </button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <ProposalFilters filters={proposalData.filters} isLoading={isLoading} />
            <div className="h-10 w-full max-w-xs rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              <div className="flex h-full items-center">Filter by vendor or hash...</div>
            </div>
          </div>
        </section>

        <section>
          <ProposalTable data={proposalData.proposals} isLoading={isLoading} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <GovernanceMetrics data={proposalData.governanceMetrics} isLoading={isLoading} />
          <LiveAuditFeed data={proposalData.auditFeed} isLoading={isLoading} />
        </section>
      </div>
    </main>
  );
}
