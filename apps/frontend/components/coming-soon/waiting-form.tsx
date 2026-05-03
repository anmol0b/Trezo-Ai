"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { cn } from "../../lib/utils";

type FeedbackState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const initialFeedback: FeedbackState = {
  tone: "idle",
  message: "",
};

type WaitlistPayload = {
  email: string;
  source: string;
  company: string;
};

export function WaitlistForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(initialFeedback);
  const [isPending, startTransition] = useTransition();

  async function submitWaitlist(payload: WaitlistPayload) {
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setFeedback({
          tone: "error",
          message:
            result?.message ??
            "We couldn't save your email right now. Try again in a moment.",
        });
        return;
      }

      formRef.current?.reset();
      setFeedback({
        tone: "success",
        message: result?.message ?? "You're on the waitlist. We'll keep you posted.",
      });
    } catch (error) {
      console.error("Waitlist signup failed:", error);
      setFeedback({
        tone: "error",
        message: "We couldn't save your email right now. Try again in a moment.",
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();

    setFeedback(initialFeedback);

    startTransition(() => {
      void submitWaitlist({
        email,
        source: "coming-soon",
        company,
      });
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="w-full"
      aria-busy={isPending}
    >
      <div className="space-y-3">
        <div className="space-y-1 px-3 text-left">
        </div>

        <div
          className={cn(
            "flex w-full flex-col gap-2 rounded-[1.75rem] border border-neutral-300/80 bg-white/80 p-2 shadow-sm backdrop-blur-sm transition-[box-shadow,border-color] focus-within:border-neutral-900/40 focus-within:ring-2 focus-within:ring-neutral-900/15 sm:flex-row sm:items-center",
            isPending && "opacity-95",
          )}
        >
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="waitlist-company">Company</label>
            <input
              id="waitlist-company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <input
            id="waitlist-email"
            name="email"
            type="email"
            placeholder="you@somewhere.com"
            autoComplete="email"
            spellCheck={false}
            required
            className="h-11 w-full rounded-full border-none bg-transparent px-4 text-sm text-neutral-800 placeholder:text-neutral-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={isPending}
            className="h-11 shrink-0 rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1f2de] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Joining..." : "Join Waitlist"}
          </button>
        </div>

        <p
          role="status"
          aria-live="polite"
          className={cn(
            "px-3 text-sm",
            feedback.tone === "success" && "text-emerald-700",
            feedback.tone === "error" && "text-red-700",
            feedback.tone === "idle" && "text-neutral-500",
          )}
        >
          {feedback.message || "No spam. Just launch updates."}
        </p>
      </div>
    </form>
  );
}
