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
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
            (activeId ? filter.id === activeId : Boolean(filter.active))
              ? "border-zinc-400 bg-zinc-200 text-zinc-900 dark:border-zinc-500 dark:bg-zinc-700 dark:text-zinc-100"
              : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
