import { IconLock } from "@tabler/icons-react";
import { cn } from "../../../../lib/utils";

type AuditFooterBarProps = {
  message: string;
  nodeLabel: string;
  latencyLabel: string;
  isLoading?: boolean;
  className?: string;
};

export default function AuditFooterBar({ message, nodeLabel, latencyLabel, isLoading = false, className }: AuditFooterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/80 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        className,
      )}
    >
      <div className="flex items-start gap-2 text-slate-600 dark:text-zinc-400">
        <IconLock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-zinc-500" stroke={1.5} aria-hidden />
        {isLoading ? (
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
        ) : (
          <p className="font-medium leading-relaxed">{message}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-slate-500 dark:text-zinc-500">
        {isLoading ? (
          <>
            <span className="inline-block h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
            <span className="inline-block h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
          </>
        ) : (
          <>
            <span>{nodeLabel}</span>
            <span>{latencyLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}
