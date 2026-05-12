export type DashboardCardData = {
  title: string;
  value: number | string;
  currency?: string;
  description: string;
};

type CardComponentProps = {
  data: DashboardCardData[];
  className?: string;
  isLoading?: boolean;
  skeletonCount?: number;
};

const formatValue = (value: number | string) => {
  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }

  return value;
};

export default function CardComponent({
  data,
  className = "",
  isLoading = false,
  skeletonCount = 4,
}: CardComponentProps) {
  const visibleCards = isLoading ? Array.from({ length: skeletonCount }) : data;

  return (
    <section className={`w-full ${className}`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleCards.map((card, index) => (
          <article
            key={isLoading ? `skeleton-${index}` : `${(card as DashboardCardData).title}-${index}`}
            className="theme-surface theme-border rounded-2xl border p-5 shadow-sm transition-colors"
          >
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="h-9 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="mt-3 h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {(card as DashboardCardData).title}
                </p>

                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatValue((card as DashboardCardData).value)}
                  </p>
                  {(card as DashboardCardData).currency ? (
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {(card as DashboardCardData).currency}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-400">
                  {(card as DashboardCardData).description}
                </p>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}