"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "../../components/ui/resizable-navbar";
import { useState } from "react";
import ThemeToggle from "../themeToggle";
import WalletAuthButton from "../walletAuthButton";
// import ConnectPage from "../../app/(auth)/connect/page";

type NavItem = {
  name: string;
  link: string;
};

type NavbarDemoProps = {
  navItems?: NavItem[];
};

export function NavbarDemo({ navItems }: NavbarDemoProps) {

  const defaultArgs = [
    { name: "Features", link: "#features" },
    { name: "How", link: "#how" },
    { name: "Pricing", link: "/pricing" },
    // { name: "Contact", link: "#contact" },
  ];

  const items = navItems ?? defaultArgs;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={items} />
          <div className="flex items-center gap-4">
            <ThemeToggle className="theme-border theme-text rounded-xl border px-4 py-2" />
            <WalletAuthButton />
            {/* <div className="flex items-center justify-center"> */}
{/* <ConnectPage /> */}
            {/* </div> */}
            
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {items.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="theme-muted relative"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4">
              <ThemeToggle className="theme-border theme-text w-full rounded-xl border px-4 py-2" />
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}