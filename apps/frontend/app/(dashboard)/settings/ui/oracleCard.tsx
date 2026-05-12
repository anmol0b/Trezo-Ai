import type { OracleConfig } from "./types";

type OracleCardProps = {
  data: OracleConfig;
  className?: string;
  isLoading?: boolean;
  isSaving?: boolean;
  onTriggerChange?: (value: number) => void;
  onSubmit?: () => void;
};

const cardShell =
  "theme-surface theme-border rounded-2xl border p-5 shadow-sm transition-colors sm:p-6";

const formatUsd = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function OracleSkeleton() {
  return (
    <article className={cardShell}>
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-900" />
        <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-900" />
        <div className="h-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </article>
  );
}

export default function OracleCard({
  data,
  className = "",
  isLoading = false,
  isSaving = false,
  onTriggerChange,
  onSubmit,
}: OracleCardProps) {
  if (isLoading) return <OracleSkeleton />;

  return (
    <article className={`${cardShell} ${className}`}>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <span className="text-lg font-black" aria-hidden>
            ▦
          </span>
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">{data.title}</h2>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">{data.feedLabel}</p>
          <span className="inline-flex items-center rounded-full border border-emerald-300/80 bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-600/40 dark:bg-emerald-900/30 dark:text-emerald-300">
            {data.statusLabel}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">${formatUsd(data.price)}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{data.pairLabel}</p>
          </div>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{data.changeLabel}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">{data.triggerLabel}</p>
          <div className="mt-3">
            <input
              type="range"
              min={data.triggerMin}
              max={data.triggerMax}
              step={0.1}
              value={data.triggerValue}
              onChange={(event) => onTriggerChange?.(Number(event.target.value))}
              disabled={!data.canEdit || isSaving}
              className="h-2 w-full appearance-none rounded-full bg-slate-200 accent-violet-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-800"
            />
            <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-500">
              <span>{data.triggerMin.toFixed(1)}%</span>
              <span className="text-violet-600 dark:text-violet-400">{data.triggerValue.toFixed(1)}%</span>
              <span>{data.triggerMax.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">{data.cooldownLabel}</p>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{data.cooldownSeconds}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">Seconds</span>
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!data.canEdit || isSaving}
              className="h-11 w-full rounded-xl bg-slate-900 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {isSaving ? "Saving..." : data.commitLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
