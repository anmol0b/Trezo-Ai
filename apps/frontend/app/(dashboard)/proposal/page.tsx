"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GovernanceMetrics from "./ui/governanceMetrics";
import LiveAuditFeed from "./ui/liveAuditFeed";
import ProposalFilters from "./ui/proposalFilters";
import ProposalTable from "./ui/proposalTable";
import {
  invoicesMockData,
  proposalMockData,
  type InvoicesApiPayload,
  type InvoiceRequestContext,
  type ProposalApiPayload,
} from "../../../lib/mockData";

const PROPOSAL_API_URL = process.env.NEXT_PUBLIC_PROPOSAL_API_URL ?? "/api/proposal";
const INVOICES_API_URL = process.env.NEXT_PUBLIC_INVOICES_API_URL ?? "/api/invoices";

type BackendStatus = "loading" | "connected" | "unauthorized" | "unavailable";

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
  error?: string;
};

type InvoiceContextResponse = Pick<InvoicesApiPayload, "context" | "meta">;

function buildCreateDefaults(context: InvoiceRequestContext) {
  return {
    companyId: context.companyId,
    treasuryPda: context.treasuryPda,
    deptPda: context.defaultDeptPda || context.departments[0]?.pubkey || "",
    recipientWallet: context.recipientWallet,
  };
}

async function fetchProposalData(): Promise<ProposalApiPayload> {
  const response = await fetch(PROPOSAL_API_URL, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = new Error(`Proposal fetch failed: ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  return response.json();
}

async function fetchInvoiceContext(): Promise<InvoiceContextResponse> {
  const response = await fetch(INVOICES_API_URL, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = new Error(`Invoice context fetch failed: ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  const payload = (await response.json()) as InvoicesApiPayload;
  return {
    context: payload.context,
    meta: payload.meta,
  };
}

export default function ProposalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams?.get("status") ?? null;
const queryParam = searchParams?.get("q") ?? "";
const pageParam = searchParams?.get("page") ?? null;
  const [proposalData, setProposalData] = useState<ProposalApiPayload>(proposalMockData);
  const [invoiceContext, setInvoiceContext] = useState<InvoiceContextResponse>({
    context: invoicesMockData.context,
    meta: invoicesMockData.meta,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("loading");
  const [backendMessage, setBackendMessage] = useState<string>("");
  const [activeFilterId, setActiveFilterId] = useState<string>(() => {
  return statusParam ?? proposalMockData.filters.find((f) => f.active)?.id ?? proposalMockData.filters[0]?.id ?? "all";
});
const [query, setQuery] = useState(() => queryParam);
const [page, setPage] = useState(() => {
  const n = pageParam ? Number(pageParam) : 1;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
});
  const pageSize = 10;
  const [openProposalId, setOpenProposalId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<"upload" | "review" | "success">("upload");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseInvoiceResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmInvoiceResponse | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [overrideFields, setOverrideFields] = useState(() => buildCreateDefaults(invoicesMockData.context));

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const payload = await fetchProposalData();
        if (mounted) {
          setProposalData(payload);
          setBackendStatus("connected");
          setBackendMessage("");
        }
      } catch (e) {
        const status = (e as Error & { status?: number }).status;
        if (mounted) {
          setProposalData(proposalMockData);
          if (status === 401) {
            setBackendStatus("unauthorized");
            setBackendMessage("You’re not signed in. Showing demo data.");
          } else {
            setBackendStatus("unavailable");
            setBackendMessage("Backend is unreachable or returned invalid data. Showing demo data.");
          }
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

  useEffect(() => {
    let mounted = true;

    const loadInvoiceContext = async () => {
      try {
        const payload = await fetchInvoiceContext();
        if (!mounted) return;
        setInvoiceContext(payload);
        setOverrideFields(buildCreateDefaults(payload.context));
      } catch {
        if (!mounted) return;
        setInvoiceContext({
          context: invoicesMockData.context,
          meta: {
            ...invoicesMockData.meta,
            backendHealthy: false,
            message:
              "Invoice context could not be loaded from the API. Demo defaults are shown, but parsing still needs a live backend.",
          },
        });
        setOverrideFields(buildCreateDefaults(invoicesMockData.context));
      }
    };

    void loadInvoiceContext();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Keep URL in sync for shareable, refresh-safe state.
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (activeFilterId && activeFilterId !== "all") params.set("status", activeFilterId);
    else params.delete("status");
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    if (page > 1) params.set("page", String(page));
    else params.delete("page");

    const next = params.toString();
    const current = searchParams?.toString() ?? "";
    if (next !== current) {
      router.replace(`/proposal${next ? `?${next}` : ""}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilterId, query, page, router]);

  const filteredProposals = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byFilter = proposalData.proposals.filter((p) => {
      if (activeFilterId === "all") return true;
      return p.status === activeFilterId;
    });
    if (!q) return byFilter;
    return byFilter.filter((p) => {
      return (
        p.vendor.toLowerCase().includes(q) ||
        p.hash.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [activeFilterId, proposalData.proposals, query]);

  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProposals.slice(start, start + pageSize);
  }, [filteredProposals, safePage]);

  useEffect(() => {
    setPage(1);
  }, [activeFilterId, query]);

  const showBanner = backendStatus !== "connected";
  const openProposal = openProposalId ? proposalData.proposals.find((p) => p.id === openProposalId) : null;
  const createContextReady = Boolean(
    overrideFields.companyId && overrideFields.treasuryPda && overrideFields.deptPda && overrideFields.recipientWallet,
  );

  const resetCreate = () => {
    setCreateStep("upload");
    setCreateError(null);
    setCreateBusy(false);
    setCreateFile(null);
    setParseResult(null);
    setConfirmResult(null);
    setAdvancedOpen(false);
    setOverrideFields(buildCreateDefaults(invoiceContext.context));
  };

  const doParse = async () => {
    if (!createFile) {
      setCreateError("Please choose a PDF invoice first.");
      return;
    }
    if (!overrideFields.companyId || !overrideFields.treasuryPda) {
      setCreateError("Company and treasury context are required before parsing.");
      return;
    }
    if (!overrideFields.deptPda) {
      setCreateError("Choose a department before parsing, or enter a manual department PDA in advanced mode.");
      return;
    }
    if (!overrideFields.recipientWallet) {
      setCreateError("Recipient wallet is required before parsing.");
      return;
    }
    setCreateBusy(true);
    setCreateError(null);
    try {
      const formData = new FormData();
      formData.set("action", "parse");
      formData.set("invoice", createFile);
      formData.set("companyId", overrideFields.companyId);
      formData.set("treasuryPda", overrideFields.treasuryPda);
      formData.set("deptPda", overrideFields.deptPda);
      formData.set("recipientWallet", overrideFields.recipientWallet);

      const res = await fetch(INVOICES_API_URL, { method: "POST", body: formData });
      const payload = (await res.json()) as ParseInvoiceResponse & { error?: string };
      if (!res.ok) throw new Error(payload.error ?? `Parse failed (${res.status})`);
      if (!payload.success || !payload.summary) throw new Error("Invalid parse response");
      const matchedDepartment = invoiceContext.context.departments.find(
        (department) => department.deptId === payload.summary?.suggestedDepartment,
      );
      if (matchedDepartment) {
        setOverrideFields((current) => ({
          ...current,
          deptPda: matchedDepartment.pubkey,
        }));
      }
      setParseResult(payload);
      setCreateStep("review");
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setCreateBusy(false);
    }
  };

  const doConfirm = async () => {
    if (!parseResult?.summary) return;
    if (!overrideFields.companyId || !overrideFields.treasuryPda || !overrideFields.deptPda || !overrideFields.recipientWallet) {
      setCreateError("Complete the company, treasury, department, and recipient fields before submitting.");
      return;
    }
    setCreateBusy(true);
    setCreateError(null);
    try {
      const formData = new FormData();
      formData.set("action", "confirm");
      formData.set(
        "payload",
        JSON.stringify({
          invoice: parseResult.summary,
          ragResult: parseResult.ragResult ?? {},
          metadataUri: parseResult.summary.metadataUri ?? "ipfs://pending",
        }),
      );
      formData.set("companyId", overrideFields.companyId);
      formData.set("treasuryPda", overrideFields.treasuryPda);
      formData.set("deptPda", overrideFields.deptPda);
      formData.set("recipientWallet", overrideFields.recipientWallet);

      const res = await fetch(INVOICES_API_URL, { method: "POST", body: formData });
      const payload = (await res.json()) as ConfirmInvoiceResponse;
      if (!res.ok) throw new Error(payload.error || `Confirm failed (${res.status})`);
      if (!payload.success) throw new Error(payload.error || "Confirm failed");
      setConfirmResult(payload);
      setCreateStep("success");
      // Refresh proposals after a brief delay; backend may take a moment to surface the new proposal.
      setTimeout(() => {
        void (async () => {
          try {
            const next = await fetchProposalData();
            setProposalData(next);
          } catch {
            // ignore
          }
        })();
      }, 1200);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Confirm failed");
    } finally {
      setCreateBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        {showBanner ? (
          <div
            className={`rounded-2xl border p-4 text-sm font-medium ${
              backendStatus === "unauthorized"
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
                : "border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            }`}
            role="status"
          >
            <span className="font-semibold uppercase tracking-wide">
              {backendStatus === "loading"
                ? "Connecting…"
                : backendStatus === "unauthorized"
                  ? "Demo mode (unauthorized)"
                  : "Demo mode (backend unavailable)"}
            </span>
            {backendMessage ? <span className="ml-2">{backendMessage}</span> : null}
          </div>
        ) : null}

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
              onClick={() => {
                resetCreate();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center rounded-xl border border-violet-300 bg-violet-500/80 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-violet-500 dark:border-violet-500/50 dark:bg-violet-500/60"
            >
              Create via invoice
            </button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <ProposalFilters
              filters={proposalData.filters}
              isLoading={isLoading}
              activeId={activeFilterId}
              onSelect={(id) => setActiveFilterId(id)}
            />
            <div className="w-full max-w-xs">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by vendor, dept, hash…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="space-y-3">
            <ProposalTable data={pageItems} isLoading={isLoading} onOpen={(id) => setOpenProposalId(id)} />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/90 dark:text-slate-500">
              <p>
                Showing{" "}
                {filteredProposals.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-
                {Math.min(safePage * pageSize, filteredProposals.length)} of {filteredProposals.length} proposals
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 text-xs text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Prev
                </button>
                <span className="px-2">
                  {safePage}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 text-xs text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
            {!isLoading && filteredProposals.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm font-medium text-slate-700 dark:border-slate-800/80 dark:bg-slate-950/90 dark:text-slate-200">
                No proposals match your filters.
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <GovernanceMetrics data={proposalData.governanceMetrics} isLoading={isLoading} />
          <LiveAuditFeed data={proposalData.auditFeed} isLoading={isLoading} />
        </section>
      </div>

      {openProposal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Proposal #{openProposal.index} · {openProposal.status}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {openProposal.vendor}
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Dept: <span className="font-semibold">{openProposal.department}</span> · Category:{" "}
                  <span className="font-semibold">{openProposal.category}</span>
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Amount:{" "}
                  <span className="font-semibold">
                    {openProposal.currency} {openProposal.amount.toLocaleString("en-US")}
                  </span>
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Proposal id: {openProposal.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenProposalId(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close proposal details"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Approvals: {openProposal.approvals.signed}/{openProposal.approvals.required}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(openProposal.id);
                    } catch {
                      // ignore
                    }
                  }}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Copy id
                </button>
                <a
                  href={`https://solscan.io/account/${encodeURIComponent(openProposal.id)}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Open in explorer
                </a>
                <button
                  type="button"
                  onClick={() => setOpenProposalId(null)}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-violet-500 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-violet-400 dark:bg-violet-400 dark:text-slate-950 dark:hover:bg-violet-300"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  New proposal
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Create via invoice</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Manual proposal creation isn’t available because the backend proposals route is <span className="font-semibold">GET-only</span>.
                  This flow uses the existing <span className="font-semibold">invoice parse + confirm</span> endpoints to submit the on-chain proposal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Step {createStep === "upload" ? "1" : createStep === "review" ? "2" : "3"} of 3
                </p>
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((v) => !v)}
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  {advancedOpen ? "Hide" : "Show"} advanced
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Company ID
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {overrideFields.companyId || "Unavailable"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Treasury PDA
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {overrideFields.treasuryPda || "Unavailable"}
                  </p>
                </div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Department
                  <select
                    value={overrideFields.deptPda}
                    onChange={(e) => setOverrideFields((prev) => ({ ...prev, deptPda: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Select department</option>
                    {invoiceContext.context.departments.map((department) => (
                      <option key={department.pubkey} value={department.pubkey}>
                        {department.name} ({department.deptId})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Recipient wallet
                  <input
                    value={overrideFields.recipientWallet}
                    onChange={(e) => setOverrideFields((prev) => ({ ...prev, recipientWallet: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>
              </div>

              {invoiceContext.context.departments.length === 0 ? (
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                  No departments were returned by the invoice context API. Open advanced mode to paste a manual department PDA.
                </p>
              ) : null}

              {invoiceContext.meta?.message ? (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{invoiceContext.meta.message}</p>
              ) : null}

              {advancedOpen ? (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {(
                    [
                      { key: "companyId", label: "Company ID" },
                      { key: "treasuryPda", label: "Treasury PDA" },
                      { key: "deptPda", label: "Manual department PDA" },
                    ] as const
                  ).map((field) => (
                    <label key={field.key} className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {field.label}
                      <input
                        value={overrideFields[field.key]}
                        onChange={(e) => setOverrideFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        placeholder="(optional override)"
                      />
                    </label>
                  ))}
                </div>
              ) : null}

              {createStep === "upload" ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Invoice PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setCreateFile(e.target.files?.[0] ?? null)}
                      className="mt-2 block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-violet-500 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-white hover:file:bg-violet-400 dark:text-slate-200"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!createFile || createBusy || !createContextReady}
                    onClick={() => void doParse()}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-violet-500 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60 hover:bg-violet-400 dark:bg-violet-400 dark:text-slate-950 dark:hover:bg-violet-300"
                  >
                    {createBusy ? "Parsing…" : "Parse invoice"}
                  </button>
                  {!createContextReady ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Company, treasury, department, and recipient context are required before parsing.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {createStep === "review" && parseResult?.summary ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-semibold">{parseResult.summary.vendor ?? "Unknown vendor"}</span>
                      <span className="font-semibold">
                        {(parseResult.summary.currency ?? "USDC") + " " + (parseResult.summary.amountUsdc ?? 0).toLocaleString("en-US")}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {parseResult.summary.category ?? "Uncategorized"} · {parseResult.summary.invoiceNumber ?? "No invoice #"}
                    </p>
                    {parseResult.summary.anomalyFlags?.length ? (
                      <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        Flags: {parseResult.summary.anomalyFlags.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={createBusy}
                      onClick={() => setCreateStep("upload")}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={createBusy || !createContextReady}
                      onClick={() => void doConfirm()}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-violet-500 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-violet-400 disabled:opacity-60 dark:bg-violet-400 dark:text-slate-950 dark:hover:bg-violet-300"
                    >
                      {createBusy ? "Submitting…" : "Submit proposal"}
                    </button>
                  </div>
                </div>
              ) : null}

              {createStep === "success" && confirmResult?.success ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                    Proposal submitted.
                    {confirmResult.proposalPda ? <span className="ml-2">PDA: {confirmResult.proposalPda}</span> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {confirmResult.signature ? (
                      <a
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        href={`https://solscan.io/tx/${encodeURIComponent(confirmResult.signature)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View tx
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-violet-500 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-violet-400 dark:bg-violet-400 dark:text-slate-950 dark:hover:bg-violet-300"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : null}

              {createError ? (
                <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">{createError}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
