"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";

const DEFAULT_MESSAGE_PREFIX = "Sign in to Treszo AI";
let globalSignInInFlight = false;
let globalAutoAttemptedPubkey: string | null = null;

async function fetchNonce(): Promise<string> {
  const res = await fetch("/api/auth/nonce", { method: "GET", cache: "no-store" });
  if (!res.ok) throw new Error(`Nonce fetch failed: ${res.status}`);
  const data = (await res.json()) as { nonce: string };
  return data.nonce;
}

function buildSignInMessage(nonce: string) {
  const origin = typeof window === "undefined" ? "unknown" : window.location.origin;
  return `${DEFAULT_MESSAGE_PREFIX}\nDomain: ${origin}\nNonce: ${nonce}`;
}

export default function WalletAuthButton({
  className,
  redirectTo = "/dashboard",
  autoSignInOnConnect = true,
}: {
  className?: string;
  redirectTo?: string;
  autoSignInOnConnect?: boolean;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const wallet = useWallet();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const isAuthed = status === "authenticated";
  const showDebug = process.env.NODE_ENV !== "production";

  const connectedPubkey = useMemo(() => wallet.publicKey?.toBase58() ?? null, [wallet.publicKey]);
  const sessionPubkey = (session?.user as { publicKey?: string } | undefined)?.publicKey;
  const shortPubkey = connectedPubkey
    ? `${connectedPubkey.slice(0, 4)}…${connectedPubkey.slice(-4)}`
    : "none";

  const signMessageRef = useRef(wallet.signMessage);
  signMessageRef.current = wallet.signMessage;

  const handleSignIn = useCallback(async (source: "auto" | "manual" = "manual") => {
    const signMessage = signMessageRef.current;
    if (!signMessage) {
      setError("This wallet does not support message signing.");
      return;
    }
    if (!connectedPubkey) {
      setError("Connect wallet first.");
      return;
    }
    if (globalSignInInFlight) return;
    if (source === "auto") {
      if (globalAutoAttemptedPubkey === connectedPubkey) return;
      globalAutoAttemptedPubkey = connectedPubkey;
    }

    globalSignInInFlight = true;
    setIsSigningIn(true);
    setError(null);
    try {
      const nonce = await fetchNonce();
      const message = buildSignInMessage(nonce);
      const messageBytes = new TextEncoder().encode(message);
      const sigBytes = await signMessage(messageBytes);
      const signature = bs58.encode(sigBytes);

      const result = await signIn("wallet", {
        redirect: false,
        publicKey: connectedPubkey,
        signature,
        message,
      });

      if (!result) throw new Error("Authentication request failed.");
      if (result.error) {
        if (result.error === "CredentialsSignin") {
          throw new Error("Sign-in rejected (bad nonce or signature). Close the wallet popup and press Sign in again.");
        }
        throw new Error(result.error);
      }

      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign-in failed";
      setError(msg);
      console.error("[WalletAuthButton] sign-in failed", e);
    } finally {
      globalSignInInFlight = false;
      setIsSigningIn(false);
    }
  }, [connectedPubkey, redirectTo, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!connectedPubkey) globalAutoAttemptedPubkey = null;
  }, [connectedPubkey]);

  useEffect(() => {
    if (!autoSignInOnConnect) return;
    if (!connectedPubkey) return;
    if (isAuthed) return;
    if (isSigningIn) return;
    if (status === "loading") return;
    void handleSignIn("auto");
  }, [autoSignInOnConnect, connectedPubkey, handleSignIn, isAuthed, isSigningIn, status]);

  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
    router.refresh();
  }, [router]);

  // If the user is authenticated but their session wallet doesn't match the currently connected wallet,
  // encourage a re-auth (prevents confusion when switching wallets).
  const showReauth = isAuthed && connectedPubkey && sessionPubkey && connectedPubkey !== sessionPubkey;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        {mounted ? (
          <WalletMultiButton className="theme-border theme-text rounded-xl border px-4 py-2" />
        ) : (
          <button
            type="button"
            disabled
            className="theme-border theme-text rounded-xl border px-4 py-2 text-sm font-semibold opacity-60"
          >
            Connect Wallet
          </button>
        )}

        {isAuthed ? (
          <>
            <button
              type="button"
              onClick={() => router.push(redirectTo)}
              className="theme-border theme-text rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="theme-border theme-text rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void handleSignIn("manual")}
            disabled={!connectedPubkey || isSigningIn || status === "loading"}
            className="theme-border theme-text rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningIn ? "Signing…" : showReauth ? "Re-auth" : "Sign in"}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {showDebug ? (
        <p className="theme-muted mt-2 text-[11px]">
        </p>
      ) : null}
    </div>
  );
}

