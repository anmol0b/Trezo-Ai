"use client";

import { useEffect, useState } from "react";
import { IconUpload } from "@tabler/icons-react";
import AuditSummaryStrip from "./ui/auditSummaryStrip";
import AuditTrailTable from "./ui/auditTrailTable";
import AuditComplianceCard from "./ui/auditComplianceCard";
import AuditMetadataCard from "./ui/auditMetadataCard";
import AuditFooterBar from "./ui/auditFooterBar";
import { auditMockData } from "../../../lib/mockData";
import type { AuditApiPayload } from "./ui/types";

const AUDIT_API_URL = process.env.NEXT_PUBLIC_AUDIT_API_URL ?? "/api/audit";

async function fetchAudit(): Promise<AuditApiPayload> {
  const response = await fetch(AUDIT_API_URL, {
    method: "GET",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Audit fetch failed: ${response.status}`);
  }
  return response.json();
}

export default function AuditPage() {
  const [data, setData] = useState<AuditApiPayload>(auditMockData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const payload = await fetchAudit();
        if (mounted) setData(payload);
      } catch {
        if (mounted) setData(auditMockData);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-4 dark:bg-zinc-950 md:p-6">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <section className="space-y-4">
          {/* Breadcrumbs: reserved for future navigation — layout space only. */}
          <div className="h-5" />

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-slate-200 dark:bg-zinc-800" />
                  <div className="h-4 w-full max-w-sm animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold uppercase tracking-tight text-slate-900 dark:text-zinc-50 sm:text-4xl md:text-5xl">
                    {data.title}
                  </h1>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-zinc-400 sm:text-sm">
                    {data.subtitle}
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-800 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <IconUpload className="h-4 w-4" stroke={1.5} aria-hidden />
              {isLoading ? "…" : data.exportLabel}
            </button>
          </div>
        </section>

        <section>
          <AuditSummaryStrip items={data.summary} isLoading={isLoading} />
        </section>

        <section>
          <AuditTrailTable columns={data.tableColumns} rows={data.transactions} isLoading={isLoading} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AuditComplianceCard title={data.compliance.title} items={data.compliance.items} isLoading={isLoading} />
          <AuditMetadataCard title={data.metadata.title} rows={data.metadata.rows} isLoading={isLoading} />
        </section>

        <section>
          <AuditFooterBar
            message={data.footer.message}
            nodeLabel={data.footer.nodeLabel}
            latencyLabel={data.footer.latencyLabel}
            isLoading={isLoading}
          />
        </section>
      </div>
    </main>
  );
}
