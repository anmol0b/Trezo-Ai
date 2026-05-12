import type { AgentAuthorityConfig } from "./types";

type AgentAuthorityCardProps = {
  data: AgentAuthorityConfig;
  className?: string;
  isLoading?: boolean;
};

const cardShell =
  "theme-surface theme-border rounded-2xl border p-5 shadow-sm transition-colors sm:p-6";

function AgentAuthoritySkeleton() {
  return (
    <article className={cardShell}>
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-52 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900" />
        <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-900" />
        <div className="h-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </article>
  );
}

function CheckboxRow({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded border ${
          checked
            ? "border-violet-400 bg-violet-500/20 text-violet-600 dark:border-violet-500/70 dark:text-violet-300"
            : "border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-900"
        }`}
        aria-hidden
      >
        {checked ? "✓" : ""}
      </span>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">{label}</span>
    </div>
  );
}

export default function AgentAuthorityCard({ data, className = "", isLoading = false }: AgentAuthorityCardProps) {
  if (isLoading) return <AgentAuthoritySkeleton />;

  return (
    <article className={`${cardShell} ${className}`}>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <span className="text-lg" aria-hidden>
            ⌁
          </span>
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{data.title}</h2>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/50">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">{data.pubkeyLabel}</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <span aria-hidden>🔑</span>
          </span>
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{data.pubkey}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/50">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">{data.allowedLabel}</p>
          <div className="mt-4 space-y-3">
            {data.allowed.map((item) => (
              <CheckboxRow key={item.id} checked={item.enabled} label={item.label} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">{data.maxTxCapLabel}</p>
            <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">{data.maxTxCapValue}</p>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">{data.dailyBurnLabel}</p>
            <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">{data.dailyBurnValue}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={data.actionDisabled}
        className="mt-5 h-11 w-full rounded-xl bg-slate-900 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        {data.actionLabel}
      </button>
    </article>
  );
}
