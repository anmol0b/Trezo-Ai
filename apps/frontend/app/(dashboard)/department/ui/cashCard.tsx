export type GovernanceRuleStatus = "healthy" | "warning" | "critical" | "toggle";

export type GovernanceRule = {
  id: string;
  label: string;
  value: string;
  status?: GovernanceRuleStatus;
  enabled?: boolean;
};

type CashCardProps = {
  title?: string;
  subtitle?: string;
  rules: GovernanceRule[];
  editLabel?: string;
  onEditRules?: () => void;
  className?: string;
  isLoading?: boolean;
};

const statusStyles: Record<Exclude<GovernanceRuleStatus, "toggle">, string> = {
  healthy:
    "border-emerald-300/80 bg-emerald-100 text-emerald-700 dark:border-emerald-600/40 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning:
    "border-amber-300/80 bg-amber-100 text-amber-700 dark:border-amber-600/40 dark:bg-amber-900/30 dark:text-amber-300",
  critical: "border-rose-300/80 bg-rose-100 text-rose-700 dark:border-rose-600/40 dark:bg-rose-900/30 dark:text-rose-300",
};

function RuleIcon() {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      <span className="text-base" aria-hidden>
        ◈
      </span>
    </span>
  );
}

function RuleStatus({ status }: { status: Exclude<GovernanceRuleStatus, "toggle"> }) {
  return (
    <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-2 text-xs font-semibold ${statusStyles[status]}`}>
      ✓
    </span>
  );
}

function RuleToggle({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
        enabled
          ? "border-violet-400/70 bg-violet-500/30 dark:border-violet-500/60 dark:bg-violet-500/40"
          : "border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800"
      }`}
      aria-hidden
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform dark:bg-slate-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </span>
  );
}

function CashCardSkeleton() {
  return (
    <article className="theme-surface theme-border rounded-2xl border p-5 shadow-sm sm:p-6">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-5 w-52 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-10 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`cash-skeleton-${index}`} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
      </div>
    </article>
  );
}

export default function CashCard({
  title = "Spending Governance",
  subtitle = "Active enforcement layer",
  rules,
  editLabel = "Edit Rules",
  onEditRules,
  className = "",
  isLoading = false,
}: CashCardProps) {
  if (isLoading) {
    return <CashCardSkeleton />;
  }

  return (
    <article
      className={`theme-surface theme-border rounded-2xl border p-5 shadow-sm transition-colors sm:p-6 ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onEditRules}
          className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {editLabel}
        </button>
      </header>

      <div className="space-y-3">
        {rules.map((rule) => {
          const status = rule.status ?? "healthy";
          const isToggle = status === "toggle";

          return (
            <article
              key={rule.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/60"
            >
              <div className="flex min-w-0 items-center gap-3">
                <RuleIcon />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{rule.label}</p>
                  <p className="mt-1 truncate text-xl font-semibold text-slate-900 dark:text-slate-100">{rule.value}</p>
                </div>
              </div>

              {isToggle ? (
                <RuleToggle enabled={Boolean(rule.enabled)} />
              ) : (
                <RuleStatus status={status} />
              )}
            </article>
          );
        })}
      </div>
    </article>
  );
}