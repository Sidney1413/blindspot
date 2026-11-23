"use client";

import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import {
  createSampleDiagnosticResult,
  SAMPLE_REPORT_CONTENT,
} from "@/lib/sample-report";

const sampleResult = createSampleDiagnosticResult();

export default function SampleReportPage() {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  async function handleCopyGuide() {
    const guide = SAMPLE_REPORT_CONTENT.guide.questions
      .map((question, index) => `${index + 1}. ${question}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(guide);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(115,144,118,0.08),transparent_50%)]" />

      <NavBar />

      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        <p className="mb-4 text-xs text-brand-muted">
          Illustrative fictional example.
        </p>

        <section
          aria-labelledby="sample-risk-score"
          className="rounded-2xl border border-brand-line bg-brand-surface p-5 sm:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1
              id="sample-risk-score"
              className="text-sm font-semibold text-brand-muted"
            >
              Risk score
            </h1>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-800">
              {sampleResult.level.toUpperCase()} RISK
            </span>
          </div>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-6xl font-bold tracking-tight text-brand-forest sm:text-7xl">
              {sampleResult.score}
            </span>
            <span className="text-xl font-semibold text-slate-400">/100</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            This example score is not a probability of business failure.
          </p>
        </section>

        <section aria-labelledby="sample-main-risks" className="mt-6">
          <h2
            id="sample-main-risks"
            className="text-xl font-semibold text-brand-forest"
          >
            Main risks
          </h2>
          <ol className="mt-3 grid gap-3 md:grid-cols-2">
            {SAMPLE_REPORT_CONTENT.risks.map((risk, index) => (
              <li
                key={risk.title}
                className="rounded-2xl border border-amber-500/25 bg-brand-surface p-5 sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-xs font-semibold text-amber-300">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold leading-6 text-brand-forest">
                      {risk.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {risk.whyItMatters}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-brand-forest-strong">
                      <span className="font-semibold">Practical action: </span>
                      {risk.action}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="sample-discussion-questions"
          className="mt-6 rounded-2xl border border-brand-line bg-brand-surface p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="sample-discussion-questions"
              className="text-lg font-semibold text-brand-forest"
            >
              Questions to discuss
            </h2>
            <button
              onClick={handleCopyGuide}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-line bg-brand-sage-soft px-3 py-2 text-xs font-medium text-brand-forest transition-colors hover:bg-brand-line"
            >
              {copyStatus === "copied" ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="h-3.5 w-3.5" />
                  <span>
                    {copyStatus === "error" ? "Copy failed" : "Copy guide"}
                  </span>
                </>
              )}
            </button>
          </div>
          <ol className="mt-4 space-y-3">
            {SAMPLE_REPORT_CONTENT.guide.questions.map((question, index) => (
              <li
                key={question}
                className="flex items-start gap-3 text-sm leading-6 text-slate-300"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-sage-soft text-xs font-semibold text-brand-forest-strong">
                  {index + 1}
                </span>
                {question}
              </li>
            ))}
          </ol>
          {copyStatus === "error" && (
            <p role="status" className="mt-3 text-xs text-amber-300">
              Clipboard access was unavailable. You can select and copy the
              questions.
            </p>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
