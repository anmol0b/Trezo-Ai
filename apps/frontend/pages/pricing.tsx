"use client";

import React, { useState } from "react";

type Plan = {
  name: string;
  tag: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    tag: "For small teams",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "Everything you need to get treasury operations off the ground.",
    features: [
      "Up to 50 invoices / month",
      "1 treasury wallet",
      "AI invoice parsing",
      "Basic anomaly detection",
      "Email support",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Pro",
    tag: "Most popular",
    monthlyPrice: 149,
    yearlyPrice: 119,
    description: "Full automation for growing organizations with complex payouts.",
    features: [
      "Unlimited invoices",
      "Up to 10 treasury wallets",
      "On-chain proposal execution",
      "Advanced RAG audit trail",
      "Multi-sig governance",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    tag: "Custom scale",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Tailored deployment for institutions that need full control.",
    features: [
      "Unlimited everything",
      "Custom wallet integrations",
      "Dedicated Solana RPC node",
      "SSO & role-based access",
      "SLA guarantees",
      "Dedicated account manager",
    ],
    cta: "Contact us",
    highlighted: false,
  },
];

export const Pricing = () => {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="bg-[#f0ebe1] px-6 py-24 min-h-screen font-serif">
      {/* Header */}
      <div className="text-center mb-14">
        <p className="font-mono text-xs tracking-[0.18em] text-[#8a7f70] uppercase mb-4">
          Simple, transparent pricing
        </p>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1a1a2e] leading-tight tracking-tight mb-5">
          Pick Your Plan
        </h2>
        <p className="text-[#5c5447] text-base max-w-md mx-auto leading-relaxed mb-9">
          No hidden fees. Cancel anytime. Every plan includes Solana-native execution.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-3 bg-[#e8e0d2] rounded-full p-1.5">
          <button
            onClick={() => setYearly(false)}
            className={`px-5 py-2 rounded-full font-mono text-xs tracking-widest uppercase font-semibold transition-all duration-200 ${
              !yearly
                ? "bg-[#1a1a2e] text-[#f0ebe1]"
                : "bg-transparent text-[#8a7f70]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-5 py-2 rounded-full font-mono text-xs tracking-widest uppercase font-semibold transition-all duration-200 flex items-center gap-2 ${
              yearly
                ? "bg-[#1a1a2e] text-[#f0ebe1]"
                : "bg-transparent text-[#8a7f70]"
            }`}
          >
            Yearly
            <span className="bg-[#c8b89a] text-[#1a1a2e] text-[10px] px-2 py-0.5 rounded-full font-bold">
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
        {plans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} yearly={yearly} />
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center mt-12 font-mono text-xs text-[#a09585] tracking-wide">
        All plans include 14-day free trial · No credit card required
      </p>
    </section>
  );
};

function PricingCard({ plan, yearly }: { plan: Plan; yearly: boolean }) {
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
  const isEnterprise = plan.monthlyPrice === 0;
  const h = plan.highlighted;

  return (
    <div
      className={`relative rounded-3xl transition-all duration-300 group
        ${
          h
            ? "bg-[#1a1a2e] border border-[#2e2e4a] shadow-2xl scale-[1.03] px-8 py-10"
            : "bg-white border border-[#ddd6c8] shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#c8b89a] px-7 py-9"
        }`}
    >
      {/* Tag */}
      <div className="mb-6">
        <span
          className={`font-mono text-[11px] tracking-[0.14em] uppercase font-bold px-3 py-1 rounded-full ${
            h
              ? "text-[#c8b89a] bg-[rgba(200,184,154,0.12)]"
              : "text-[#8a7f70] bg-[#f5f0e8]"
          }`}
        >
          {plan.tag}
        </span>
      </div>

      {/* Name */}
      <h3
        className={`text-2xl font-extrabold tracking-tight mb-2 ${
          h ? "text-[#f0ebe1]" : "text-[#1a1a2e]"
        }`}
      >
        {plan.name}
      </h3>

      {/* Description */}
      <p
        className={`text-sm leading-relaxed mb-7 ${
          h ? "text-[#9d9ab0]" : "text-[#7a7060]"
        }`}
      >
        {plan.description}
      </p>

      {/* Price */}
      <div className="mb-7">
        {isEnterprise ? (
          <div
            className={`text-3xl font-extrabold tracking-tight ${
              h ? "text-[#f0ebe1]" : "text-[#1a1a2e]"
            }`}
          >
            Custom
          </div>
        ) : (
          <div className="flex items-end gap-1">
            <span
              className={`text-base font-semibold mb-1.5 ${
                h ? "text-[#9d9ab0]" : "text-[#8a7f70]"
              }`}
            >
              $
            </span>
            <span
              className={`text-5xl font-extrabold leading-none tracking-[-0.04em] ${
                h ? "text-[#f0ebe1]" : "text-[#1a1a2e]"
              }`}
            >
              {price}
            </span>
            <span
              className={`text-sm mb-1.5 ${
                h ? "text-[#9d9ab0]" : "text-[#8a7f70]"
              }`}
            >
              / mo
            </span>
          </div>
        )}
        {!isEnterprise && yearly && (
          <p
            className={`font-mono text-[11px] mt-1 tracking-wide ${
              h ? "text-[#c8b89a]" : "text-[#a09585]"
            }`}
          >
            Billed ${price * 12}/year
          </p>
        )}
      </div>

      {/* Divider */}
      <div className={`h-px mb-6 ${h ? "bg-white/10" : "bg-[#ede8df]"}`} />

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span
              className={`shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center mt-0.5 ${
                h ? "bg-[rgba(200,184,154,0.15)]" : "bg-[#f0ebe1]"
              }`}
            >
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M1 4L3.5 6.5L9 1"
                  stroke={h ? "#c8b89a" : "#8a7f70"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span
              className={`text-sm leading-snug ${
                h ? "text-[#c8c6d4]" : "text-[#4a4438]"
              }`}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        className={`w-full py-3.5 rounded-2xl font-mono text-xs font-bold tracking-[0.14em] uppercase transition-all duration-200 ${
          h
            ? "bg-[#f0ebe1] text-[#1a1a2e] hover:bg-[#e0d8cc]"
            : "bg-transparent text-[#1a1a2e] border border-[#1a1a2e] hover:bg-[#1a1a2e] hover:text-[#f0ebe1]"
        }`}
      >
        {plan.cta} →
      </button>
    </div>
  );
}

export default Pricing;
