export type DepartmentCardItem = {
  id: string;
  name: string;
  walletAddress: string;
  status?: string;
  budgetSpent: number;
  budgetTotal: number;
  currency?: string;
  spendingRule: string;
  progressPercent?: number;
  detailsHref?: string;
};

type DepartmentCardsProps = {
  title?: string;
  data: DepartmentCardItem[];
  className?: string;
  isLoading?: boolean;
  skeletonCount?: number;
};

const formatNumber = (value: number) => value.toLocaleString("en-US");

const getProgress = (item: DepartmentCardItem) => {
  if (typeof item.progressPercent === "number") {
    return Math.max(0, Math.min(100, item.progressPercent));
  }

  if (item.budgetTotal <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (item.budgetSpent / item.budgetTotal) * 100));
};

const truncateAddress = (address: string) => {
  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

function DepartmentCard({ item }: { item: DepartmentCardItem }) {
  const progress = getProgress(item);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.name}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{truncateAddress(item.walletAddress)}</p>
        </div>
        {item.status ? (
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
            {item.status}
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Budget Progress</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{Math.round(progress)}%</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
            aria-hidden
          />
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {formatNumber(item.budgetSpent)} / {formatNumber(item.budgetTotal)} {item.currency ?? "USDC"}
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        {item.spendingRule}
      </div>

      {item.detailsHref ? (
        <a
          href={item.detailsHref}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          View Details <span aria-hidden>→</span>
        </a>
      ) : null}
    </article>
  );
}

function DepartmentCardSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="animate-pulse">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-10 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="mt-5 h-16 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="mt-5 h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </article>
  );
}

export default function DepartmentCards({
  title = "Department Infrastructure",
  data,
  className = "",
  isLoading = false,
  skeletonCount = 3,
}: DepartmentCardsProps) {
  const skeletonItems = Array.from({ length: skeletonCount });

  return (
    <section className={`w-full ${className}`}>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? skeletonItems.map((_, index) => <DepartmentCardSkeleton key={`dept-skeleton-${index}`} />)
          : data.map((item) => <DepartmentCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}