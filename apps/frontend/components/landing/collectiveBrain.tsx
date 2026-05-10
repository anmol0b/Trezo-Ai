"use client";
 
// ------ fix component --------

export default function CollectiveBrain() {
  return (
    <section className="theme-bg relative overflow-hidden py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center sm:mb-16">
          {/* <SpecialText className="theme-muted mb-4 text-xs sm:text-sm">
            KNOWLEDGE LAYER
          </SpecialText> */}
          <h2 className="theme-text text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
            Your Treasury&apos;s{" "}
            <span className="text-[lab(84.429%_-36.4165_58.8105)]">Collective Brain</span>
          </h2>
          <p className="theme-muted mx-auto mt-4 max-w-3xl text-base sm:mt-5 sm:text-lg">
            One unified context across invoices, budgets, approvals, and execution history.
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-5">
            <h3 className="theme-text text-2xl font-bold sm:text-3xl">
              Fewer switches. Faster decisions.
            </h3>
            <p className="theme-muted text-base leading-relaxed sm:text-lg">
              Instead of jumping across tools, Kosh keeps the full treasury context in one place.
              Teams can review, approve, and execute with complete historical memory.
            </p>
            <ul className="theme-muted space-y-2 text-sm sm:text-base">
              <li>AI-parsed invoice context</li>
              <li>Approval rationale and signer history</li>
              <li>Linked on-chain actions for every payout</li>
            </ul>
          </div>

          <div className="theme-surface theme-border rounded-3xl border p-4 sm:p-6">
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-[linear-gradient(to_bottom_right,#A3E635,lab(84.429%_-36.4165_58.8105))] p-6 text-center text-lg font-bold text-black sm:text-xl">
              Collective Context View
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}