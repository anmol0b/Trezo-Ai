import { IconChartBar } from "@tabler/icons-react";
import AuditCardShell from "./auditCardShell";
import type { AuditComplianceItem } from "./types";
import { cn } from "../../../../lib/utils";

type AuditComplianceCardProps = {
  title: string;
  items: AuditComplianceItem[];
  isLoading?: boolean;
  className?: string;
};

const toneBar: Record<AuditComplianceItem["tone"], string> = {
  emerald: "bg-emerald-500 dark:bg-emerald-400",
  violet: "bg-slate-400 dark:bg-slate-500",
};

function ComplianceSkeleton() {
  return (
    <AuditCardShell>
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-5 w-5 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>
        <div className="h-px bg-slate-200 dark:bg-zinc-800" />
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-3 w-12 rounded bg-slate-200 dark:bg-zinc-800" />
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-900" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-36 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-900" />
          </div>
        </div>
      </div>
    </AuditCardShell>
  );
}

export default function AuditComplianceCard({ title, items, isLoading = false, className }: AuditComplianceCardProps) {
  if (isLoading) {
    return <ComplianceSkeleton />;
  }

  return (
    <AuditCardShell className={className}>
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-zinc-800">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-900 dark:text-zinc-100">{title}</h2>
        <IconChartBar className="h-5 w-5 text-slate-400 dark:text-zinc-500" stroke={1.5} aria-hidden />
      </header>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
          Coverage metrics will appear once the backend returns audit events.
        </div>
      ) : (
        <ul className="space-y-6">
          {items.map((item) => (
            <li key={item.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">{item.label}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{item.valueLabel}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-900">
                <div
                  className={cn("h-full rounded-full transition-all", toneBar[item.tone])}
                  style={{ width: `${Math.min(100, Math.max(0, item.fillPercent))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AuditCardShell>
  );
}
