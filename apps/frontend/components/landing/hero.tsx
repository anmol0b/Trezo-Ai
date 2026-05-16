"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SpecialText } from "../ui/test";
import { SlideUpText } from "../ui/split";
import { LandingButton } from "../ui/landingButton";
import WalletAuthButton from "../walletAuthButton";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-28 sm:pt-36 lg:pt-44">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] rounded-full bg-[#A3E635]/10 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-2 text-center sm:px-4">
        {/* <motion.div
          custom={0}
          // variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1E1E2E] bg-[#13131F] text-sm text-[#94A3B8] mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          Solana-native treasury intelligence
        </motion.div> */}
        <SpecialText className="theme-muted mb-4 text-xs sm:mb-5 sm:text-sm">
          Solana-native treasury intelligence
        </SpecialText>

        {/* <motion.h1
          custom={1}
          // variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-5xl md:text-7xl font-black tracking-tight text-[#F1F5F9] leading-[1.05]"
        >
          Your Treasury's{" "}
          <span className="text-[#A78BFA]">Autonomous</span>
          <br />
          <span className="text-[#22C55E]">Brain.</span>
        </motion.h1> */}

        <SlideUpText
          split="words"
          className="theme-text text-4xl md:text-6xl font-black tracking-tight leading-[1.05]"
        >
          Your Treasury&apos;s Autonomous Brain
        </SlideUpText>

        <motion.p
          custom={2}
          // variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="theme-muted mt-5 max-w-[24ch] text-pretty text-base leading-relaxed sm:mt-6 sm:max-w-3xl sm:text-xl"
        >
          Trezo AI connects your invoices, budgets, and on-chain actions so every
          payout is parsed, verified, and executed — without manual overhead.
        </motion.p>

        <motion.div
          custom={3}
          // variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
        >
          {/* <Link
            href="https://github.com"
            target="_blank"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#1E1E2E] bg-[#13131F] hover:border-[#7C3AED]/50 text-[#F1F5F9] font-semibold text-base transition-all duration-200"
          >
            View on GitHub
          </Link> */}
          <LandingButton asChild variant="secondary">
            <Link href="https://github.com/anmol0b/Trezo-Ai" target="_blank">
              View on GitHub
            </Link>
          </LandingButton>
        </motion.div>

        <motion.div
          custom={4}
          // variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="relative mx-auto mt-14 w-full max-w-4xl sm:mt-20"
        >
          <CardPreivew />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg)] to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}

function CardPreivew() {
  return (
    <div className="group relative mx-auto mt-12 w-full max-w-7xl overflow-hidden rounded-[3rem] border-[15px] theme-border theme-surface shadow-2xl">
      <div className="relative w-full overflow-hidden rounded-[2.5rem] aspect-video">
        {/* <iframe src="./recoding.mp4" allow="autoplay; fullscreen; picture-in-picture" className="absolute h-[140%] w-[120%] top-[-11%] left-[1%] rounded-[2.5rem] border-none pointer-events-none"></iframe> */}
        <video
          src="/recoding.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute h-[140%] w-[120%] top-[-23%] left-[1%] rounded-[2.5rem] border-none pointer-events-none"
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
        {/* <a
          className="transform rounded-full bg-slate-900 px-6 py-3 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-slate-800 active:scale-95 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        > */}
          <WalletAuthButton showAuthActions={false} />
        {/* </a> */}
      </div>
    </div>
  );
}