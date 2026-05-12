"use client";

import { useEffect, useState } from "react";
import { IconUpload } from "@tabler/icons-react";
import AuditComplianceCard from "./ui/auditComplianceCard";
import AuditFooterBar from "./ui/auditFooterBar";
import AuditMetadataCard from "./ui/auditMetadataCard";
import AuditSummaryStrip from "./ui/auditSummaryStrip";
import AuditTrailTable from "./ui/auditTrailTable";
import type { AuditApiPayload } from "./ui/types";

const AUDIT_API_URL = process.env.NEXT_PUBLIC_AUDIT_API_URL ?? "/api/audit";

const EMPTY_AUDIT_DATA: AuditApiPayload = {
  title: "Audit Event Stream",
  subtitle: "Loading audit data",
  exportLabel: "Export CSV",
  summary: [
    { id: "events", label: "Indexed Events", value: "0" },
    { id: "volume", label: "Transferred Volume", value: "0", unit: "USDC" },
    { id: "range", label: "Observed Range", value: "Waiting for backend", caption: "No events yet" },
  ],
  tableColumns: [
    { key: "date", label: "Date" },
    { key: "vendor", label: "Signature" },
    { key: "department", label: "Note" },
    { key: "amount", label: "Amount" },
    { key: "address", label: "One-Time Address" },
    { key: "signature", label: "Slot" },
    { key: "explorer", label: "Explorer" },
  ],
  transactions: [],
  compliance: {
    title: "Feed Coverage",
    items: [],
  },
  metadata: {
    title: "Backend Metadata",
    rows: [],
  },
  footer: {
    message: "Loading backend coverage",
    nodeLabel: "Node: loading",
    latencyLabel: "As of loading",
  },
};

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

function downloadAuditCsv(data: AuditApiPayload) {
  const header = ["Date", "Signature", "Note", "Amount", "Currency", "One-Time Address", "Slot", "Explorer"];
  const rows = data.transactions.map((row) => [
    row.date,
    row.id,
    row.department,
    String(row.amount),
    row.currency,
    row.addressDisplay,
    row.signatureDisplay,
    row.explorerUrl,
  ]);

  const csv = [header, ...rows]
    .map((line) =>
      line
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `audit-events-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AuditPage() {
  const [data, setData] = useState<AuditApiPayload>(EMPTY_AUDIT_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const payload = await fetchAudit();
        if (mounted) {
          setData(payload);
          setPageError("");
        }
      } catch (error) {
        if (mounted) {
          setPageError(error instanceof Error ? error.message : "Audit request failed");
        }
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
    <main className="theme-bg min-h-screen p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        {pageError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
            {pageError}
          </div>
        ) : null}

        <section className="space-y-4">
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
              onClick={() => downloadAuditCsv(data)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <IconUpload className="h-4 w-4" stroke={1.5} aria-hidden />
              {isLoading ? "..." : data.exportLabel}
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
