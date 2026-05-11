export type LiveActivityTone = "neutral" | "success" | "warning" | "critical" | "info";

export type LiveActivityItem = {
  id: string;
  title: string;
  subtitle?: string;
  vendor?: string;
  department?: string;
  amount: number | string;
  currency?: string;
  timeAgo: string;
  tone?: LiveActivityTone;
};

type LiveCardProps = {
  data: LiveActivityItem[];
  heading?: string;
  statusLabel?: string;
  latencyLabel?: string;
  className?: string;
  isLoading?: boolean;
  skeletonCount?: number;
};

const toneDotMap: Record<LiveActivityTone, string> = {
  neutral: "bg-slate-400 dark:bg-slate-500",
  success: "bg-emerald-400 dark:bg-emerald-300",
  warning: "bg-amber-400 dark:bg-amber-300",
  critical: "bg-rose-400 dark:bg-rose-300",
  info: "bg-violet-400 dark:bg-violet-300",
};

const formatAmount = (amount: number | string) => {
  if (typeof amount === "number") {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return amount;
};

const getMetaLabel = (item: LiveActivityItem) => {
  if (item.vendor && item.department) {
    return `${item.vendor} · ${item.department}`;
  }

  if (item.vendor) {
    return `Vendor: ${item.vendor}`;
  }

  if (item.department) {
    return `Department: ${item.department}`;
  }

  return item.subtitle ?? "";
};

function LiveActivityRow({ item }: { item: LiveActivityItem }) {
  const tone = item.tone ?? "neutral";
  const metaLabel = getMetaLabel(item);

  return (
    <article className="flex items-start gap-3 py-4 first:pt-0 last:pb-0 sm:items-center sm:gap-4">
      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${toneDotMap[tone]} sm:mt-0`} aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
        {metaLabel ? (
          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{metaLabel}</p>
        ) : null}
        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          ${formatAmount(item.amount)}{" "}
          <span className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {item.currency ?? "USDC"}
          </span>
        </p>
      </div>

      <p className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">{item.timeAgo}</p>
    </article>
  );
}

function LiveActivityRowSkeleton() {
  return (
    <article className="flex items-start gap-3 py-4 first:pt-0 last:pb-0 sm:items-center sm:gap-4">
      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800 sm:mt-0" />
      <div className="min-w-0 flex-1 animate-pulse space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-800" />
    </article>
  );
}

export default function LiveCard({
  data,
  heading = "Live Activity Feed",
  statusLabel = "Active",
  latencyLabel = "1.2ms latency",
  className = "",
  isLoading = false,
  skeletonCount = 4,
}: LiveCardProps) {
  const skeletonItems = Array.from({ length: skeletonCount });

  return (
    <section className={`w-full ${className}`}>
      <div className="rounded-2xl bg-white/95 p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/90 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 dark:border-slate-800">
          <h2 className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            {heading}
          </h2>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {statusLabel}: {latencyLabel}
          </p>
        </div>

        <div className="divide-y border rounded-md border-slate-500 p-4 divide-slate-200 dark:divide-slate-800">
          {isLoading ? (
            skeletonItems.map((_, index) => <LiveActivityRowSkeleton key={`live-skeleton-${index}`} />)
          ) : data.length > 0 ? (
            data.map((item) => <LiveActivityRow key={item.id} item={item} />)
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
              No live activity has been returned by the backend yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
