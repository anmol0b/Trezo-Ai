import type { GovernanceMetric } from "../../../../lib/mockData";

type GovernanceMetricsProps = {
  data: GovernanceMetric[];
  isLoading?: boolean;
};

const helperToneClassMap: Record<NonNullable<GovernanceMetric["helperTone"]>, string> = {
  positive: "text-emerald-600 dark:text-emerald-400",
  neutral: "text-slate-500 dark:text-slate-400",
  critical: "text-rose-600 dark:text-rose-400",
};

function GovernanceMetricsSkeleton() {
  return (
    <article className="theme-surface theme-border rounded-2xl border p-5 shadow-sm sm:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-64 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`metric-skeleton-${index}`} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
      </div>
    </article>
  );
}

export default function GovernanceMetrics({ data, isLoading = false }: GovernanceMetricsProps) {
  if (isLoading) {
    return <GovernanceMetricsSkeleton />;
  }

  return (
    <article className="theme-surface theme-border rounded-2xl border p-5 shadow-sm sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Governance Health Metrics</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.map((metric) => (
          <article key={metric.id} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/60">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{metric.label}</p>
            <p className="mt-2 text-4xl font-semibold text-slate-900 dark:text-slate-100">{metric.value}</p>
            <p className={`mt-2 text-sm font-semibold uppercase tracking-[0.12em] ${helperToneClassMap[metric.helperTone ?? "neutral"]}`}>
              {metric.helperText}
            </p>
          </article>
        ))}
      </div>
    </article>
  );
}
