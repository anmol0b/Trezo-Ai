"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SlideUpText } from "../ui/split";
import LogosCarousel from "../ui/logoCou";
import Image from "next/image";

const logos = [
  { src: "/logo/phantom.svg", alt: "Phantom logo" },
  { src: "/logo/metamask.svg", alt: "Metamask logo" },
  { src: "/logo/solana.svg", alt: "Solana logo" },
  { src: "/logo/superteam.svg", alt: "Superteam logo" },
];
const loopedLogos = [...logos, ...logos];

export default function SocialProof() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="theme-bg overflow-hidden py-24">
      <div className="max-w-6xl mx-auto px-6 mt-0">
        {/* Integrations marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          {/* <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#94A3B8] mb-8">
            Integrates with your stack
          </p> */}
          <SlideUpText
            split="words"
            className="theme-muted mb-20 flex items-center justify-center text-center text-3xl font-semibold uppercase tracking-widest"
          >
            Integrates with your stack
          </SlideUpText>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* {integrations.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1E1E2E] bg-[#13131F] text-sm text-[#94A3B8]"
              >
                <span>{tool.icon}</span>
                <span className="font-medium">{tool.name}</span>
              </motion.div>
            ))} */}
            <LogosCarousel count={4} className="flex-wrap gap-8 sm:gap-8">
              {loopedLogos.map((logo, index) => (
                <Image
                  key={`${logo.src}-${index}`}
                  src={logo.src}
                  alt={logo.alt}
                  width={160}
                  height={56}
                  className="pointer-events-none h-12 w-auto select-none object-contain opacity-80 dark:opacity-70"
                  unoptimized
                />
              ))}
            </LogosCarousel>
          </div>
        </motion.div>

        {/* Stats row */}
        {/* <div className="theme-border grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[var(--border)] md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="theme-surface p-8 text-center"
            >
              <div className="theme-text mb-2 text-3xl font-black md:text-4xl">
                {stat.value}
              </div>
              <div className="theme-muted text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div> */}
      </div>
    </section>
  );
}
