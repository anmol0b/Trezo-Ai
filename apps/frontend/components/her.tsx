import { ComingSoonBadge } from "./hero/coming-soon-badge";
import { FollowOnXButton } from "./hero/follow-on-x-button";
import { WaitlistForm } from "./hero/waitlist-form";

export function HeroSection() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f1f2de]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#fcfcf2_0%,#f1f2de_42%,#e8ead0_100%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 sm:py-8">
        <header className="flex justify-end">
          <FollowOnXButton href="https://x.com" />
        </header>

        <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 text-4xl font-semibold tracking-tight text-neutral-900 sm:mb-8 sm:text-5xl">
            Izuki
          </div>

          <ComingSoonBadge text="Coming Soon • Waitlist Open" />

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-neutral-900 sm:mt-8 sm:text-6xl md:text-7xl">
            Discover. Allocate. Compound.
          </h1>

          <p className="mt-5 max-w-2xl text-balance text-sm leading-7 text-neutral-600 sm:mt-6 sm:text-lg">
            Access the best onchain yields across vaults, stables, LSTs, and
            curated strategies, all in one place.
          </p>

          <div className="mt-8 w-full max-w-xl sm:mt-10">
            <WaitlistForm />
          </div>
        </section>
      </div>
    </main>
  );
}
