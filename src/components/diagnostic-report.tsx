"use client";

import { useState } from "react";
import type { DiagnosticResult } from "@/lib/types";

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

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Exposure Index Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md sm:p-8">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium tracking-wider text-slate-400 uppercase">
            Exposure Index
          </span>
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
          {result.summary}
        </p>
      </div>

      {/* Failure Patterns */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-slate-100">
          Matched Failure Patterns
        </h3>
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

      {/* Conversation Script */}
      <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-100">
              Conversation Script
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Paste this to your co-founder to reopen negotiations constructively.
            </p>
          </div>
          <button
            onClick={handleCopy}
            type="button"
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
          >
            {copied ? "Copied!" : "Copy Script"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
          {result.script}
        </div>
      </div>

      {/* Email Capture / Lead Form */}
      <div className="mt-10 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-6 backdrop-blur-md sm:p-8">
        <h4 className="text-base font-semibold text-slate-200">
          Want our team to review your draft agreement? Enter your email for early access.
        </h4>

        {leadState === "sent" ? (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400">
            Request received! We'll reach out to review your draft agreement shortly.
          </div>
        ) : (
          <form onSubmit={handleSubmitLead} className="mt-4 flex flex-col gap-3 sm:flex-row">
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