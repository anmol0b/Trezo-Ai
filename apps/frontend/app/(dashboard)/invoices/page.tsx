 "use client";

import { useEffect, useState } from "react";
import AnalysisPanel from "./ui/analysisPanel";
import HistoryCard from "./ui/historyCard";
import UploadCard from "./ui/uploadCard";
import { type InvoicesApiPayload, type InvoiceHistoryItem } from "../../../lib/mockData";

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

type ParseInvoiceResponse = {
  success: boolean;
  summary?: {
    vendor?: string;
    amountUsdc?: number;
    currency?: string;
    category?: string;
    description?: string;
    dueDate?: string;
    invoiceNumber?: string;
    confidence?: number;
    anomalyFlags?: string[];
    suggestedDepartment?: string;
    metadataUri?: string;
    expiryTimestamp?: number;
  };
  ragResult?: unknown;
};

type ConfirmInvoiceResponse = {
  success: boolean;
  signature?: string;
  proposalPda?: string;
};

const EMPTY_INVOICES_DATA: InvoicesApiPayload = {
  title: "Invoice Processing",
  subtitle: "Financial Intake",
  upload: {
    title: "Upload PDF Invoices",
    helperText: "Drag and drop or click to select files",
    supportedLabel: "SUPPORTED: PDF, JPG, PNG (MAX 10MB)",
  },
  historyTitle: "Recent History",
  history: [],
  analysis: {
    engineStatusLabel: "Active Engine",
    steps: [
      { id: "step-ocr", title: "Extracting Text", description: "Waiting for upload", status: "pending" },
      { id: "step-parse", title: "Parsing Fields", description: "Waiting for upload", status: "pending" },
      { id: "step-history", title: "Checking History", description: "Waiting for upload", status: "pending" },
    ],
    vendorName: "No invoices yet",
    totalAmount: 0,
    currency: "USD",
    category: "Uncategorized",
    department: "operations",
    riskScoreLabel: "N/A",
  },
};

function toRiskLabel(confidence?: number, hasAnomaly?: boolean): string {
  if (hasAnomaly) return "High (anomaly detected)";
  if (typeof confidence !== "number") return "Moderate";
  if (confidence >= 0.9) return "Low";
  if (confidence >= 0.75) return "Moderate";
  return "High";
}

export default function InvoicesPage() {
  const [data, setData] = useState<InvoicesApiPayload>(EMPTY_INVOICES_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastParsePayload, setLastParsePayload] = useState<ParseInvoiceResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const payload = await fetchInvoicesData();
        if (mounted) setData(payload);
      } catch {
        if (mounted) setData(EMPTY_INVOICES_DATA);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("action", "parse");
      formData.set("invoice", file);

      const response = await fetch(INVOICES_API_URL, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`Parse failed: ${response.status}`);
      const payload = (await response.json()) as ParseInvoiceResponse;
      if (!payload.success || !payload.summary) throw new Error("Invalid parse response");

      setLastParsePayload(payload);
      setData((prev) => {
        const summary = payload.summary!;
        const hasAnomaly = (summary.anomalyFlags?.length ?? 0) > 0;
        const newHistoryItem: InvoiceHistoryItem = {
          id: `inv-${Date.now()}`,
          fileName: file.name,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
          invoiceId: summary.invoiceNumber ?? "N/A",
          amount: summary.amountUsdc ?? 0,
          currency: summary.currency ?? "USD",
          status: hasAnomaly ? "flagged" : "processed",
        };

        return {
          ...prev,
          history: [newHistoryItem, ...prev.history].slice(0, 10),
          analysis: {
            ...prev.analysis,
            steps: [
              { id: "step-ocr", title: "Extracting Text", description: "OCR extraction complete", status: "done" },
              { id: "step-parse", title: "Parsing Fields", description: "Invoice fields parsed", status: "done" },
              { id: "step-history", title: "Checking History", description: "Vendor pattern checks complete", status: "done" },
            ],
            insight: hasAnomaly
              ? {
                  id: `insight-${Date.now()}`,
                  tone: "warning",
                  title: "Anomaly detected",
                  message: summary.anomalyFlags?.join(", ") ?? "Potential anomaly found in invoice data",
                }
              : undefined,
            vendorName: summary.vendor ?? prev.analysis.vendorName,
            totalAmount: summary.amountUsdc ?? prev.analysis.totalAmount,
            currency: summary.currency ?? prev.analysis.currency,
            category: summary.category ?? prev.analysis.category,
            department: summary.suggestedDepartment ?? prev.analysis.department,
            paymentTerms: summary.dueDate ? `Due by ${summary.dueDate}` : prev.analysis.paymentTerms,
            riskScoreLabel: toRiskLabel(summary.confidence, hasAnomaly),
          },
        };
      });
    } catch (error) {
      console.error("[InvoicesPage] parse failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!lastParsePayload?.summary) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("action", "confirm");
      formData.set(
        "payload",
        JSON.stringify({
          invoice: lastParsePayload.summary,
          ragResult: lastParsePayload.ragResult ?? {},
          metadataUri: lastParsePayload.summary.metadataUri ?? "ipfs://pending",
        }),
      );

      const response = await fetch(INVOICES_API_URL, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`Confirm failed: ${response.status}`);
      const payload = (await response.json()) as ConfirmInvoiceResponse;
      if (!payload.success) throw new Error("Confirm response not successful");

      setData((prev) => ({
        ...prev,
        analysis: {
          ...prev.analysis,
          steps: prev.analysis.steps.map((step) => ({ ...step, status: "done" })),
          insight: {
            id: `confirm-${Date.now()}`,
            tone: "info",
            title: "Proposal submitted",
            message: `Signed: ${payload.signature ?? "unknown"} · Proposal: ${payload.proposalPda ?? "unknown"}`,
          },
        },
      }));
    } catch (error) {
      console.error("[InvoicesPage] confirm failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
      <div className="w-full space-y-6">
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
              isLoading={isLoading || isSubmitting}
              onSelectFiles={handleSelectFiles}
            />
            <HistoryCard title={data.historyTitle} items={data.history} isLoading={isLoading} />
          </div>

          <div className="lg:sticky lg:top-6">
            <AnalysisPanel
              engineStatusLabel={isSubmitting ? "Processing" : data.analysis.engineStatusLabel}
              analysis={data.analysis}
              isLoading={isLoading}
              onApprove={handleApprove}
              onReject={() => setLastParsePayload(null)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

