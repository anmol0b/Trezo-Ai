import { IconKey } from "@tabler/icons-react";
import AuditCardShell from "./auditCardShell";
import type { AuditMetadataRow } from "./types";

type AuditMetadataCardProps = {
  title: string;
  rows: AuditMetadataRow[];
  isLoading?: boolean;
  className?: string;
};

function MetadataSkeleton() {
  return (
    <AuditCardShell>
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-zinc-800">
          <div className="h-4 w-36 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-5 w-5 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`md-sk-${i}`} className="flex justify-between rounded-lg bg-slate-50 px-3 py-3 dark:bg-zinc-900/60">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-3 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </AuditCardShell>
  );
}

export default function AuditMetadataCard({ title, rows, isLoading = false, className }: AuditMetadataCardProps) {
  if (isLoading) {
    return <MetadataSkeleton />;
  }

  return (
    <AuditCardShell className={className}>
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-zinc-800">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-900 dark:text-zinc-100">{title}</h2>
        <IconKey className="h-5 w-5 text-slate-400 dark:text-zinc-500" stroke={1.5} aria-hidden />
      </header>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
          Backend metadata is unavailable right now.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-1 rounded-lg bg-slate-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 dark:bg-zinc-900/50"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500 sm:text-xs">
                {row.label}:
              </span>
              <span className="font-mono text-xs font-medium uppercase text-slate-900 dark:text-zinc-200 sm:text-right">{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </AuditCardShell>
  );
}
