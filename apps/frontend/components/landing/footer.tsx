import Link from "next/link";

export default function Footer() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-10 pt-16">
      <div className="theme-border flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
        <p className="theme-muted text-xs">
          © 2026 Trezo AI. Built on Solana.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="https://x.com/trezo_ai"
            target="_blank"
            rel="noopener noreferrer"
            className="theme-muted text-xs hover:text-white transition-colors"
          >
            Twitter
          </Link>
          <Link
            href="https://github.com/anmol0b/Trezo-Ai"
            target="_blank"
            rel="noopener noreferrer"
            className="theme-muted text-xs hover:text-white transition-colors"
          >
            GitHub
          </Link>
          <span className="flex items-center gap-1.5 text-xs text-[#A3E635]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#A3E635]" />
            Build for hackathon
          </span>
        </div>
      </div>
    </div>
  );
}