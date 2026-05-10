// -- fix code, add components and remove dead code -------

// const links = {
//   Product: ["Dashboard", "Proposals", "Invoices", "Yield Management", "Audit Trail", "AI Agents"],
//   Integrations: ["Solana", "Phantom Wallet", "Backpack", "Kamino Finance", "Umbra Protocol"],
//   Resources: ["Documentation", "GitHub", "Changelog", "Blog", "Status"],
//   Company: ["About", "Pricing", "Security", "Privacy Policy", "Terms"],
// };

export default function Footer() {
  return (
    // <footer className="bg-[#0D0D14] border-t border-[#1E1E2E] pt-16 pb-10 px-6">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-16">
        {/* <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16"> */}
          {/* Brand */}
          {/* <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E] flex items-center justify-center text-black font-black text-sm">
                K
              </div>
              <span className="font-bold text-[#F1F5F9] text-lg">Trezo AI</span>
            </Link>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Autonomous treasury intelligence for Solana teams.
            </p>
          </div> */}

          {/* Link columns */}
          {/* {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">
                {group}
              </div>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))} */}
        {/* </div> */}

        <div className="theme-border flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="theme-muted text-xs">
            © 2026 Trezo AI. Built on Solana.
          </p>
          <div className="flex items-center gap-6">
            <span className="theme-muted text-xs">Twitter</span>
            <span className="theme-muted text-xs">Github</span>
            <span className="flex items-center gap-1.5 text-xs text-[#A3E635]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#A3E635]" />
              Build for hackathon
            </span>
          </div>
        </div>
      </div>
    // </footer>
  );
}