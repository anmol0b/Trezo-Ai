import type { YieldAuditItem, YieldMarketRate } from "./types";

type MarketRatesCardProps = {
  title?: string;
  data: YieldMarketRate[];
  isLoading?: boolean;
};

type AuditLogCardProps = {
  title?: string;
  data: YieldAuditItem[];
  isLoading?: boolean;
};

const formatPercent = (value: number) =>
  `${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

export function MarketRatesCard({ title = "Market Rates", data, isLoading = false }: MarketRatesCardProps) {
  const items = isLoading ? Array.from({ length: 3 }) : data;

  return (
    <section className="theme-surface theme-border rounded-2xl border p-4 shadow-sm sm:p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</h2>
      {!isLoading && data.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
          Kamino stats are not exposed by the current backend, so there are no live market rates to render yet.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {items.map((item, index) =>
            isLoading ? (
              <div key={`market-rate-skeleton-${index}`} className="flex items-center justify-between p-4">
                <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : (
              <article key={(item as YieldMarketRate).id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {(item as YieldMarketRate).iconText ?? (item as YieldMarketRate).label.slice(0, 1)}
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{(item as YieldMarketRate).label}</p>
                </div>
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatPercent((item as YieldMarketRate).apy)}
                </p>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}

const toneClassMap: Record<NonNullable<YieldAuditItem["tone"]>, string> = {
  success: "text-emerald-500 dark:text-emerald-400",
  info: "text-slate-600 dark:text-slate-300",
  neutral: "text-slate-500 dark:text-slate-400",
};

export function AuditLogCard({ title = "Audit Log", data, isLoading = false }: AuditLogCardProps) {
  const items = isLoading ? Array.from({ length: 3 }) : data;

  return (
    <section className="theme-surface theme-border rounded-2xl border p-4 shadow-sm sm:p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</h2>
      {!isLoading && data.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
          No recent audit events are available yet.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item, index) =>
            isLoading ? (
              <div key={`audit-skeleton-${index}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ) : (
              <article key={(item as YieldAuditItem).id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className={`text-sm font-semibold uppercase tracking-[0.08em] ${toneClassMap[(item as YieldAuditItem).tone ?? "neutral"]}`}>
                    {(item as YieldAuditItem).type}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{(item as YieldAuditItem).timeAgo}</p>
                </div>
                <p className="text-2xl leading-7 text-slate-800 dark:text-slate-200">
                  {(item as YieldAuditItem).message}{" "}
                  {(item as YieldAuditItem).valueHighlight ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {(item as YieldAuditItem).valueHighlight}
                    </span>
                  ) : null}
                </p>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}
