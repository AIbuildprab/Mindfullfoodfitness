import type { Metadata } from "next";
import Image from "next/image";
import { BackHome } from "@/components/BackHome";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Mindfull Food Fitness client account.",
  robots: { index: false },
};

// Full-screen, chrome-free sign-in: covers the site header and footer.
export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#0f0f10] text-white">
      <BackHome
        className="absolute top-3 left-3 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 text-[13px] font-semibold sm:min-h-11 sm:gap-2 sm:px-5 sm:text-sm transition hover:border-gold hover:text-gold-2 sm:top-7 sm:left-7"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 12H5m6-6-6 6 6 6" />
        </svg>
        Back to home
      </BackHome>

      <main className="mx-auto flex min-h-full w-full max-w-[500px] flex-col justify-start px-5 pt-16 pb-6 sm:pt-14 sm:pb-6">
        <div className="mb-5 text-center sm:mb-6">
          <Image
            src="/brand/Logo_Inverted.png"
            alt="Mindfull Food Fitness"
            width={168}
            height={56}
            priority
            className="mx-auto h-8 w-auto sm:h-11"
            style={{ width: "auto" }}
          />
          <h1 className="mt-3 text-base font-medium text-white/60 sm:mt-5 sm:text-lg">Welcome back</h1>
        </div>
        <LoginForm />
      </main>
    </div>
  );
}
