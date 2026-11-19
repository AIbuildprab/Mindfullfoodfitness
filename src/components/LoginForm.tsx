"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { signIn } from "@/lib/auth";
import { site } from "@/lib/site";

const field =
  "h-11 w-full rounded-md border border-white/10 bg-[#0f0f10] px-3.5 text-[15px] sm:h-12 sm:px-4 sm:text-base text-white outline-none transition placeholder:text-white/40 focus:border-gold";

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "notlive" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const data = new FormData(event.currentTarget);
    try {
      const res = await signIn(String(data.get("email")), String(data.get("password")));
      if (res.ok) {
        router.replace(next.startsWith("/") ? next : "/dashboard");
        router.refresh();
        return;
      }
      setStatus(res.reason === "not-live" ? "notlive" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-label="Account"
        className="grid grid-cols-2 gap-1 rounded-lg border border-white/5 bg-white/[0.06] p-1"
      >
        <span
          role="tab"
          aria-selected="true"
          className="flex min-h-10 items-center justify-center rounded-md bg-white/[0.07] text-xs sm:min-h-12 sm:text-sm font-bold tracking-[0.08em] text-[#e4e1da]/50 uppercase shadow-[inset_0_-2px_0_0_rgba(196,173,98,0.7)]"
        >
          Sign in
        </span>
        <Link
          href="/signup"
          role="tab"
          aria-selected="false"
          className="flex min-h-10 items-center justify-center rounded-md text-xs font-bold sm:min-h-12 sm:text-sm tracking-[0.08em] text-white/60 uppercase transition hover:text-white"
        >
          Sign up
        </Link>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-3.5 sm:mt-8 sm:space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold sm:mb-2 sm:text-[15px] text-[#e4e1da]/50">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className={field}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-semibold sm:mb-2 sm:text-[15px] text-[#e4e1da]/50">
            Password
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-pressed={show}
              className="inline-flex min-h-6 items-center px-1 text-xs font-semibold text-gold-2 hover:text-white"
            >
              {show ? "Hide" : "Show"}
            </button>
          </span>
          <input
            name="password"
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="current-password"
            placeholder="Min 8 characters"
            className={field}
          />
        </label>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-[#e4e1da]/50">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-[#86712f]"
            />
            Remember me
          </label>
          <a
            href={`mailto:${site.email}?subject=Password%20reset`}
            className="inline-flex min-h-10 items-center font-semibold text-gold-2 hover:text-white"
          >
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-gold/50 bg-gold/15 text-sm font-bold tracking-[0.08em] sm:text-base text-gold-2 uppercase transition hover:border-gold-deep hover:bg-gold-deep hover:text-white disabled:opacity-60"
        >
          {status === "sending" ? "Signing in…" : "Sign in"}
        </button>

        <div role="status" aria-live="polite">
          {status === "notlive" ? (
            <p className="rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm leading-relaxed text-white/90">
              Sign-in isn’t configured yet. Questions?{" "}
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gold-2 hover:text-white"
              >
                WhatsApp Paul
              </a>
              .
            </p>
          ) : null}
          {status === "error" ? (
            <p className="text-sm text-red-400">
              Couldn’t sign you in. Check your details and try again.
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-white/5" />}>
      <LoginFormInner />
    </Suspense>
  );
}
