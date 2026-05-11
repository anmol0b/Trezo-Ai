import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";

function generateNonce() {
  return crypto.randomUUID();
}

export async function GET() {
  const nonce = generateNonce();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const supabaseAdmin = getSupabaseAdmin();
  if (supabaseAdmin) {
    // Best-effort: if the table isn't present or insert fails, cookie-based flow still works.
    try {
      await supabaseAdmin.from("auth_nonces").insert({ nonce, expires_at: expiresAt });
    } catch {
      // ignore
    }
  }

  const cookieStore = await cookies();
  cookieStore.set("kosh_auth_nonce", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5,
    path: "/",
  });

  return NextResponse.json({ nonce });
}

