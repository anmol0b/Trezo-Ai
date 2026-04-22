"use client";

import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

type Theme = "dark" | "light";

const STORAGE_KEY = "kosh-theme";

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initialTheme = savedTheme === "light" ? "light" : "dark";

    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "theme-text theme-border inline-flex items-center justify-center rounded-xl border bg-transparent px-4 py-2 text-sm font-bold transition duration-200 hover:-translate-y-0.5",
        className,
      )}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "Creamy" : "Dark"}
    </button>
  );
}
