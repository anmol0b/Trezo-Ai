import type { YieldSummaryCard } from "./types";

type SummaryCardsProps = {
  data: YieldSummaryCard[];
  isLoading?: boolean;
};

function SummaryCardSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-40 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </article>
  );
}

export default function SummaryCards({ data, isLoading = false }: SummaryCardsProps) {
  const cards = isLoading ? Array.from({ length: 3 }) : data;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((item, index) =>
        isLoading ? (
          <SummaryCardSkeleton key={`yield-summary-skeleton-${index}`} />
        ) : (
          <article
            key={(item as YieldSummaryCard).id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {(item as YieldSummaryCard).title}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {(item as YieldSummaryCard).value}
            </p>
            <p
              className={`mt-2 text-sm font-medium ${
                (item as YieldSummaryCard).accent === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {(item as YieldSummaryCard).subtext}
            </p>
          </article>
        ),
      )}
    </section>
  );
}
