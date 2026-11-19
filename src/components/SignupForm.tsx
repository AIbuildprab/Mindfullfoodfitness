"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { offers } from "@/lib/content";
import { site } from "@/lib/site";

type Mode = "signup" | "login";

export function SignupForm() {
  const params = useSearchParams();
  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const mode: Mode =
    chosenMode ?? (params.get("mode") === "login" ? "login" : "signup");
  const planFromUrl = params.get("plan") ?? "";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, mode }),
      });
      const json = (await res.json()) as { ok?: boolean; whatsapp?: string };
      if (!res.ok || !json.whatsapp) throw new Error("failed");

      setStatus("ok");
      setMessage(
        mode === "signup"
          ? "Request received. Paul will confirm your plan and set up your account."
          : "Client dashboard logins aren’t live yet. Paul will send your access details.",
      );
      form.reset();
      window.open(json.whatsapp, "_blank", "noopener,noreferrer");
    } catch {
      setStatus("error");
      setMessage(`Something went wrong. Email ${site.email} or message Paul on WhatsApp.`);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:p-8">
      <div
        role="tablist"
        aria-label="Account"
        className="mb-6 grid grid-cols-2 gap-2 rounded-full border border-black/10 bg-neutral-100 p-1"
      >
        {(["signup", "login"] as Mode[]).map((value) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={mode === value}
            onClick={() => {
              setChosenMode(value);
              setStatus("idle");
              setMessage("");
            }}
            className={`rounded-full py-2.5 text-sm font-semibold transition ${
              mode === value
                ? "bg-black text-white"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            {value === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">First name</span>
              <input
                name="firstName"
                required
                autoComplete="given-name"
                className="h-12 w-full rounded-md border border-black/10 bg-white px-4 text-base text-black outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">Last name</span>
              <input
                name="lastName"
                autoComplete="family-name"
                className="h-12 w-full rounded-md border border-black/10 bg-white px-4 text-base text-black outline-none focus:border-gold"
              />
            </label>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-12 w-full rounded-md border border-black/10 bg-white px-4 text-base text-black outline-none focus:border-gold"
          />
        </label>

        {mode === "signup" ? (
          <>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">Mobile</span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                className="h-12 w-full rounded-md border border-black/10 bg-white px-4 text-base text-black outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">Plan you want</span>
              <select
                name="plan"
                defaultValue={planFromUrl || "Not sure yet"}
                className="h-12 w-full rounded-md border border-black/10 bg-white px-4 text-base text-black outline-none focus:border-gold"
              >
                <option>Not sure yet</option>
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.name}>
                    {offer.name} — from {offer.fromPrice}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">
                Main goal <span className="text-muted/60">(optional)</span>
              </span>
              <input
                name="goal"
                placeholder="Fat loss, strength, routine"
                className="h-12 w-full rounded-md border border-black/10 bg-white px-4 text-base text-black outline-none focus:border-gold"
              />
            </label>
          </>
        ) : null}

        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border-2 border-black bg-black text-sm font-semibold text-white transition hover:bg-transparent hover:text-black disabled:opacity-60"
        >
          {status === "sending"
            ? "Sending…"
            : mode === "signup"
              ? "Create my account"
              : "Request access"}
        </button>

        {message ? (
          <p
            className={`text-sm ${status === "error" ? "text-red-600" : "text-neutral-800"}`}
          >
            {message}
          </p>
        ) : null}

        <p className="text-xs leading-relaxed text-neutral-600">
          The client dashboard is launching soon. For now your details go
          straight to Paul, who confirms your plan and sets you up in the MFF
          app. Read our{" "}
          <Link href="/privacy" className="text-bronze hover:text-bronze-2">
            privacy notice
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
