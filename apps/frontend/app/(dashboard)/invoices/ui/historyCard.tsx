import type { InvoiceHistoryItem } from "../../../../lib/mockData";

type HistoryCardProps = {
  title: string;
  items: InvoiceHistoryItem[];
  className?: string;
  isLoading?: boolean;
};

function formatMoney(amount: number, currency: string) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: currency === "USDC" ? "USD" : currency,
    maximumFractionDigits: 2,
  });
}

function statusLabel(status: InvoiceHistoryItem["status"]) {
  if (status === "processed") return { text: "Processed", tone: "success" as const };
  if (status === "flagged") return { text: "Flagged", tone: "danger" as const };
  return { text: "Pending", tone: "neutral" as const };
}

const toneStyles: Record<ReturnType<typeof statusLabel>["tone"], string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  danger: "text-rose-600 dark:text-rose-400",
  neutral: "text-slate-600 dark:text-slate-300",
};

function HistoryCardSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-950/90 sm:p-6">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`hist-skel-${idx}`} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
      </div>
    </article>
  );
}

export default function HistoryCard({ title, items, className = "", isLoading = false }: HistoryCardProps) {
  if (isLoading) return <HistoryCardSkeleton />;

  return (
    <article
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-colors dark:border-slate-800/90 dark:bg-slate-950/90 sm:p-6 ${className}`}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</h3>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="divide-y divide-slate-200/70 overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50/70 dark:divide-slate-800/80 dark:border-slate-800/80 dark:bg-slate-900/50">
        {items.map((item) => {
          const status = statusLabel(item.status);
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                <span aria-hidden>▦</span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.fileName}</p>
                <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  {item.date} · ID: {item.invoiceId}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatMoney(item.amount, item.currency)}
                  </p>
                  <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.16em] ${toneStyles[status.tone]}`}>
                    {status.text}
                  </p>
                </div>
                <span className="text-slate-400 dark:text-slate-500" aria-hidden>
                  ›
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
