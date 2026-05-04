import type { InvoiceAnalysis, InvoiceProcessingStep, InvoiceProcessingStepStatus } from "../../../lib/mockData";

type AnalysisPanelProps = {
  title?: string;
  engineStatusLabel: string;
  analysis: InvoiceAnalysis;
  className?: string;
  isLoading?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
};

const stepTone: Record<InvoiceProcessingStepStatus, { dot: string; text: string }> = {
  done: { dot: "bg-emerald-500", text: "text-slate-900 dark:text-slate-100" },
  active: { dot: "bg-violet-500 animate-pulse", text: "text-slate-900 dark:text-slate-100" },
  pending: { dot: "bg-slate-300 dark:bg-slate-700", text: "text-slate-500 dark:text-slate-400" },
};

function money(amount: number, currency: string) {
  return amount.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 2 });
}

function AnalysisPanelSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-950/90 sm:p-6">
      <div className="animate-pulse space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`step-skel-${idx}`} className="h-10 rounded-xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
        <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900" />
        <div className="space-y-3">
          <div className="h-7 w-56 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-900" />
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-900" />
          </div>
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-900" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </article>
  );
}

function ProcessingSteps({ steps }: { steps: InvoiceProcessingStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const styles = stepTone[step.status];
        return (
          <div key={step.id} className="flex items-start gap-3">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${styles.dot}`} aria-hidden />
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${styles.text}`}>{step.title}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalysisPanel({
  title = "AI Analysis Panel",
  engineStatusLabel,
  analysis,
  className = "",
  isLoading = false,
  onApprove,
  onReject,
}: AnalysisPanelProps) {
  if (isLoading) return <AnalysisPanelSkeleton />;

  const insight = analysis.insight;

  return (
    <article
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-colors dark:border-slate-800/90 dark:bg-slate-950/90 sm:p-6 ${className}`}
    >
      <header className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}</h3>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          {engineStatusLabel}
        </div>
      </header>

      <section className="space-y-4">
        <ProcessingSteps steps={analysis.steps} />

        {insight ? (
          <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-600/40 dark:bg-amber-900/20 dark:text-amber-100">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
              {insight.title}
            </p>
            <p className="mt-2 text-sm">{insight.message}</p>
          </div>
        ) : null}
      </section>

      <section className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Vendor entity</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{analysis.vendorName}</p>
              <p className="text-2xl font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                {money(analysis.totalAmount, analysis.currency)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/50">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Internal category</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{analysis.category}</p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/50">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Department</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{analysis.department}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/50">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Tax ID</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{analysis.taxId ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/50">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Payment terms</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{analysis.paymentTerms ?? "—"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Risk score</p>
            <p className="mt-2 text-sm font-semibold text-amber-700 dark:text-amber-300">{analysis.riskScoreLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-violet-500"
          >
            Approve &amp; Sign
          </button>
          <button
            type="button"
            onClick={onReject}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Reject
          </button>
        </div>
      </section>
    </article>
  );
}

