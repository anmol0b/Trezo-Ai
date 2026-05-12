"use client";

import Footer from "../../../components/landing/footer";
import { NavbarDemo } from "../../../components/navbar/navBar";
import WalletAuthButton from "../../../components/walletAuthButton";

export default function ConnectPage() {
  return (
    <main className="theme-bg min-h-screen w-full flex flex-col">
      <NavbarDemo
        navItems={[
          { name: "Home", link: "/" },
        ]}
      />

      <section className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl rounded-3xl border p-8 theme-border theme-surface shadow-sm">
          <div className="space-y-2">
            <h1 className="theme-text text-3xl font-bold tracking-tight">
              Connect your wallet
            </h1>

            <p className="theme-muted text-sm leading-relaxed">
              Connect your wallet and sign a message to authenticate.
              No transactions are sent.
            </p>
          </div>

          <div className="mt-6">
            <WalletAuthButton />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}