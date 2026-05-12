import type { ProposalRow, ProposalStatus } from "../../../../lib/mockData";

type ProposalTableProps = {
  data: ProposalRow[];
  isLoading?: boolean;
  onOpen?: (proposalId: string) => void;
};

const statusClassMap: Record<ProposalStatus, string> = {
  ready: "border-emerald-300/80 bg-emerald-100/80 text-emerald-700 dark:border-emerald-600/40 dark:bg-emerald-900/30 dark:text-emerald-300",
  pending: "border-amber-300/80 bg-amber-100/80 text-amber-700 dark:border-amber-600/40 dark:bg-amber-900/30 dark:text-amber-300",
  executed: "border-sky-300/80 bg-sky-100/80 text-sky-700 dark:border-sky-600/40 dark:bg-sky-900/30 dark:text-sky-300",
  flagged: "border-rose-300/80 bg-rose-100/80 text-rose-700 dark:border-rose-600/40 dark:bg-rose-900/30 dark:text-rose-300",
  cancelled: "border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const formatCurrency = (amount: number, currency: string) =>
  `${currency === "USD" ? "$" : ""}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function ProposalTableSkeleton() {
  return (
    <article className="theme-surface theme-border rounded-2xl border p-4 shadow-sm md:p-5">
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`proposal-row-skeleton-${index}`} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-900" />
        ))}
      </div>
    </article>
  );
}

function ApprovalAvatars({ reviewers }: { reviewers: string[] }) {
  if (reviewers.length === 0) {
    return <span className="text-xs text-slate-500 dark:text-slate-500">Rejected</span>;
  }

  return (
    <div className="flex items-center">
      {reviewers.slice(0, 3).map((reviewer, index) => (
        <span
          key={`${reviewer}-${index}`}
          className="-ml-2 first:ml-0 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          title={reviewer}
        >
          {reviewer}
        </span>
      ))}
    </div>
  );
}

export default function ProposalTable({ data, isLoading = false, onOpen }: ProposalTableProps) {
  if (isLoading) {
    return <ProposalTableSkeleton />;
  }

  return (
    <article className="theme-surface theme-border overflow-hidden rounded-2xl border shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-left">
          <thead className="border-b border-slate-200/80 bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-900/70">
            <tr className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              <th className="px-3 py-3">#</th>
              <th className="px-3 py-3">Vendor</th>
              <th className="px-3 py-3">Department</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">AI Score</th>
              <th className="px-3 py-3">Approvals</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((proposal) => (
              <tr
                key={proposal.id}
                className="border-b border-slate-200/60 last:border-0 dark:border-slate-800/60"
              >
                <td className="px-3 py-4 text-xs font-semibold tracking-[0.16em] text-slate-500 dark:text-slate-500">{proposal.index}</td>
                <td className="px-3 py-4">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{proposal.vendor}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{proposal.hash}</p>
                </td>
                <td className="px-3 py-4 text-sm font-semibold uppercase tracking-[0.1em] text-slate-700 dark:text-slate-300">
                  {proposal.department}
                </td>
                <td className="px-3 py-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(proposal.amount, proposal.currency)}
                </td>
                <td className="px-3 py-4">
                  <span className="inline-flex rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {proposal.category}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {proposal.aiScore}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <div className="flex items-center gap-3">
                    <ApprovalAvatars reviewers={proposal.approvals.reviewers} />
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-500">
                      {proposal.approvals.signed}/{proposal.approvals.required} Signed
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusClassMap[proposal.status]}`}>
                    {proposal.status}
                  </span>
                </td>
                <td className="px-3 py-4 text-sm text-slate-600 dark:text-slate-300">{proposal.date}</td>
                <td className="px-3 py-4">
                  <button
                    type="button"
                    onClick={() => onOpen?.(proposal.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Open row actions"
                  >
                    <span aria-hidden>⋯</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
