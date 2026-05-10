"use client";
 
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
 
// const problems = [
//   {
//     title: "Context Switching",
//     stat: "32%",
//     statLabel: "productivity drop",
//     description:
//       "Finance teams bleed time jumping between Notion, email, Slack, and spreadsheets just to approve a single payout.",
//   },
//   {
//     title: "Context Missing",
//     stat: "96%",
//     statLabel: "of teams affected",
//     description:
//       "Teams lack a unified financial knowledge base, causing invoice approvals to take 2+ weeks instead of hours.",
//   },
//   {
//     title: "Context Loss",
//     stat: "$250K",
//     statLabel: "institutional knowledge",
//     description:
//       "When a finance lead leaves, budget decisions, vendor history, and approval rationale walk out with them.",
//   },
//   {
//     title: "Context Stitching",
//     stat: "2.5h",
//     statLabel: "daily per team",
//     description:
//       'Searching for "why did we pay this vendor?" across scattered tools, fading memories and lost email chains.',
//   },
// ];
 
export default function ProblemSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const tagRef = useRef(null);
  const tagInView = useInView(tagRef, { once: true });
 
  return (
    <section className="theme-bg py-32">
      {/* Stats headline */}
      <div ref={ref} className="mx-auto mb-16 max-w-5xl px-6 text-center sm:mb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={tagInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="theme-surface theme-border theme-muted mb-10 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
          THE PROBLEM
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="theme-text text-4xl font-black leading-tight sm:text-5xl md:text-7xl"
        >
          60% of treasury knowledge is{" "}
          <span className="text-[#A3E635] italic">lost in context</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="theme-muted mt-5 text-lg sm:mt-6 sm:text-xl"
        >
          Tool sprawl is{" "}
          <span className="text-[#A3E635] font-semibold">killing context</span>{" "}
          and destroying financial productivity.
        </motion.p>
      </div>
 
      {/* Chaos visual */}
      <ChaosVisual />
 
      {/* 4-column problem cards */}
      {/* <div className="max-w-6xl mx-auto px-6 mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1E1E2E]">
        {problems.map((problem, i) => (
          <ProblemCard key={problem.title} problem={problem} index={i} />
        ))}
      </div> */}
 
      {/* The Problem pill + teaser */}
      {/* <div ref={tagRef} className="mt-28 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={tagInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1E1E2E] bg-[#13131F] text-sm text-[#94A3B8] mb-10"
        >
          <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
          THE PROBLEM
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 24 }}
          animate={tagInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-6xl font-black text-[#F1F5F9]"
        >
          When finance leads leave,
          <br />
          <span className="text-[#22C55E]">knowledge walks out.</span>
        </motion.h3>
      </div> */}
    </section>
  );
}
 
// function ProblemCard({
  // problem,
//   index,
// }: {
//   // problem: (typeof problems)[0];
//   index: number;
// }) {
//   const ref = useRef(null);
//   const inView = useInView(ref, { once: true });
//   return (
//     <motion.div
//       ref={ref}
//       initial={{ opacity: 0, y: 24 }}
//       animate={inView ? { opacity: 1, y: 0 } : {}}
//       transition={{ duration: 0.5, delay: index * 0.08 }}
//       className="bg-[#0D0D14] p-8 flex flex-col"
//     >
//       <h3 className="text-xl font-black text-[#F1F5F9] mb-4">
//         {problem.title}
//       </h3>
//       <div className="mb-3">
//         <span className="text-3xl font-black text-[#A78BFA]">
//           {problem.stat}
//         </span>{" "}
//         <span className="text-sm text-[#94A3B8]">{problem.statLabel}</span>
//       </div>
//       <p className="text-sm text-[#94A3B8] leading-relaxed">
//         {problem.description}
//       </p>
//     </motion.div>
//   );
// }
 
function ChaosVisual() {
  const tools = [
    { label: "Notion", color: "#F1F5F9", x: "8%", y: "50%" },
    { label: "Slack", color: "lab(84.429% -36.4165 58.8105)", x: "18%", y: "30%" },
    { label: "Gmail", color: "#EF4444", x: "18%", y: "70%" },
    { label: "Jira", color: "#3B82F6", x: "38%", y: "20%" },
    { label: "GPT", color: "#A3E635", x: "38%", y: "80%" },
    { label: "Sheets", color: "#A3E635", x: "54%", y: "50%" },
  ];
 
  const questions = [
    { text: "Who approved this?", x: "62%", y: "25%" },
    { text: "Why this vendor?", x: "65%", y: "65%" },
    { text: "Last payment date?", x: "72%", y: "45%" },
  ];
 
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="overflow-x-auto pb-2">
        <div className="relative h-44 min-w-[760px] md:h-56 md:min-w-[980px]">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 980 220"
        preserveAspectRatio="none"
      >
        {/* Tangled lines */}
        {[
          "M 80,110 C 220,30 220,190 380,110 C 500,50 580,170 700,110 C 760,80 820,140 880,110",
          "M 80,110 C 190,140 260,80 380,110 C 500,145 610,80 700,110 C 780,145 840,90 880,110",
          "M 80,110 C 210,185 300,40 380,110 C 500,180 620,40 700,110 C 780,150 845,80 880,110",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="#94A3B8"
            strokeWidth="1.5"
            fill="none"
            strokeOpacity={0.35}
          />
        ))}
        {/* Arrow to Kosh */}
        <path
          d="M 880,110 L 940,110"
          stroke="#A3E635"
          strokeWidth="2"
          fill="none"
          strokeOpacity="0.8"
          markerEnd="url(#arrow)"
        />
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#A3E635" />
          </marker>
        </defs>
      </svg>
 
      {tools.map((t) => (
        <div
          key={t.label}
          className="theme-surface theme-border theme-muted absolute -translate-x-1/2 -translate-y-1/2 transform rounded-xl border px-3 py-1.5 text-xs font-semibold"
          style={{ left: t.x, top: t.y === "50%" ? "58%" : t.y }}
        >
          {t.label}
        </div>
      ))}
 
      {questions.map((q) => (
        <div
          key={q.text}
          className="absolute -translate-x-1/2 -translate-y-1/2 transform rounded-2xl bg-white/95 px-3 py-1 text-xs font-medium text-gray-900 shadow"
          style={{ left: q.x, top: q.y }}
        >
          {q.text}
        </div>
      ))}
 
      <div
        className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-xl bg-[#A3E635] text-xl font-black text-black"
        style={{ left: "96%", top: "58%" }}
      >
        K
      </div>
    </div>
      </div>
    </div>
  );
}
 