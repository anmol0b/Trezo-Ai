type UploadCardProps = {
  title: string;
  helperText: string;
  supportedLabel: string;
  className?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  selectedFileName?: string;
  statusText?: string;
  onSelectFiles?: (files: FileList) => void;
};

function UploadCardSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-950/90 sm:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-56 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-40 rounded-2xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 sm:h-56" />
        <div className="h-9 w-56 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </article>
  );
}

export default function UploadCard({
  title,
  helperText,
  supportedLabel,
  className = "",
  isLoading = false,
  isDisabled = false,
  selectedFileName,
  statusText,
  onSelectFiles,
}: UploadCardProps) {
  if (isLoading) return <UploadCardSkeleton />;

  return (
    <article
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-colors dark:border-slate-800/90 dark:bg-slate-950/90 sm:p-6 ${className}`}
    >
      <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/70 px-5 py-10 text-center dark:border-slate-700/80 dark:bg-slate-900/40 sm:px-8 sm:py-14">
        <div className="mx-auto grid max-w-md place-items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <span className="text-lg" aria-hidden>
              ⬆
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{helperText}</p>
          </div>

          <label
            className={`mt-2 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 ${
              isDisabled
                ? "cursor-not-allowed opacity-70"
                : "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              disabled={isDisabled}
              onChange={(event) => {
                if (event.target.files && onSelectFiles) onSelectFiles(event.target.files);
              }}
            />
            {isDisabled ? "Processing..." : "Select PDF"}
          </label>

          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {selectedFileName ? `Selected: ${selectedFileName}` : statusText ?? "Choose a PDF to start parsing."}
          </p>

          <p className="mt-2 inline-flex items-center rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
            {supportedLabel}
          </p>
        </div>
      </div>
    </article>
  );
}
