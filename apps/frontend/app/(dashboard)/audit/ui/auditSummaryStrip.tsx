import AuditCardShell from "./auditCardShell";
import type { AuditSummaryItem } from "./types";
import { cn } from "../../../../lib/utils";

type AuditSummaryStripProps = {
  items: AuditSummaryItem[];
  isLoading?: boolean;
  className?: string;
};

function SummarySkeleton() {
  return (
    <AuditCardShell className="p-0 sm:p-0">
      <div className="grid divide-y divide-slate-200 dark:divide-zinc-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`sum-sk-${i}`} className="animate-pulse space-y-3 p-4 sm:p-5">
            <div className="h-3 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-8 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </AuditCardShell>
  );
}

export default function AuditSummaryStrip({ items, isLoading = false, className }: AuditSummaryStripProps) {
  if (isLoading) {
    return <SummarySkeleton />;
  }

  return (
    <AuditCardShell className={cn("p-0 sm:p-0", className)}>
      <div className="grid divide-y divide-slate-200 dark:divide-zinc-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) => (
          <div key={item.id} className="space-y-2 p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500 sm:text-xs">
              {item.label}
            </p>
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 sm:text-3xl">
                {item.value}
              </p>
              {item.unit ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">{item.unit}</span>
              ) : null}
              {item.trend ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-semibold",
                    item.trend.direction === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                  )}
                >
                  <span aria-hidden>{item.trend.direction === "up" ? "▲" : "▼"}</span>
                  {item.trend.label}
                </span>
              ) : null}
            </div>
            {item.caption ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-500 sm:text-xs">
                {item.caption}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </AuditCardShell>
  );
}
