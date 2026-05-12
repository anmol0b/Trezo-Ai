export type SpendingCardData = {
  spent: number;
  cap: number;
  currency?: string;
  fiscalPeriod?: string;
  heading?: string;
  subHeading?: string;
};

type SpendingCardProps = {
  data: SpendingCardData;
  className?: string;
  isLoading?: boolean;
};

const formatAmount = (value: number) =>
  value.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

function SpendingCardSkeleton() {
  return (
    <article className="theme-surface theme-border rounded-2xl border p-5 shadow-sm sm:p-6">
      <div
        className="mx-auto h-44 w-44 animate-pulse rounded-full border border-slate-200 dark:border-slate-800 sm:h-52 sm:w-52"
        style={{ borderWidth: 10 }}
      />
      <div className="mt-5 animate-pulse space-y-3">
        <div className="mx-auto h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mx-auto h-4 w-56 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mx-auto h-3 w-44 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </article>
  );
}

export default function SpendingCard({ data, className = "", isLoading = false }: SpendingCardProps) {
  if (isLoading) {
    return <SpendingCardSkeleton />;
  }

  const currency = data.currency ?? "USDC";
  const heading = data.heading ?? "Spending Status";
  const subHeading = data.subHeading ?? "Department Budget";
  const fiscalPeriod = data.fiscalPeriod ?? "MAY 2025";
  const remaining = Math.max(0, data.cap - data.spent);
  const percentSpent = data.cap > 0 ? clampPercent((data.spent / data.cap) * 100) : 0;

  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (percentSpent / 100) * circumference;

  return (
    <article
      className={`theme-surface theme-border rounded-2xl border p-5 shadow-sm transition-colors sm:p-6 ${className}`}
    >
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {heading}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500/80 dark:text-slate-500">
          {subHeading}
        </p>
      </header>

      <div className="mx-auto grid w-full max-w-xs place-items-center">
        <div className="relative h-56 w-56 sm:h-64 sm:w-64">
          <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="120" cy="120" r={radius} strokeWidth="14" className="fill-none stroke-slate-200 dark:stroke-slate-800" />
            <circle
              cx="120"
              cy="120"
              r={radius}
              strokeWidth="14"
              strokeLinecap="round"
              className="fill-none stroke-emerald-500 transition-all duration-500"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeOffset,
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              ${formatAmount(data.spent)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Spent
            </p>
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">{Math.round(percentSpent)}% used</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-center">
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
          of ${formatAmount(data.cap)} cap ·{" "}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">${formatAmount(remaining)}</span> remaining
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Fiscal Period: {fiscalPeriod} · {currency}
        </p>
      </div>
    </article>
  );
}