import type { CriticalOpsConfig } from "./types";

type KillSwitchCardProps = {
  data: CriticalOpsConfig;
  className?: string;
  isLoading?: boolean;
};

const cardShell =
  "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-colors dark:border-slate-800/90 dark:bg-slate-950/90 sm:p-6";

function KillSwitchSkeleton() {
  return (
    <article className={cardShell}>
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-80 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-900" />
        <div className="h-10 w-60 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </article>
  );
}

export default function KillSwitchCard({ data, className = "", isLoading = false }: KillSwitchCardProps) {
  if (isLoading) return <KillSwitchSkeleton />;

  return (
    <article className={`${cardShell} ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-300/70 bg-rose-100 text-rose-700 dark:border-rose-600/40 dark:bg-rose-900/30 dark:text-rose-300">
            <span aria-hidden>!</span>
          </span>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500 dark:text-rose-400">{data.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{data.body}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{data.note}</p>
          </div>
        </div>

        <button
          type="button"
          className="h-12 w-full rounded-2xl bg-rose-200 px-6 text-xs font-semibold uppercase tracking-[0.16em] text-rose-900 shadow-sm transition hover:bg-rose-300 dark:bg-rose-200 dark:text-rose-900 md:w-auto"
        >
          {data.actionLabel}
        </button>
      </div>
    </article>
  );
}

