"use client";

import WalletAuthButton from "../../../components/walletAuthButton";

export default function ConnectPage() {
  return (
    <main className="theme-bg min-h-screen px-4 py-16">
      <div className="mx-auto w-full max-w-xl space-y-6 rounded-3xl border p-8 theme-border theme-surface">
        <div className="space-y-2">
          <h1 className="theme-text text-3xl font-bold tracking-tight">Connect your wallet</h1>
          <p className="theme-muted text-sm">
            Connect your wallet and sign a message to authenticate. No transactions are sent.
          </p>
        </div>
        <WalletAuthButton />
      </div>
    </main>
  );
}
