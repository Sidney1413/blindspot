import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Blindspot — Founder Partnership Intelligence",
  description:
    "Identify founder partnership risks and unresolved expectations before making commitments.",
};

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand-cream text-brand-forest">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-48 -top-56 h-[36rem] w-[36rem] rounded-full border border-brand-line/80" />
        <div className="absolute -right-28 -top-36 h-[28rem] w-[28rem] rounded-full border border-brand-sage-soft" />
        <div className="absolute -bottom-48 -left-48 h-[30rem] w-[30rem] rounded-full border border-brand-sage-soft/80" />
      </div>

      <NavBar variant="home" />
      <main className="relative flex flex-1 items-center">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 py-8 sm:px-6 sm:py-12 md:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-16">
          <div className="relative z-10">
            <div
              aria-hidden="true"
              className="mb-4 flex items-center gap-2.5"
            >
              <span className="h-px w-10 bg-brand-sage" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-sage" />
            </div>
            <h1 className="max-w-3xl font-serif text-[clamp(2.8rem,5.8vw,5rem)] font-medium leading-[0.96] tracking-[-0.045em] text-brand-forest">
              Catch the landmines{" "}
              <span className="text-brand-sage-deep">before you sign.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-6 text-brand-muted sm:text-lg sm:leading-8">
              Understand where your expectations, commitments and agreements
              might collide before building a company together.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Link
                href="/assessment"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-forest-strong px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(32,75,55,0.16)] transition-colors hover:bg-brand-forest-deep"
              >
                Start assessment
              </Link>
              <Link
                href="/sample"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-line bg-brand-cream/80 px-6 py-2.5 text-sm font-semibold text-brand-forest-strong transition-colors hover:border-brand-sage hover:bg-brand-surface/70"
              >
                View illustrative report
              </Link>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="relative mx-auto hidden aspect-square w-full max-w-[390px] md:block"
          >
            <div className="absolute inset-2 rounded-full border border-brand-line" />
            <div className="absolute inset-12 rounded-full border border-brand-sage-soft" />
            <div className="absolute inset-[5.5rem] rounded-full bg-brand-sage-soft/70" />
            <svg
              viewBox="0 0 360 360"
              fill="none"
              className="absolute inset-0 h-full w-full"
            >
              <path
                d="M48 265C93 239 105 205 136 179C170 151 214 169 239 131C258 102 282 85 315 76"
                stroke="var(--sage)"
                strokeWidth="1.5"
              />
              <path
                d="M67 93C103 119 121 150 151 187C180 224 220 219 251 239C274 254 292 279 306 303"
                stroke="var(--line)"
                strokeWidth="1.5"
                strokeDasharray="3 7"
              />
              <circle cx="48" cy="265" r="4" fill="var(--sage)" />
              <circle cx="315" cy="76" r="4" fill="var(--sage)" />
              <circle cx="67" cy="93" r="4" fill="var(--line)" />
              <circle cx="306" cy="303" r="4" fill="var(--line)" />
              <circle cx="180" cy="180" r="22" fill="var(--cream)" />
              <circle
                cx="180"
                cy="180"
                r="21.25"
                stroke="var(--sage)"
                strokeWidth="1.5"
              />
              <circle cx="180" cy="180" r="7" fill="var(--forest-strong)" />
            </svg>
          </div>
        </section>
      </main>
      <SiteFooter variant="home" />
    </div>
  );
}
