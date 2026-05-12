import CollectiveBrain from "./collectiveBrain";
import FinalCTA from "./cta";
import Footer from "./footer";
import { NavbarDemo } from "../navbar/navBar";
import ProblemSection from "./promblex";
import SocialProof from "./social";
import Hero from "./hero";
import { StickyScrollRevealDemo } from "./flowState";
import Pricing from "../../app/pricing/page";

export default function LandingPage() {
  return (
    <main className="theme-bg min-h-screen transition-colors duration-300">
      <NavbarDemo />
      <section id="features">
        <Hero />
        <CollectiveBrain />
        <ProblemSection />
      </section>
      <section id="how">
        <StickyScrollRevealDemo />
      </section>
      <section id="contact">
        <SocialProof />
      </section>
       <FinalCTA />
      <Footer />
    </main>
  );
}

