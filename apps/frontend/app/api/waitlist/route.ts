import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistPayload = {
  email?: unknown;
  source?: unknown;
  company?: unknown;
};

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeSource(value: unknown) {
  if (typeof value !== "string") return "coming-soon";

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "coming-soon";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WaitlistPayload;
    const email = normalizeEmail(payload.email);
    const source = normalizeSource(payload.source);
    const company = typeof payload.company === "string" ? payload.company.trim() : "";

    if (company) {
      return NextResponse.json(
        { message: "You're on the waitlist." },
        { status: 200 },
      );
    }

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { message: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("waitlist_signups")
      .insert([{ email, source }]);

    if (error?.code === "23505") {
      return NextResponse.json(
        { message: "That email is already on the waitlist." },
        { status: 200 },
      );
    }

    if (error) {
      console.error("Supabase waitlist insert failed:", error);
      return NextResponse.json(
        { message: "We couldn't save your email right now. Try again in a moment." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "You're on the waitlist. We'll keep you posted." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Waitlist route failed:", error);

    return NextResponse.json(
      { message: "We couldn't process that signup. Try again in a moment." },
      { status: 500 },
    );
  }
}
