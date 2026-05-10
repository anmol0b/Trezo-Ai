"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { LandingButton } from "../ui/landingButton";

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="theme-bg px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="theme-surface theme-border relative mx-auto flex max-w-4xl flex-col items-center justify-between gap-10 overflow-hidden rounded-3xl border p-12 md:flex-row md:p-20"
      >
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-[lab(84.429%_-36.4165_58.8105)]/20 blur-[80px]" />

        <div className="relative z-10">
          <h2 className="theme-text text-4xl font-black leading-tight md:text-5xl">
            Your team&apos;s knowledge
            <br />
            is your moat.{" "}
            <span className="text-[#A3E635]">Protect it.</span>
          </h2>
          <p className="theme-muted mt-4 text-lg">
            GDPR · Encryption · Zero data retention
          </p>
          <div className="mt-8 flex items-center gap-4">
            <LandingButton asChild variant="primary">
              <Link href="/dashboard">Get Started →</Link>
            </LandingButton>
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          <Orb />
        </div>
      </motion.div>
    </section>
  );
}

function Orb() {
  return (
    <div className="relative w-40 h-40">
      <div className="absolute inset-0 animate-spin rounded-full bg-gradient-to-br from-[lab(84.429%_-36.4165_58.8105)] via-[#A3E635] to-[lab(84.429%_-36.4165_58.8105)] opacity-80 blur-sm" style={{ animationDuration: "8s" }} />
      <div className="absolute inset-3 flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--bg)] to-[var(--surface)]">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[lab(84.429%_-36.4165_58.8105)] to-[#A3E635] opacity-60" />
      </div>
    </div>
  );
}