export type SpendingVelocityPoint = {
  id: string;
  label: string;
  value: number;
  tone?: "standard" | "critical";
};

type SpendingGraphProps = {
  data: SpendingVelocityPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
  isLoading?: boolean;
  yAxisMax?: number;
};

const MAX_BAR_HEIGHT = 280;

const axisLabelStyles =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500";

function SpendingGraphSkeleton() {
  return (
    <article className="theme-surface theme-border rounded-2xl border p-5 shadow-sm sm:p-6">
      <div className="animate-pulse">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-56 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="mt-6 h-72 rounded-xl bg-slate-100 dark:bg-slate-900" />
      </div>
    </article>
  );
}

export default function SpendingGraph({
  data,
  title = "Spending Velocity",
  subtitle = "30-day periodic expenditure log",
  className = "",
  isLoading = false,
  yAxisMax,
}: SpendingGraphProps) {
  if (isLoading) {
    return <SpendingGraphSkeleton />;
  }

  const maxValue = Math.max(yAxisMax ?? 0, ...data.map((item) => item.value), 1);

  return (
    <article
      className={`theme-surface theme-border rounded-2xl border p-5 shadow-sm transition-colors sm:p-6 ${className}`}
    >
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="h-3 w-3 rounded-sm bg-emerald-500" aria-hidden />
            Standard
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="h-3 w-3 rounded-sm bg-amber-500" aria-hidden />
            Critical
          </span>
        </div>
      </header>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[680px]">
          <div className="flex h-72 items-end gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-900/60 sm:gap-3 sm:p-4">
            {data.map((point) => {
              const height = Math.max(8, Math.round((point.value / maxValue) * MAX_BAR_HEIGHT));
              const isCritical = point.tone === "critical";

              return (
                <div key={point.id} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span
                    className={`w-full rounded-sm ${
                      isCritical
                        ? "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                        : "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    }`}
                    style={{ height }}
                    aria-hidden
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-5 gap-2 px-1 sm:gap-3">
            {[0, 7, 14, 21, 29].map((index) => {
              const point = data[Math.min(index, data.length - 1)];
              return (
                <p key={`axis-${index}`} className={`${axisLabelStyles} text-left`}>
                  {point?.label ?? ""}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}