"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "../lib/utils";
import { IconSun, IconMoon } from "@tabler/icons-react";

const THEME_TRANSITION_CLASS = "theme-transition";

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    const currentTheme = resolvedTheme === "light" ? "light" : "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.classList.add(THEME_TRANSITION_CLASS);
    setTheme(nextTheme);
    window.setTimeout(() => {
      document.documentElement.classList.remove(THEME_TRANSITION_CLASS);
    }, 350);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!mounted}
      className={cn(
        "theme-text theme-border inline-flex items-center justify-center rounded-xl border bg-transparent px-4 py-2 text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      aria-label="Toggle theme"
    >
      {mounted ? (resolvedTheme === "dark" ? <IconSun /> : <IconMoon />) : "Theme"}
    </button>
  );
}
