"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "@/lib/auth";
import { site } from "@/lib/site";

const field =
  "h-12 w-full rounded-md border border-black/10 bg-white px-4 text-base text-black outline-none focus:border-gold";

export function LoginForm() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "notlive" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const data = new FormData(event.currentTarget);
    try {
      const res = await signIn(String(data.get("email")), String(data.get("password")));
      setStatus(res.ok ? "idle" : res.reason === "not-live" ? "notlive" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:p-8">
      <h2 className="text-2xl font-bold text-black">Client sign in</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Access your training, nutrition and check-ins.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            className={field}
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-medium text-neutral-700">
            Password
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-pressed={show}
              className="min-h-8 px-1 text-xs font-semibold text-gold hover:text-black"
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
            className={field}
          />
        </label>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex min-h-10 items-center gap-2 text-neutral-600">
            <input type="checkbox" name="remember" className="h-4 w-4 accent-black" />
            Keep me signed in
          </label>
          <a
            href={`mailto:${site.email}?subject=Password%20reset`}
            className="font-medium text-gold hover:text-black"
          >
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border-2 border-black bg-black text-sm font-semibold text-white transition hover:bg-transparent hover:text-black disabled:opacity-60"
        >
          {status === "sending" ? "Signing in…" : "Sign in"}
        </button>

        <div role="status" aria-live="polite">
          {status === "notlive" ? (
            <p className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-neutral-800">
              The client dashboard is launching soon, so sign-in isn’t live yet. Paul will send
              your access details as soon as it opens. Questions?{" "}
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gold hover:text-black"
              >
                WhatsApp Paul
              </a>
              .
            </p>
          ) : null}
          {status === "error" ? (
            <p className="text-sm text-red-600">
              Couldn’t sign you in. Check your details and try again.
            </p>
          ) : null}
        </div>
      </form>

      <p className="mt-6 border-t border-black/10 pt-5 text-sm text-neutral-600">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-gold hover:text-black">
          Create your account
        </Link>
      </p>
    </div>
  );
}
