import { cn } from "../../../lib/utils";

type AuditCardShellProps = {
  children: React.ReactNode;
  className?: string;
};

export default function AuditCardShell({ children, className }: AuditCardShellProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-none sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
