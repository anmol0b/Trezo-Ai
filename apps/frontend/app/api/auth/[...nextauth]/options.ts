import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bs58 from "bs58";
import nacl from "tweetnacl";

import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

/** Second arg to credentials `authorize` — only `headers` is populated (NextAuth does not pass `cookies`). */
type AuthorizeIncoming = { headers?: Record<string, string | string[] | undefined> };

/** Parse `Cookie` header (Next passes lowercase keys in App Router — see next-auth/next `Object.fromEntries(await headers())`). */
function readNonceFromCookieHeader(headers: AuthorizeIncoming["headers"]): string | null {
  const raw =
    typeof headers?.cookie === "string"
      ? headers.cookie
      : typeof headers?.Cookie === "string"
        ? headers.Cookie
        : Array.isArray(headers?.cookie)
          ? headers.cookie.join("; ")
          : Array.isArray(headers?.Cookie)
            ? headers.Cookie.join("; ")
            : null;
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === "kosh_auth_nonce") {
      const v = rest.join("=");
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    }
  }
  return null;
}

/** Nonce is the last line; value is what the wallet actually signed. */
function extractNonceFromMessage(message: string): string | null {
  const m = message.match(/Nonce:\s*(.+)$/m);
  return m?.[1]?.trim() ?? null;
}

function verifySolanaSignature({
  publicKey,
  signature,
  message,
}: {
  publicKey: string;
  signature: string;
  message: string;
}) {
  const messageBytes = new TextEncoder().encode(message);
  const sigBytes = bs58.decode(signature);
  const pubKeyBytes = bs58.decode(publicKey);
  return nacl.sign.detached.verify(messageBytes, sigBytes, pubKeyBytes);
}

async function consumeNonceIfPossible(nonce: string): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    // In production, don't allow login if Supabase is misconfigured
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Supabase not configured — blocking login in production');
      return false;
    }
    return true; // dev fallback only
  }

  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("auth_nonces")
      .select("nonce, expires_at, used_at")
      .eq("nonce", nonce)
      .maybeSingle();

    if (error) {
      // In production, treat DB errors as blocking
      return process.env.NODE_ENV !== 'production';
    }
    if (!data) return process.env.NODE_ENV !== 'production'; // no row = block in prod
    if (data.used_at) return false;
    if (data.expires_at && data.expires_at <= nowIso) return false;

    const { error: updErr } = await supabaseAdmin
      .from("auth_nonces")
      .update({ used_at: nowIso })
      .eq("nonce", nonce)
      .is("used_at", null);

    return !updErr;
  } catch {
    return process.env.NODE_ENV !== 'production';
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      id: "wallet",
      name: "Wallet",
      credentials: {
        publicKey: { label: "publicKey", type: "text" },
        signature: { label: "signature", type: "text" },
        message: { label: "message", type: "text" },
        nonce: { label: "nonce", type: "text" },
      },
      async authorize(credentials, req) {
        const publicKey = credentials?.publicKey?.trim();
        const signature = credentials?.signature?.trim();
        const message = credentials?.message ?? "";

        if (!publicKey || !signature || !message) return null;

        const embeddedNonce = extractNonceFromMessage(message);
        if (!embeddedNonce) return null;

        const nonceFromCookie = readNonceFromCookieHeader((req as AuthorizeIncoming | undefined)?.headers);
        // Cookie proves the same browser session issued the nonce. If App Router omits Cookie on this
        // request (common), we still have the wallet signature over the exact message (including nonce).
        if (nonceFromCookie && nonceFromCookie !== embeddedNonce) return null;

        const nonceOk = await consumeNonceIfPossible(embeddedNonce);
        if (!nonceOk) return null;

        const ok = verifySolanaSignature({ publicKey, signature, message });
        if (!ok) return null;

        const supabaseAdmin = getSupabaseAdmin();
        if (supabaseAdmin) {
          const now = new Date().toISOString();
          void (async () => {
            try {
              await supabaseAdmin.from("users").upsert(
                { wallet_public_key: publicKey, last_login_at: now },
                { onConflict: "wallet_public_key" },
              );
            } catch {
              /* best-effort; never block login */
            }
          })();
        }

        return { id: publicKey, publicKey };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        (token as JWT & { publicKey?: string }).publicKey = (user as { publicKey?: string }).publicKey ?? user.id;
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      (session as Session & { user: { publicKey?: string } }).user = {
        ...(session.user ?? {}),
        publicKey: (token as JWT & { publicKey?: string }).publicKey,
      };
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

