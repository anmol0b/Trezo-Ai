import type { YieldPosition } from "./types";

type ActivePositionsCardProps = {
  positions: YieldPosition[];
  isLoading?: boolean;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatPercent = (value: number) =>
  `${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

function PositionRow({ item }: { item: YieldPosition }) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.3fr_1fr_0.7fr_0.8fr_auto] md:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {item.iconText ?? item.team.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{item.team}</p>
            {item.active ? (
              <span className="mt-1 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/40 dark:text-emerald-300">
                Active
              </span>
            ) : null}
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Provider: {item.provider} ({item.market})
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Position</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">${formatCurrency(item.amount)}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">APY</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{formatPercent(item.apy)}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Auto-Reinvest</p>
          <div className="mt-2">
            <span
              className={`inline-flex h-7 w-12 items-center rounded-full border p-1 transition-colors ${
                item.autoReinvest
                  ? "border-slate-500 bg-slate-700/90 dark:border-slate-400 dark:bg-slate-300"
                  : "border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800"
              }`}
              aria-label={`${item.team} auto reinvest ${item.autoReinvest ? "enabled" : "disabled"}`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-slate-100 ${
                  item.autoReinvest ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </div>
        </div>

        <div>
          <a
            href={item.manageHref ?? "#"}
            className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 md:w-auto"
          >
            Open Dept
          </a>
        </div>
      </div>
    </article>
  );
}

function PositionRowSkeleton() {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="animate-pulse space-y-3">
        <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="h-8 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </article>
  );
}

export default function ActivePositionsCard({ positions, isLoading = false }: ActivePositionsCardProps) {
  const rows = isLoading ? Array.from({ length: 3 }) : positions;

  return (
    <section className="theme-surface theme-border rounded-2xl border p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Department Yield Readiness
        </h2>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          Read only
        </span>
      </div>

      {!isLoading && positions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
          No departments or yield positions were returned by the backend yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((item, index) =>
            isLoading ? (
              <PositionRowSkeleton key={`yield-position-skeleton-${index}`} />
            ) : (
              <PositionRow key={(item as YieldPosition).id} item={item as YieldPosition} />
            ),
          )}
        </div>
      )}
    </section>
  );
}
