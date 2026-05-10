import type { AuditPrivacyConfig } from "./types";

type AuditPrivacyCardProps = {
  data: AuditPrivacyConfig;
  className?: string;
  isLoading?: boolean;
};

const cardShell =
  "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-colors dark:border-slate-800/90 dark:bg-slate-950/90 sm:p-6";

function AuditPrivacySkeleton() {
  return (
    <article className={cardShell}>
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-52 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-44 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-40 rounded-xl bg-slate-100 dark:bg-slate-900" />
        <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-900" />
      </div>
    </article>
  );
}

export default function AuditPrivacyCard({ data, className = "", isLoading = false }: AuditPrivacyCardProps) {
  if (isLoading) return <AuditPrivacySkeleton />;

  return (
    <article className={`${cardShell} ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <span aria-hidden>◌</span>
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{data.title}</h2>
        </div>
        <button
          type="button"
          className="h-10 rounded-xl border border-slate-200 bg-slate-100 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {data.grantLabel}
        </button>
      </header>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800/70">
        <div className="grid grid-cols-[1.2fr_1fr_auto] gap-3 bg-slate-50/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-900/60 dark:text-slate-500">
          <span>{data.columns[0]}</span>
          <span>{data.columns[1]}</span>
          <span className="text-right">{data.columns[2]}</span>
        </div>

        <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
          {data.entries.map((entry) => (
            <div key={entry.id} className="grid grid-cols-[1.2fr_1fr_auto] items-center gap-3 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{entry.auditor}</p>
              <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{entry.access}</p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500 transition hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
                >
                  {entry.actionLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{data.helperText}</p>
    </article>
  );
}

