import { cn } from "../../../../lib/utils";

type AuditCardShellProps = {
  children: React.ReactNode;
  className?: string;
};

export default function AuditCardShell({ children, className }: AuditCardShellProps) {
  return (
    <div
      className={cn(
        "theme-surface theme-border rounded-xl border p-4 shadow-sm dark:shadow-none sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
