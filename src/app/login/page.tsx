import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { appFeatures } from "@/lib/content";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Mindfull Food Fitness client account.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <section className="bg-neutral-50 py-12 sm:py-20">
      <div className="mx-auto grid w-full max-w-6xl items-start gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            Client area
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] text-black sm:text-5xl">
            Welcome <span className="text-gold">back</span>
          </h1>
          <p className="mt-5 max-w-md text-neutral-600">
            Your plan, your numbers and your check-ins with Paul, all in one place.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-neutral-700">
            {appFeatures.map((f) => (
              <li key={f}>— {f}</li>
            ))}
          </ul>
        </div>
        <div className="order-1 lg:order-2">
          <LoginForm />
        </div>
      </div>
    </section>
  );
}
