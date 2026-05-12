"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SpecialText } from "../ui/test";
import { SlideUpText } from "../ui/split";
import { LandingButton } from "../ui/landingButton";



// --------- DEAD CODE ---------- //



// const fadeUp = {
//   hidden: { opacity: 0, y: 32 },
//   visible: (i: number) => ({
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
//   }),
// };

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

        {/* App preview mockup */}
        <motion.div
          custom={4}
          // variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="relative mx-auto mt-14 w-full max-w-4xl sm:mt-20"
        >
          {/* <div className="rounded-2xl border border-[#1E1E2E] bg-[#13131F] overflow-hidden shadow-2xl shadow-black/60"> */}
            {/* Window chrome */}
            {/* <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E1E2E]">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]/70" />
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]/70" />
              <span className="w-3 h-3 rounded-full bg-[#22C55E]/70" />
              <span className="flex-1 mx-4 text-center text-xs text-[#94A3B8] font-mono">
                app.trezoai.com/dashboard
              </span>
            </div> */}
            {/* Mock dashboard */}
            {/* <DashboardPreview /> */}
            <CardPreivew />
          {/* </div> */}
          {/* Fade bottom */}
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
        <iframe src="" allow="autoplay; fullscreen; picture-in-picture" className="absolute h-[140%] w-[120%] top-[-11%] left-[50%] rounded-[2.5rem] border-none pointer-events-none"></iframe>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
        <a
          href="/demo"
          className="transform rounded-full bg-slate-900 px-6 py-3 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-slate-800 active:scale-95 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
      Try Demo Now
      </a>
      </div>
    </div>
  );
}




// --------- DEAD CODE ---------- //




// function DashboardPreview() {
//   return (
//     <div className="flex h-[420px] bg-[#0D0D14]">
//       {/* Sidebar */}
//       <div className="w-52 border-r border-[#1E1E2E] p-4 flex flex-col gap-1 shrink-0">
//         <div className="text-xs text-[#94A3B8] font-semibold mb-3 px-2">NAVIGATION</div>
//         {["Dashboard", "Proposals", "Invoices", "Yield", "Audit", "Agents"].map(
//           (item, i) => (
//             <div
//               key={item}
//               className={`px-3 py-2 rounded-lg text-sm font-medium ${i === 0
//                   ? "bg-[#7C3AED]/20 text-[#A78BFA]"
//                   : "text-[#94A3B8] hover:text-[#F1F5F9]"
//                 }`}
//             >
//               {item}
//             </div>
//           )
//         )}
//       </div>
//       {/* Main */}
//       <div className="flex-1 p-6 overflow-hidden">
//         <div className="grid grid-cols-3 gap-3 mb-5">
//           {[
//             { label: "Total Treasury", value: "$2,847,500", color: "#A78BFA" },
//             { label: "Allocated", value: "$1,230,000", color: "#22C55E" },
//             { label: "In Yield", value: "$412,800", color: "#F59E0B" },
//           ].map((card) => (
//             <div key={card.label} className="bg-[#13131F] rounded-xl p-4 border border-[#1E1E2E]">
//               <div className="text-xs text-[#94A3B8] mb-1">{card.label}</div>
//               <div className="text-lg font-bold" style={{ color: card.color }}>
//                 {card.value}
//               </div>
//             </div>
//           ))}
//         </div>
//         <div className="grid grid-cols-2 gap-3">
//           <div className="bg-[#13131F] rounded-xl p-4 border border-[#1E1E2E]">
//             <div className="text-xs text-[#94A3B8] mb-3">AI Suggestions</div>
//             {["Approve invoice #INV-042 — $8,400", "Fund Engineering dept", "Yield threshold reached"].map(
//               (s) => (
//                 <div key={s} className="flex items-center gap-2 py-1.5 text-xs text-[#F1F5F9]">
//                   <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
//                   {s}
//                 </div>
//               )
//             )}
//           </div>
//           <div className="bg-[#13131F] rounded-xl p-4 border border-[#1E1E2E]">
//             <div className="text-xs text-[#94A3B8] mb-3">Recent Activity</div>
//             {[
//               { action: "Payout executed", time: "2m ago", color: "#22C55E" },
//               { action: "Invoice parsed", time: "14m ago", color: "#A78BFA" },
//               { action: "Yield deposited", time: "1h ago", color: "#F59E0B" },
//             ].map((a) => (
//               <div key={a.action} className="flex justify-between py-1.5 text-xs">
//                 <span style={{ color: a.color }}>{a.action}</span>
//                 <span className="text-[#94A3B8]">{a.time}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }