import { IconExternalLink } from "@tabler/icons-react";
import AuditCardShell from "./auditCardShell";
import type { AuditTableColumn, AuditTransactionRow } from "./types";
import { cn } from "../../../../lib/utils";

type AuditTrailTableProps = {
  columns: AuditTableColumn[];
  rows: AuditTransactionRow[];
  isLoading?: boolean;
  className?: string;
};

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "USDC" ? "USD" : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

function TableSkeleton() {
  return (
    <AuditCardShell className="overflow-hidden p-0">
      <div className="animate-pulse border-b border-slate-200 px-4 py-3 dark:border-zinc-800 sm:px-5">
        <div className="flex gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`th-${i}`} className="h-3 flex-1 rounded bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
      {Array.from({ length: 6 }).map((_, r) => (
        <div key={`tr-${r}`} className="flex gap-4 border-b border-slate-100 px-4 py-4 dark:border-zinc-900 sm:px-5">
          {Array.from({ length: 7 }).map((_, c) => (
            <div key={`td-${r}-${c}`} className="h-4 flex-1 rounded bg-slate-100 dark:bg-zinc-900" />
          ))}
        </div>
      ))}
    </AuditCardShell>
  );
}

export default function AuditTrailTable({ columns, rows, isLoading = false, className }: AuditTrailTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (rows.length === 0) {
    return (
      <AuditCardShell className={cn("p-6", className)}>
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
          No audit events have been indexed yet.
        </div>
      </AuditCardShell>
    );
  }

  return (
    <AuditCardShell className={cn("overflow-hidden p-0", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-500 sm:px-5 sm:text-xs"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0 dark:border-zinc-900">
                <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-zinc-500 sm:px-5 sm:text-sm">{row.date}</td>
                <td className="px-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-zinc-100 sm:px-5">{row.vendor}</td>
                <td className="px-4 py-3.5 sm:px-5">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-zinc-800/80 dark:text-zinc-300">
                    {row.department}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-mono text-sm text-slate-900 dark:text-zinc-100 sm:px-5">{money(row.amount, row.currency)}</td>
                <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-zinc-500 sm:px-5 sm:text-sm">{row.addressDisplay}</td>
                <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-zinc-500 sm:px-5 sm:text-sm">{row.signatureDisplay}</td>
                <td className="px-4 py-3.5 sm:px-5">
                  <a
                    href={row.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-slate-500 transition hover:text-slate-900 dark:text-zinc-500 dark:hover:text-zinc-200"
                    aria-label={`Open explorer for ${row.vendor}`}
                  >
                    <IconExternalLink className="h-4 w-4" stroke={1.5} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AuditCardShell>
  );
}
