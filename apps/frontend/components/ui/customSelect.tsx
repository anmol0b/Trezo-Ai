"use client";

import { useEffect, useRef, useState } from "react";

type SelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  className = "",
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="h-11 w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 pr-10 text-left text-sm font-medium text-zinc-900 outline-none transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <span className={selected ? "" : "text-zinc-500 dark:text-zinc-400"}>
          {selected ? selected.label : placeholder}
        </span>
      </button>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-500">▾</span>

      {open && !disabled ? (
        <div className="theme-surface theme-border absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border p-1 shadow-lg">
          {options.length > 0 ? (
            options.map((option) => {
              const isActive = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{option.label}</span>
                  {isActive ? <span>✓</span> : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">No options</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
