"use client";

import { useEffect, useState } from "react";
import AnalysisPanel from "./ui/analysisPanel";
import HistoryCard from "./ui/historyCard";
import UploadCard from "./ui/uploadCard";
import CustomSelect from "../../../components/ui/customSelect";
import { invoicesMockData, type InvoicesApiPayload, type InvoiceHistoryItem } from "../../../lib/mockData";

const INVOICES_API_URL = process.env.NEXT_PUBLIC_INVOICES_API_URL ?? "/api/invoices";
const FIAT_API_URL = "/api/fiat";

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
  vendorHistory?: {
    vendor: string;
    invoiceCount: number;
    averageAmount: number;
    lastSeenDate: string;
    categories: string[];
  };
  similarInvoices?: Array<{
    vendor: string;
    amount: number;
    date: string;
    category: string;
    similarity: number;
  }>;
  ragResult?: unknown;
};

type ConfirmInvoiceResponse = {
  success: boolean;
  signature?: string;
  proposalPda?: string;
  error?: string;
};

type FiatConversionResponse = {
  success: boolean;
  data: {
    id: string;
    status: string;
    amountUsdc: number;
    targetCurrency: string;
    exchangeRate: number;
    targetAmount: number;
    reference: string;
    createdAt: string;
  };
  error?: string;
};

const EMPTY_INVOICES_DATA: InvoicesApiPayload = {
  title: "Invoice Operations",
  subtitle: "Parse, review, propose, and optionally convert to fiat",
  upload: {
    title: "Upload a PDF invoice",
    helperText: "Select a PDF, review the parsed fields, then create an onchain proposal.",
    supportedLabel: "SUPPORTED: PDF ONLY (MAX 10MB)",
  },
  historyTitle: "Recent invoices",
  history: [],
  analysis: {
    engineStatusLabel: "Ready",
    steps: [
      { id: "step-ocr", title: "Extract text", description: "Waiting for a PDF upload", status: "pending" },
      { id: "step-parse", title: "Parse fields", description: "Parsed data will appear here", status: "pending" },
      { id: "step-history", title: "Check history", description: "Historical matches will appear after parsing", status: "pending" },
    ],
    vendorName: "No invoice selected",
    totalAmount: 0,
    currency: "USD",
    category: "Uncategorized",
    department: "unassigned",
    paymentTerms: "Awaiting parse",
    taxId: "Not proposed yet",
    riskScoreLabel: "Needs review",
  },
  context: {
    companyId: "trezo-demo",
    treasuryPda: "treasury-pda",
    recipientWallet: "recipient-wallet",
    defaultDeptId: "",
    defaultDeptPda: "",
    departments: [],
  },
  meta: {
    backendHealthy: false,
    message: "Loading backend coverage",
  },
};

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

function toRiskLabel(confidence?: number, hasAnomaly?: boolean): string {
  if (hasAnomaly) return "High (anomaly detected)";
  if (typeof confidence !== "number") return "Needs review";
  if (confidence >= 0.9) return "Low";
  if (confidence >= 0.75) return "Moderate";
  return "High";
}

export default function InvoicesPage() {
  const [data, setData] = useState<InvoicesApiPayload>(EMPTY_INVOICES_DATA);
  const [serverSnapshot, setServerSnapshot] = useState<InvoicesApiPayload>(EMPTY_INVOICES_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [lastParsePayload, setLastParsePayload] = useState<ParseInvoiceResponse | null>(null);
  const [selectedDeptPda, setSelectedDeptPda] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [recipientWallet, setRecipientWallet] = useState("");
  const [proposalReference, setProposalReference] = useState("");
  const [conversionAmountUsdc, setConversionAmountUsdc] = useState(0);
  const [targetCurrency, setTargetCurrency] = useState("USD");
  const [targetIban, setTargetIban] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [fiatConversion, setFiatConversion] = useState<FiatConversionResponse["data"] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const payload = await fetchInvoicesData();
        const normalizedPayload =
          payload.context.departments.length === 0 && payload.meta?.backendHealthy === false
            ? {
                ...payload,
                context: {
                  ...payload.context,
                  defaultDeptId: payload.context.defaultDeptId || invoicesMockData.context.defaultDeptId,
                  defaultDeptPda: payload.context.defaultDeptPda || invoicesMockData.context.defaultDeptPda,
                  departments: invoicesMockData.context.departments,
                },
              }
            : payload;
        if (!mounted) return;
        setData(normalizedPayload);
        setServerSnapshot(normalizedPayload);
        setSelectedDeptPda(normalizedPayload.context.defaultDeptPda);
        setSelectedDeptId(normalizedPayload.context.defaultDeptId);
        setRecipientWallet(normalizedPayload.context.recipientWallet);
        setPageError("");
      } catch (error) {
        if (mounted) {
          const fallbackPayload: InvoicesApiPayload = {
            ...invoicesMockData,
            meta: {
              backendHealthy: false,
              message:
                "Invoices API is unavailable. Demo context is shown for browsing, but parse/confirm actions stay disabled until the backend recovers.",
            },
          };
          setData(fallbackPayload);
          setServerSnapshot(fallbackPayload);
          setSelectedDeptPda(fallbackPayload.context.defaultDeptPda);
          setSelectedDeptId(fallbackPayload.context.defaultDeptId);
          setRecipientWallet(fallbackPayload.context.recipientWallet);
          setPageError(error instanceof Error ? error.message : "Invoices request failed");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!fiatConversion?.id || fiatConversion.status.toLowerCase() !== "pending") {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`${FIAT_API_URL}?conversionId=${encodeURIComponent(fiatConversion.id)}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as FiatConversionResponse;
        if (payload.success) {
          setFiatConversion(payload.data);
        }
      } catch {
        // keep the last known state and retry on the next tick
      }
    }, 5_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fiatConversion]);

  const uploadsEnabled = Boolean(data.meta?.backendHealthy) && Boolean(selectedDeptPda) && Boolean(recipientWallet);
  const canApprove = Boolean(data.meta?.backendHealthy) && !isSubmitting && Boolean(lastParsePayload?.summary);
  const canReject = !isSubmitting && Boolean(lastParsePayload);

  const setProcessingSteps = () => {
    setData((current) => ({
      ...current,
      analysis: {
        ...current.analysis,
        engineStatusLabel: "Processing",
        steps: [
          { id: "step-ocr", title: "Extract text", description: "Extracting text from the PDF", status: "active" },
          { id: "step-parse", title: "Parse fields", description: "Waiting for OCR output", status: "pending" },
          { id: "step-history", title: "Check history", description: "Waiting for parsed data", status: "pending" },
        ],
      },
    }));
  };

  const handleSelectFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    setSelectedFileName(file.name);

    if (file.type !== "application/pdf") {
      setFeedbackMessage("Only PDF files are accepted by the backend parser.");
      return;
    }

    if (!data.meta?.backendHealthy) {
      setFeedbackMessage("Invoice parsing is disabled because the backend invoice parser is currently unavailable.");
      return;
    }

    if (!selectedDeptPda || !recipientWallet) {
      setFeedbackMessage("Choose a department and recipient wallet before uploading.");
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage("");
    setProcessingSteps();

    try {
      const formData = new FormData();
      formData.set("action", "parse");
      formData.set("invoice", file);
      formData.set("treasuryPda", data.context.treasuryPda);
      formData.set("deptPda", selectedDeptPda);
      formData.set("recipientWallet", recipientWallet);
      formData.set("companyId", data.context.companyId);

      const response = await fetch(INVOICES_API_URL, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ParseInvoiceResponse & { error?: string };

      if (!response.ok || !payload.success || !payload.summary) {
        throw new Error(payload.error ?? `Parse failed: ${response.status}`);
      }

      setLastParsePayload(payload);

      const summary = payload.summary;
      const hasAnomaly = (summary.anomalyFlags?.length ?? 0) > 0;
      const matchedDepartment = data.context.departments.find((department) => department.deptId === summary.suggestedDepartment);

      setProposalReference("");
      setFiatConversion(null);
      setConversionAmountUsdc(summary.amountUsdc ?? 0);

      if (matchedDepartment) {
        setSelectedDeptId(matchedDepartment.deptId);
        setSelectedDeptPda(matchedDepartment.pubkey);
      }

      setData((current) => {
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
          ...current,
          history: [newHistoryItem, ...current.history].slice(0, 10),
          analysis: {
            ...current.analysis,
            engineStatusLabel: "Ready for review",
            steps: [
              { id: "step-ocr", title: "Extracted text", description: "OCR extraction complete", status: "done" },
              { id: "step-parse", title: "Parsed fields", description: "Invoice fields parsed", status: "done" },
              { id: "step-history", title: "Checked history", description: "Vendor pattern checks complete", status: "done" },
            ],
            insight: hasAnomaly
              ? {
                  id: `insight-${Date.now()}`,
                  tone: "warning",
                  title: "Anomaly detected",
                  message: summary.anomalyFlags?.join(", ") ?? "Potential anomaly found in invoice data",
                }
              : undefined,
            vendorName: summary.vendor ?? current.analysis.vendorName,
            totalAmount: summary.amountUsdc ?? current.analysis.totalAmount,
            currency: summary.currency ?? current.analysis.currency,
            category: summary.category ?? current.analysis.category,
            department: summary.suggestedDepartment ?? current.analysis.department,
            paymentTerms: summary.dueDate ? `Due by ${summary.dueDate}` : current.analysis.paymentTerms,
            taxId: summary.metadataUri ?? current.analysis.taxId,
            riskScoreLabel: toRiskLabel(summary.confidence, hasAnomaly),
            invoiceNumber: summary.invoiceNumber,
            confidence: summary.confidence,
            description: summary.description,
            dueDate: summary.dueDate,
            vendorHistory: payload.vendorHistory,
            similarInvoices: payload.similarInvoices,
          },
        };
      });

      setFeedbackMessage("Invoice parsed successfully. Review the analysis panel before signing.");
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "Invoice parse failed");
      setLastParsePayload(null);
      setData((current) => ({
        ...current,
        analysis: serverSnapshot.analysis,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!lastParsePayload?.summary) {
      setFeedbackMessage("Parse an invoice before signing.");
      return;
    }

    if (!data.meta?.backendHealthy) {
      setFeedbackMessage("Proposal submission is disabled because the backend invoice endpoints are unavailable.");
      return;
    }

    if (!selectedDeptPda || !recipientWallet) {
      setFeedbackMessage("Choose a department and recipient wallet before signing.");
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage("");

    try {
      const formData = new FormData();
      formData.set("action", "confirm");
      formData.set("treasuryPda", data.context.treasuryPda);
      formData.set("deptPda", selectedDeptPda);
      formData.set("recipientWallet", recipientWallet);
      formData.set("companyId", data.context.companyId);
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
      const payload = (await response.json()) as ConfirmInvoiceResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? `Confirm failed: ${response.status}`);
      }

      setData((current) => ({
        ...current,
        analysis: {
          ...current.analysis,
          engineStatusLabel: "Proposal created",
          steps: current.analysis.steps.map((step) => ({ ...step, status: "done" })),
          insight: {
            id: `confirm-${Date.now()}`,
            tone: "info",
            title: "Proposal submitted",
            message: `Signature ${payload.signature ?? "unknown"} · Proposal ${payload.proposalPda ?? "unknown"}`,
          },
          taxId: payload.proposalPda ?? current.analysis.taxId,
        },
      }));

      setProposalReference(payload.proposalPda ?? "");
      setConversionAmountUsdc(lastParsePayload.summary.amountUsdc ?? 0);
      setFeedbackMessage("Proposal submitted successfully.");
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "Invoice confirm failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    setLastParsePayload(null);
    setProposalReference("");
    setFiatConversion(null);
    setSelectedFileName("");
    setData((current) => ({
      ...current,
      analysis: serverSnapshot.analysis,
    }));
    setFeedbackMessage("Review state cleared.");
  };

  const handleStartConversion = async () => {
    if (!proposalReference || conversionAmountUsdc <= 0 || !targetIban) {
      setFeedbackMessage("Create a proposal and enter a target IBAN before starting fiat conversion.");
      return;
    }

    setIsConverting(true);
    setFeedbackMessage("");

    try {
      const response = await fetch(FIAT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amountUsdc: conversionAmountUsdc,
          targetCurrency,
          targetIban,
          reference: proposalReference,
        }),
      });

      const payload = (await response.json()) as FiatConversionResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? `Fiat conversion failed: ${response.status}`);
      }

      setFiatConversion(payload.data);
      setFeedbackMessage("Fiat conversion started. Status polling is now active.");
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "Fiat conversion failed");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="theme-bg min-h-full p-4 md:p-6">
      <div className="w-full space-y-6">
        {pageError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
            {pageError}
          </div>
        ) : null}

        {feedbackMessage ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {feedbackMessage}
          </div>
        ) : null}

        <section className="space-y-3">
          <div className="h-5" />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{data.subtitle}</p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">{data.title}</h1>
          </div>
        </section>

        <section className="theme-surface theme-border rounded-2xl border p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Company ID</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{data.context.companyId}</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Treasury PDA</p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-900 dark:text-slate-100">{data.context.treasuryPda}</p>
            </div>

            <label className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Department</span>
              <CustomSelect
                value={selectedDeptPda}
                onChange={(nextDeptPda) => {
                  const nextDepartment = data.context.departments.find((department) => department.pubkey === nextDeptPda);
                  setSelectedDeptPda(nextDeptPda);
                  setSelectedDeptId(nextDepartment?.deptId ?? "");
                }}
                options={[
                  { value: "", label: "Select department" },
                  ...data.context.departments.map((department) => ({
                    value: department.pubkey,
                    label: `${department.name} (${department.deptId})`,
                  })),
                ]}
                placeholder="Select department"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Recipient wallet</span>
              <input
                value={recipientWallet}
                onChange={(event) => setRecipientWallet(event.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
              />
            </label>
          </div>

          {selectedDeptId ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Selected department: <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedDeptId}</span>
            </p>
          ) : null}

          {data.meta?.message ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{data.meta.message}</p> : null}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-6">
          <div className="space-y-4 lg:space-y-6">
            <UploadCard
              title={data.upload.title}
              helperText={data.upload.helperText}
              supportedLabel={data.upload.supportedLabel}
              isLoading={isLoading}
              isDisabled={isSubmitting || !uploadsEnabled}
              selectedFileName={selectedFileName}
              statusText={
                data.meta?.backendHealthy
                  ? "Choose a PDF to start parsing."
                  : "Uploads are disabled until the backend invoice parser is reachable."
              }
              onSelectFiles={handleSelectFiles}
            />
            <HistoryCard title={data.historyTitle} items={data.history} isLoading={isLoading} />
          </div>

          <div className="lg:sticky lg:top-6">
            <AnalysisPanel
              engineStatusLabel={isSubmitting ? "Processing" : data.analysis.engineStatusLabel}
              analysis={data.analysis}
              isLoading={isLoading}
              canApprove={canApprove}
              canReject={canReject}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        </section>

        {proposalReference ? (
          <section className="theme-surface theme-border rounded-2xl border p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Fiat conversion</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Convert {conversionAmountUsdc.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC after proposal creation
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">Reference {proposalReference}</p>
              </div>

              {fiatConversion ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200">
                  Status {fiatConversion.status} · {fiatConversion.targetAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })} {fiatConversion.targetCurrency}
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[180px_1fr_auto]">
              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Target currency</span>
                <input
                  value={targetCurrency}
                  onChange={(event) => setTargetCurrency(event.target.value.toUpperCase())}
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Target IBAN</span>
                <input
                  value={targetIban}
                  onChange={(event) => setTargetIban(event.target.value)}
                  placeholder="GB82WEST12345698765432"
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
                />
              </label>

              <button
                type="button"
                onClick={handleStartConversion}
                disabled={isConverting}
                className="h-11 rounded-xl bg-slate-900 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                {isConverting ? "Starting..." : "Start conversion"}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
