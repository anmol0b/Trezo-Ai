"use client";
import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { SpecialText } from "../ui/test";

// --- fix code -------

const steps = [
  {
    step: "01",
    title: "Upload Invoice",
    description:
      "Drag-drop any PDF invoice. Kosh AI reads vendor, amount, line items, and flags anomalies via RAG — in under 3 seconds.",
  },
  {
    step: "02",
    title: "AI Parses & Validates",
    description:
      "Claude-powered parsing extracts structured data with a confidence score. Unusual vendors or amounts are flagged automatically.",
  },
  {
    step: "03",
    title: "Multisig Approves",
    description:
      "A proposal is created on-chain. Multisig members sign with their Solana wallet — no email chains, no spreadsheets.",
  },
  {
    step: "04",
    title: "Payout Executed",
    description:
      "Once threshold is met, payout executes on-chain. Idle USDC auto-routes to Kamino yield. Every action is auditable forever.",
  },
];

export function StickyScrollRevealDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setProgress(latest);
    const nextIndex = Math.min(
      steps.length - 1,
      Math.floor(latest * steps.length),
    );
    setActiveStep(nextIndex);
  });

  return (
    <section
      ref={sectionRef}
      className="theme-bg relative mt-0 pt-0"
      style={{ height: `${steps.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 text-center">
          <SpecialText className="theme-muted text-sm sm:text-base">
            THE FLOW
          </SpecialText>
        </div>

        <div className="mx-auto grid h-full w-full max-w-6xl grid-cols-1 gap-6 px-4 pb-8 pt-14 md:px-6 lg:grid-cols-2 lg:items-center">
          <div className="relative hidden h-full overflow-hidden lg:block">
            <div
              className="h-full will-change-transform"
              style={{
                transform: `translateY(-${progress * (steps.length - 1) * 100}vh)`,
              }}
            >
              {steps.map((item, index) => (
                <article key={item.step} className="flex h-[70vh] items-center">
                  <div className="max-w-xl pr-0 lg:pr-8">
                    <p
                      className={`mb-4 text-sm font-mono font-semibold ${
                        activeStep === index
                          ? "text-[lab(84.429%_-36.4165_58.8105)]"
                          : "theme-muted"
                      }`}
                    >
                      Step {item.step}
                    </p>
                    <h3
                      className={`text-3xl font-black md:text-5xl ${
                        activeStep === index ? "theme-text" : "theme-muted"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="theme-muted mt-5 max-w-lg text-base leading-relaxed md:text-lg">
                      {item.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <article className="flex h-[44vh] items-end lg:hidden">
            <div className="max-w-xl">
              <p className="mb-4 text-sm font-mono font-semibold text-[lab(84.429%_-36.4165_58.8105)]">
                Step {steps[activeStep]?.step}
              </p>
              <h3 className="theme-text text-3xl font-black md:text-5xl">
                {steps[activeStep]?.title}
              </h3>
              <p className="theme-muted mt-5 max-w-lg text-base leading-relaxed md:text-lg">
                {steps[activeStep]?.description}
              </p>
            </div>
          </article>

          <div className="theme-surface theme-border relative z-10 w-full self-start rounded-3xl border p-4 sm:p-6 lg:self-center">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0.5, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex aspect-video items-center justify-center rounded-2xl bg-[linear-gradient(to_bottom_right,#A3E635,lab(84.429%_-36.4165_58.8105))] p-6 text-center text-lg font-bold text-black"
            >
              {steps[activeStep]?.title}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
