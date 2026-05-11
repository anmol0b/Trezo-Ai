import type { ProposalFilter } from "../../../../lib/mockData";

type ProposalFiltersProps = {
  filters: ProposalFilter[];
  isLoading?: boolean;
  activeId?: string;
  onSelect?: (id: string) => void;
};

function FilterSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`filter-skeleton-${index}`} className="h-9 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
  );
}

export default function ProposalFilters({ filters, isLoading = false, activeId, onSelect }: ProposalFiltersProps) {
  if (isLoading) {
    return <FilterSkeleton />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          type="button"
          key={filter.id}
          onClick={() => onSelect?.(filter.id)}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
            (activeId ? filter.id === activeId : Boolean(filter.active))
              ? "border-violet-300 bg-violet-200/80 text-violet-900 dark:border-violet-500/50 dark:bg-violet-500/30 dark:text-violet-100"
              : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
