type AiCardTone = "neutral" | "warning" | "positive" | "critical";

export type AiCardItem = {
  id: string;
  title?: string;
  message: string;
  recommendation?: string;
  tone?: AiCardTone;
  icon?: string;
  dismissLabel?: string;
  actionLabel?: string;
  dismissHref?: string;
  actionHref?: string;
};

type AiCardListProps = {
  data: AiCardItem[];
  heading?: string;
  className?: string;
  isLoading?: boolean;
  skeletonCount?: number;
  onDismiss?: (id: string) => void;
  onAction?: (id: string, href?: string) => void;
};

const toneBorderMap: Record<AiCardTone, string> = {
  neutral: "bg-slate-300 dark:bg-slate-700",
  warning: "bg-amber-400 dark:bg-amber-300",
  positive: "bg-emerald-400 dark:bg-emerald-300",
  critical: "bg-rose-400 dark:bg-rose-300",
};

function AiInsightCard({
  card,
  onDismiss,
  onAction,
}: {
  card: AiCardItem;
  onDismiss?: (id: string) => void;
  onAction?: (id: string, href?: string) => void;
}) {
  const tone = card.tone ?? "neutral";
  const dismissLabel = card.dismissLabel ?? "Dismiss";
  const actionLabel = card.actionLabel ?? "Take Action";
  const dismissIsLink = Boolean(card.dismissHref && card.dismissHref !== "#");
  const actionIsLink = Boolean(card.actionHref && card.actionHref !== "#");

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/90">
      <span
        className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${toneBorderMap[tone]}`}
        aria-hidden
      />

      <div className="pl-4 sm:pl-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-base dark:border-slate-700 dark:bg-slate-900">
            <span aria-hidden>{card.icon ?? "✦"}</span>
          </div>

          <div className="min-w-0 flex-1">
            {card.title ? (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {card.title}
              </p>
            ) : null}

            <p className="mt-1 text-base leading-7 text-slate-800 dark:text-slate-100">
              {card.message}
            </p>

            {card.recommendation ? (
              <p className="mt-4 text-lg font-semibold italic leading-7 text-slate-900 dark:text-slate-50">
                Recommendation: {card.recommendation}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {dismissIsLink ? (
            <a
              href={card.dismissHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-5 text-sm font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {dismissLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onDismiss?.(card.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-5 text-sm font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {dismissLabel}
            </button>
          )}

          {actionIsLink ? (
            <a
              href={card.actionHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-indigo-400 dark:bg-indigo-400 dark:text-slate-950 dark:hover:bg-indigo-300"
            >
              {actionLabel}
              <span aria-hidden>→</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onAction?.(card.id, card.actionHref)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-indigo-400 dark:bg-indigo-400 dark:text-slate-950 dark:hover:bg-indigo-300"
            >
              {actionLabel}
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function AiInsightCardSkeleton() {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="animate-pulse pl-4 sm:pl-5">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <div className="h-11 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-11 w-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </article>
  );
}

export default function AiCardList({
  data,
  heading = "Trezo AI Insight",
  className = "",
  isLoading = false,
  skeletonCount = 2,
  onDismiss,
  onAction,
}: AiCardListProps) {
  const skeletonItems = Array.from({ length: skeletonCount });

  return (
    <section className={`w-full ${className}`}>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {heading}
      </h2>

      <div className="space-y-4">
        {isLoading ? (
          skeletonItems.map((_, index) => <AiInsightCardSkeleton key={`ai-skeleton-${index}`} />)
        ) : data.length > 0 ? (
          data.map((card) => <AiInsightCard key={card.id} card={card} onDismiss={onDismiss} onAction={onAction} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            No AI insights are available from the current backend data.
          </div>
        )}
      </div>
    </section>
  );
}
