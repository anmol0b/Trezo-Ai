import Link from "next/link";
import AuditSummaryStrip from "../../audit/ui/auditSummaryStrip";
import type { AuditSummaryItem } from "../../audit/ui/types";

type DepartmentAuditSnapshotProps = {
  summary: AuditSummaryItem[];
  isLoading?: boolean;
};

export default function DepartmentAuditSnapshot({ summary, isLoading = false }: DepartmentAuditSnapshotProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Stealth audit</p>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">Period snapshot</h2>
        </div>
        <Link
          href="/audit"
          className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline dark:text-slate-300"
        >
          Open full audit trail
        </Link>
      </div>
      <AuditSummaryStrip items={summary} isLoading={isLoading} />
    </section>
  );
}
