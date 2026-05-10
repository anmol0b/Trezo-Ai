"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SlideUpText } from "../ui/split";
import LogosCarousel from "../ui/logoCou";
import Image from "next/image";

const logos = [
  { src: "/logos/vercel.svg", alt: "Vercel logo" },
  { src: "/logos/google.svg", alt: "Google logo" },
  { src: "/logos/framer.svg", alt: "Framer logo" },
  { src: "/logos/discord.svg", alt: "Discord logo" },
  { src: "/logos/openai.svg", alt: "OpenAI logo" },
  { src: "/logos/phantom.svg", alt: "Phantom logo" },
  { src: "/logos/descript.svg", alt: "Descript logo" },
  { src: "/logos/netflix.svg", alt: "Netflix logo" },
  { src: "/logos/linear.svg", alt: "Linear logo" },
  { src: "/logos/notion.svg", alt: "Notion logo" },
  { src: "/logos/shopify.svg", alt: "Shopify logo" },
  { src: "/logos/duolingo.svg", alt: "Duolingo logo" },
  { src: "/logos/ramp.svg", alt: "Ramp logo" },
  { src: "/logos/tesla.svg", alt: "Tesla logo" },
  { src: "/logos/opensea.svg", alt: "OpenSea logo" },
  { src: "/logos/cursor.svg", alt: "Cursor logo" },
];

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
            <LogosCarousel count={4} className="gap-8 sm:gap-8image.png flex-wrap">
              {logos.map((logo) => (
                <Image
                  key={logo.src}
                  src={logo.src}
                  alt={logo.alt}
                  width={97}
                  height={97}
                  className={`h-27 w-27 object-contain opacity-70 not-dark:invert-100 pointer-events-none select-none`}
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
