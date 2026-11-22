"use client";

import { useState } from "react";
import type { DiagnosticResult, DimensionScore } from "@/lib/types";
import { CheckIcon, CopyIcon } from "./icons";

interface DiagnosticReportProps {
  result: DiagnosticResult;
  leadEmail: string;
  setLeadEmail: (email: string) => void;
  leadState: "idle" | "sent";
  onLeadSubmit: () => void;
}

export function DiagnosticReport({
  result,
  leadEmail,
  setLeadEmail,
  leadState,
  onLeadSubmit,
}: DiagnosticReportProps) {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleCopy() {
    if (!result.script) return;
    navigator.clipboard.writeText(result.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!leadEmail.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("https://formspree.io/f/xaeqabwy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: leadEmail,
          riskScore: result.score,
          riskLevel: result.level,
          summary: result.summary,
        }),
      });

      if (response.ok) {
        onLeadSubmit();
        setLeadEmail("");
      } else {
        alert("Something went wrong submitting your request. Please try again.");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert("Submission failed. Check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const ai = result.aiAnalysis;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* 1. Exposure Index Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium tracking-wider text-slate-400 uppercase">
              Partnership Risk Exposure Index
            </span>
            {ai?.isAIGenerated ? (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
                Gemini AI Intelligence Active
              </span>
            ) : (
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-indigo-200">
                Deterministic Risk Engine
              </span>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
              result.level === "Critical"
                ? "border border-red-500/30 bg-red-500/10 text-red-400"
                : result.level === "High"
                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
            }`}
          >
            {result.level} Risk
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-6xl font-bold tracking-tight text-white sm:text-7xl">
            {result.score}
          </span>
          <span className="text-3xl font-semibold text-slate-400">%</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-all duration-700 ease-out ${
              result.score >= 80
                ? "bg-gradient-to-r from-amber-500 to-red-500"
                : result.score >= 65
                  ? "bg-gradient-to-r from-cyan-500 to-amber-500"
                  : "bg-cyan-400"
            }`}
            style={{ width: `${result.score}%` }}
          />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
          {ai?.executiveSummary || result.summary}
        </p>

        {/* Key Diagnostic Signals */}
        {result.explanations && result.explanations.length > 0 ? (
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Key Diagnostic Signals
            </h4>
            <ul className="mt-3 space-y-2.5">
              {result.explanations.map((explanation, index) => {
                const match = explanation.match(
                  /^\[(.*?)\]\s*(.*?)(?:\s*\(\+\d+\))?$/,
                );
                const domain = match ? match[1] : null;
                const text = match ? match[2] : explanation;

                return (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-300 sm:text-sm"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                    <span>
                      {domain ? (
                        <span className="mr-2 inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium tracking-wider text-cyan-300/90 uppercase">
                          {domain}
                        </span>
                      ) : null}
                      {text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      {/* 2. Six-Dimension Partnership Health Breakdown */}
      {result.dimensions && result.dimensions.length > 0 ? (
        <div className="mt-12">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-100">
              Six-Dimension Health Analysis
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Objective evaluation across the six structural pillars of co-founder relationships.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.dimensions.map((dim: DimensionScore) => (
              <div
                key={dim.key}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm transition-colors hover:border-slate-700/80"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-200">
                      {dim.label}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        dim.level === "Critical"
                          ? "bg-red-500/15 text-red-400"
                          : dim.level === "High"
                            ? "bg-amber-500/15 text-amber-400"
                            : dim.level === "Moderate"
                              ? "bg-sky-500/15 text-sky-400"
                              : "bg-cyan-500/15 text-cyan-400"
                      }`}
                    >
                      {dim.score}% · {dim.level}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-300">
                    {dim.finding}
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-800/80 pt-3">
                  <p className="text-[11px] leading-relaxed text-cyan-300/80">
                    <span className="font-semibold text-cyan-200">Remedy:</span> {dim.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 3. Differentiated Strategic Risk Intelligence */}
      {ai ? (
        <div className="mt-12 space-y-8">
          {/* A. Interconnected Risks */}
          {ai.interconnectedRisks && ai.interconnectedRisks.length > 0 ? (
            <div>
              <div className="mb-4">
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                  Systemic Dynamics
                </span>
                <h3 className="mt-1 text-xl font-semibold text-slate-100">
                  Interconnected & Compound Hazards
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  How individual operational choices interact to create systemic failure points.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {ai.interconnectedRisks.map((risk, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-5 shadow-[0_0_24px_rgba(99,102,241,0.06)] backdrop-blur-md"
                  >
                    <h4 className="font-semibold text-indigo-200">
                      {risk.title}
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {risk.impact}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {risk.factors.map((f, fi) => (
                        <span
                          key={fi}
                          className="rounded-md border border-indigo-400/20 bg-indigo-950/60 px-2 py-0.5 text-[10px] font-medium text-indigo-300"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* B. Contradictions & Mismatched Expectations */}
          {ai.contradictions && ai.contradictions.length > 0 ? (
            <div>
              <div className="mb-4">
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  Alignment Audit
                </span>
                <h3 className="mt-1 text-xl font-semibold text-slate-100">
                  Contradictions & Mismatched Expectations
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Discrepancies identified between partnership assumptions and operational realities.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {ai.contradictions.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-amber-500/20 bg-slate-900/60 p-5 backdrop-blur-md"
                  >
                    <h4 className="font-semibold text-amber-200">
                      {item.detectedMismatch}
                    </h4>
                    <p className="mt-2 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Evidence:</span> {item.evidence}
                    </p>
                    <p className="mt-2 border-t border-slate-800/80 pt-2 text-xs text-amber-300/80">
                      <span className="font-semibold text-amber-200">Downstream Impact:</span> {item.implication}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* C. Overlooked Structural Weaknesses */}
          {ai.overlookedWeaknesses && ai.overlookedWeaknesses.length > 0 ? (
            <div>
              <div className="mb-4">
                <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300">
                  Legal & Structural Exposure
                </span>
                <h3 className="mt-1 text-xl font-semibold text-slate-100">
                  Overlooked Structural Blindspots
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Essential corporate protections and clauses missing from current arrangements.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ai.overlookedWeaknesses.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-200">
                        {item.weakness}
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">
                        {item.whyItMatters}
                      </p>
                    </div>
                    <div className="mt-4 border-t border-slate-800/80 pt-3">
                      <p className="text-[11px] text-cyan-300">
                        <span className="font-semibold text-cyan-200">Remediation:</span> {item.actionToAddress}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* D. Risk Prioritization Action Plan */}
          {ai.prioritizedActions ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md sm:p-8">
              <h3 className="text-xl font-semibold text-slate-100">
                Action Plan & Risk Prioritization
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Sequenced roadmap to address identified vulnerabilities before executing binding documents.
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Immediate (Resolve This Week)
                  </h4>
                  <ul className="mt-3 space-y-2 text-xs text-slate-300">
                    {ai.prioritizedActions.immediate.map((act, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 text-red-400">•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Before Signing Cap Table
                  </h4>
                  <ul className="mt-3 space-y-2 text-xs text-slate-300">
                    {ai.prioritizedActions.beforeSigning.map((act, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 text-amber-400">•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    Long-Term Monitoring
                  </h4>
                  <ul className="mt-3 space-y-2 text-xs text-slate-300">
                    {ai.prioritizedActions.longTermMonitoring.map((act, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 text-cyan-400">•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-slate-500" />
                    Areas Requiring Clarification
                  </h4>
                  <ul className="mt-3 space-y-2 text-xs text-slate-300">
                    {ai.prioritizedActions.needsClarification.map((act, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 text-slate-400">•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          {/* E. Hard-Hitting Discussion Questions */}
          {ai.discussionQuestions && ai.discussionQuestions.length > 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md sm:p-8">
              <h3 className="text-xl font-semibold text-slate-100">
                Courageous Co-Founder Questions
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Ask these direct questions across the table before signing your shareholder agreement.
              </p>
              <div className="mt-4 space-y-3">
                {ai.discussionQuestions.map((q, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-xs font-medium text-slate-200 sm:text-sm"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-400">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 4. Matched Failure Patterns */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold text-slate-100">
          Matched Failure Patterns
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Real-world post-mortems correlating with your partnership profile.
        </p>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {result.patterns.map((pattern) => (
            <div
              key={pattern.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-200">
                    {pattern.title}
                  </h4>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                    {pattern.tag}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-cyan-300/80">
                  {pattern.stat}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {pattern.story}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Custom Conversation Script */}
      <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-100">
              Co-Founder Alignment Script
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Tailored, non-confrontational phrasing to reopen high-stakes topics constructively.
            </p>
          </div>
          <button
            onClick={handleCopy}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
          >
            {copied ? (
              <>
                <CheckIcon className="h-3.5 w-3.5 text-cyan-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon className="h-3.5 w-3.5" />
                <span>Copy Script</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap sm:text-sm">
          {result.script}
        </div>
      </div>

      {/* 6. Legal & Advisory Disclaimer */}
      <div className="mt-8 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-[11px] leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-400">Legal & Advisory Notice:</span> Blindspot is an informational and diagnostic risk assessment tool, not a law firm or investment advisor. The insights, patterns, and discussion points generated herein do not constitute formal legal, corporate, or financial counsel. Consult licensed startup legal counsel prior to executing binding agreements.
      </div>

      {/* 7. Email Capture / Agreement Review Form (Formspree) */}
      <div className="mt-10 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-6 backdrop-blur-md sm:p-8">
        <h4 className="text-base font-semibold text-slate-200">
          Want our team to review your draft agreement? Enter your email for early access.
        </h4>

        {leadState === "sent" ? (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400">
            Request received! We&apos;ll reach out to review your draft agreement shortly.
          </div>
        ) : (
          <form
            onSubmit={handleSubmitLead}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="you@startup.com"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-cyan-500/50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Request review"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
