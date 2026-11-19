"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signUp } from "@/lib/auth";
import { site } from "@/lib/site";

export function SignupForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password"));

    if (password !== String(data.get("confirm"))) {
      setStatus("error");
      setMessage("Passwords don’t match.");
      return;
    }

    setStatus("sending");
    const res = await signUp({
      firstName: String(data.get("firstName")),
      lastName: String(data.get("lastName")),
      email: String(data.get("email")),
      password,
    });

    if (res.ok) {
      if (!res.needsConfirmation) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      setStatus("ok");
      setMessage("Account created. Check your email to confirm it, then sign in.");
      form.reset();
      return;
    }

    setStatus("error");
    setMessage(
      res.reason === "not-live"
        ? `Sign-up isn’t configured yet. Email ${site.email} or message Paul on WhatsApp.`
        : res.reason === "network"
          ? "Couldn’t reach the server. Check your connection and try again."
          : res.message || "Couldn’t create your account. Try again.",
    );
  }

  const field =
    "h-11 w-full rounded-md border border-white/10 bg-[#0f0f10] px-3.5 text-[15px] sm:px-4 sm:text-[15px] text-white outline-none transition placeholder:text-white/40 focus:border-gold";
  const label = "mb-1.5 block text-sm font-semibold text-[#e4e1da]/50";

  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-label="Account"
        className="grid grid-cols-2 gap-1 rounded-lg border border-white/5 bg-white/[0.06] p-1"
      >
        <Link
          href="/login"
          role="tab"
          aria-selected="false"
          className="flex min-h-10 items-center justify-center rounded-md text-xs font-bold sm:text-sm tracking-[0.08em] text-white/60 uppercase transition hover:text-white"
        >
          Sign in
        </Link>
        <span
          role="tab"
          aria-selected="true"
          className="flex min-h-10 items-center justify-center rounded-md bg-white/[0.07] text-xs sm:text-sm font-bold tracking-[0.08em] text-[#e4e1da]/50 uppercase shadow-[inset_0_-2px_0_0_rgba(196,173,98,0.7)]"
        >
          Sign up
        </span>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>First name</span>
            <input name="firstName" required autoComplete="given-name" placeholder="First name" className={field} />
          </label>
          <label className="block">
            <span className={label}>Last name</span>
            <input name="lastName" autoComplete="family-name" placeholder="Last name" className={field} />
          </label>
        </div>

        <label className="block">
          <span className={label}>Email</span>
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
          <span className={`${label} flex items-center justify-between`}>
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
            autoComplete="new-password"
            placeholder="Min 8 characters"
            className={field}
          />
        </label>

        <label className="block">
          <span className={label}>Confirm password</span>
          <input
            name="confirm"
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Re-enter password"
            className={field}
          />
        </label>

        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-gold/50 bg-gold/15 text-sm font-bold tracking-[0.08em] sm:text-base text-gold-2 uppercase transition hover:border-gold-deep hover:bg-gold-deep hover:text-white disabled:opacity-60"
        >
          {status === "sending" ? "Creating…" : "Create account"}
        </button>

        <div role="status" aria-live="polite">
          {message ? (
            <p
              className={`text-sm ${status === "error" ? "text-red-400" : "rounded-lg border border-gold/40 bg-gold/10 p-4 leading-relaxed text-white/90"}`}
            >
              {message}
            </p>
          ) : null}
        </div>

        <p className="text-center text-xs leading-relaxed text-white/45">
          By creating an account you agree to our{" "}
          <Link href="/privacy" className="inline-flex min-h-8 items-center text-gold-2 hover:text-white">
            privacy notice
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
