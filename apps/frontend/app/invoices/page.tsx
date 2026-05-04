 "use client";

import { useEffect, useState } from "react";
import AnalysisPanel from "./ui/analysisPanel";
import HistoryCard from "./ui/historyCard";
import UploadCard from "./ui/uploadCard";
import { invoicesMockData, type InvoicesApiPayload } from "../../lib/mockData";

const INVOICES_API_URL = process.env.NEXT_PUBLIC_INVOICES_API_URL ?? "/api/invoices";

async function fetchInvoicesData(): Promise<InvoicesApiPayload> {
  const response = await fetch(INVOICES_API_URL, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Invoices fetch failed: ${response.status}`);
  }

  return response.json();
}

export default function InvoicesPage() {
  const [data, setData] = useState<InvoicesApiPayload>(invoicesMockData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const payload = await fetchInvoicesData();
        if (mounted) setData(payload);
      } catch {
        if (mounted) setData(invoicesMockData);
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
    <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="space-y-3">
          {/* Breadcrumbs placeholder: reserving this space for upcoming navigation component. */}
          <div className="h-5" />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{data.subtitle}</p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">{data.title}</h1>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-6">
          <div className="space-y-4 lg:space-y-6">
            <UploadCard
              title={data.upload.title}
              helperText={data.upload.helperText}
              supportedLabel={data.upload.supportedLabel}
              isLoading={isLoading}
              onSelectFiles={() => undefined}
            />
            <HistoryCard title={data.historyTitle} items={data.history} isLoading={isLoading} />
          </div>

          <div className="lg:sticky lg:top-6">
            <AnalysisPanel engineStatusLabel={data.analysis.engineStatusLabel} analysis={data.analysis} isLoading={isLoading} />
          </div>
        </section>
      </div>
    </main>
  );
}

