import type { AuditFeedItem } from "../../../../lib/mockData";

type LiveAuditFeedProps = {
  data: AuditFeedItem[];
  isLoading?: boolean;
};

const feedToneClassMap: Record<NonNullable<AuditFeedItem["tone"]>, string> = {
  positive: "bg-emerald-500",
  neutral: "bg-slate-400 dark:bg-slate-500",
  critical: "bg-rose-500",
};

function LiveAuditFeedSkeleton() {
  return (
    <article className="theme-surface theme-border rounded-2xl border p-5 shadow-sm sm:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`audit-skeleton-${index}`} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
      </div>
    </article>
  );
}

export default function LiveAuditFeed({ data, isLoading = false }: LiveAuditFeedProps) {
  if (isLoading) {
    return <LiveAuditFeedSkeleton />;
  }

  return (
    <article className="theme-surface theme-border rounded-2xl border p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Live Audit Feed</h2>
      <div className="mt-4 space-y-4">
        {data.length > 0 ? (
          data.map((item) => (
            <div key={item.id} className="flex gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${feedToneClassMap[item.tone ?? "neutral"]}`} aria-hidden />
              <div>
                <p className="text-lg font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.timeAgo}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
            No audit activity has been returned for proposals yet.
          </div>
        )}
      </div>
    </article>
  );
}
