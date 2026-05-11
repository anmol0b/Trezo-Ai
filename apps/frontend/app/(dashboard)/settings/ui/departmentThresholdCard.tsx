"use client";

import { useEffect, useState } from "react";
import type { DepartmentThresholdsConfig } from "./types";

type DepartmentThresholdCardProps = {
  data: DepartmentThresholdsConfig;
  className?: string;
  isLoading?: boolean;
  savingDeptId?: string | null;
  feedbackMessage?: string;
  focusedDeptId?: string;
  onSave?: (deptId: string, idleThresholdUsdc: number) => void;
};

const cardShell =
  "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-colors dark:border-slate-800/90 dark:bg-slate-950/90 sm:p-6";

function ThresholdSkeleton() {
  return (
    <article className={cardShell}>
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-52 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-900" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`threshold-skeleton-${index}`} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-900" />
        ))}
      </div>
    </article>
  );
}

function shortId(value: string, left = 6, right = 6) {
  if (!value) return "Unavailable";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export default function DepartmentThresholdCard({
  data,
  className = "",
  isLoading = false,
  savingDeptId,
  feedbackMessage,
  focusedDeptId,
  onSave,
}: DepartmentThresholdCardProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const nextDrafts = Object.fromEntries(
      data.items.map((item) => [item.deptId, item.idleThresholdUsdc.toFixed(2).replace(/\.00$/, "")]),
    );
    setDrafts(nextDrafts);
  }, [data.items]);

  if (isLoading) return <ThresholdSkeleton />;

  return (
    <article id="department-thresholds" className={`${cardShell} ${className}`}>
      <header className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{data.title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{data.description}</p>
      </header>

      {feedbackMessage ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
          {feedbackMessage}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {data.items.map((item) => {
          const isFocused = focusedDeptId === item.deptId || focusedDeptId === item.pubkey;

          return (
            <div
              key={item.id}
              className={`rounded-xl border bg-slate-50/70 p-4 dark:bg-slate-900/50 ${
                isFocused
                  ? "border-violet-300 bg-violet-50/70 ring-2 ring-violet-200 dark:border-violet-600/50 dark:bg-violet-950/20 dark:ring-violet-900/40"
                  : "border-slate-200/70 dark:border-slate-800/80"
              }`}
            >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      item.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                  {isFocused ? (
                    <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      Selected
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{shortId(item.pubkey, 8, 8)}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.summary}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_auto] sm:items-end">
                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Idle threshold (USDC)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={drafts[item.deptId] ?? ""}
                    disabled={!data.canEdit || savingDeptId === item.deptId}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [item.deptId]: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none ring-violet-400/40 focus:ring-4 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const value = Number(drafts[item.deptId]);
                    if (!Number.isFinite(value) || value <= 0) return;
                    onSave?.(item.deptId, value);
                  }}
                  disabled={!data.canEdit || savingDeptId === item.deptId}
                  className="h-11 rounded-xl bg-slate-900 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  {savingDeptId === item.deptId ? "Saving..." : data.updateLabel}
                </button>
              </div>
            </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
