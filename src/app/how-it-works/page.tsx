import type { Metadata } from "next";
import { NavBar } from "@/components/nav-bar";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "How it works — Blindspot",
  description: "Understand how Blindspot reviews founder partnerships.",
};

const steps = [
  {
    title: "Answer questions",
    description:
      "Tell us about ownership, commitment, money, roles and decision-making.",
  },
  {
    title: "Get your analysis",
    description:
      "Blindspot identifies potential risks, conflicting expectations and unclear agreements.",
  },
  {
    title: "Agree on next steps",
    description: "See what needs discussion before you sign.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground">
      <NavBar />

      <main className="flex flex-1 items-center">
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <header className="max-w-3xl">
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-slate-50 sm:text-5xl">
              How it works
            </h1>
            <p className="mt-4 text-lg leading-7 text-slate-300 sm:text-xl">
              Understand the risks before you commit.
            </p>
          </header>

          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-brand-line bg-brand-surface p-5 sm:p-6"
              >
                <span                 className="text-xs font-semibold tracking-wider text-brand-sage-deep">
                  0{index + 1}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-brand-forest">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
