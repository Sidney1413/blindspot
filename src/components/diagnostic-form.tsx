"use client";

import { useState } from "react";
import {
  COMMITMENT_OPTIONS,
  CONTRIBUTION_OPTIONS,
  DECISION_OPTIONS,
  DEPARTURE_OPTIONS,
  EQUITY_OPTIONS,
  HISTORY_OPTIONS,
  SALARY_OPTIONS,
  VESTING_OPTIONS,
} from "@/lib/diagnostics";
import type {
  CommitmentLevel,
  ContributionBalance,
  DecisionProtocol,
  DepartureTerms,
  EquitySplit,
  SalaryExpectation,
  VestingSchedule,
  WorkingHistory,
} from "@/lib/types";
import { InfoIcon, SpinnerIcon } from "./icons";

type Props = {
  equitySplit: EquitySplit;
  vesting: VestingSchedule;
  runwayMonths: string;
  primaryConcern: string;
  contributionBalance: ContributionBalance;
  commitmentLevel: CommitmentLevel;
  decisionProtocol: DecisionProtocol;
  salaryExpectation: SalaryExpectation;
  workingHistory: WorkingHistory;
  departureTerms: DepartureTerms;
  customSplitText: string;
  analyzing: boolean;
  aiConsent: boolean;
  onEquity: (v: EquitySplit) => void;
  onVesting: (v: VestingSchedule) => void;
  onRunway: (v: string) => void;
  onConcern: (v: string) => void;
  onContribution: (v: ContributionBalance) => void;
  onCommitment: (v: CommitmentLevel) => void;
  onDecision: (v: DecisionProtocol) => void;
  onSalary: (v: SalaryExpectation) => void;
  onHistory: (v: WorkingHistory) => void;
  onDeparture: (v: DepartureTerms) => void;
  onCustomSplit: (v: string) => void;
  onAiConsent: (v: boolean) => void;
  onSubmit: () => void;
};

export function DiagnosticForm(props: Props) {
  const [showVestHelp, setShowVestHelp] = useState(false);
  const [concernError, setConcernError] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!props.primaryConcern.trim()) {
      setConcernError(true);
      return;
    }
    setConcernError(false);
    props.onSubmit();
  }

  return (
    <section id="diagnostic" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <div className="glass-card glow-border relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="mb-8 border-b border-white/10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Stage 1 · Comprehensive Telemetry
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
            Co-Founder Partnership Diagnostic
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Evaluate your founding team across all six critical dimensions: equity fairness, commitment, governance, financial pressure, trust, and departure protection.
          </p>
        </div>

        <form noValidate className="space-y-8" onSubmit={handleSubmit}>
          {/* Section 1: Equity, Workload & Governance */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                1
              </span>
              <h3 className="text-base font-semibold text-slate-200">
                Partnership Structure & Decision Authority
              </h3>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Co-Founder Equity Split
                </span>
                <select
                  className="field"
                  value={props.equitySplit}
                  onChange={(e) => props.onEquity(e.target.value as EquitySplit)}
                >
                  {EQUITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              {props.equitySplit === "custom" ? (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-200">
                    Custom Split Description
                  </span>
                  <input
                    type="text"
                    className="field"
                    placeholder="e.g. 45/45/10 with an unallocated option pool"
                    maxLength={100}
                    value={props.customSplitText}
                    onChange={(e) => props.onCustomSplit(e.target.value)}
                  />
                </label>
              ) : (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-200">
                    Contribution & Workload Balance
                  </span>
                  <select
                    className="field"
                    value={props.contributionBalance}
                    onChange={(e) =>
                      props.onContribution(e.target.value as ContributionBalance)
                    }
                  >
                    {CONTRIBUTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Time Commitment & Dedication
                </span>
                <select
                  className="field"
                  value={props.commitmentLevel}
                  onChange={(e) =>
                    props.onCommitment(e.target.value as CommitmentLevel)
                  }
                >
                  {COMMITMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Governance & Deadlock Protocol
                </span>
                <select
                  className="field"
                  value={props.decisionProtocol}
                  onChange={(e) =>
                    props.onDecision(e.target.value as DecisionProtocol)
                  }
                >
                  {DECISION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Section 2: Protection, Finances & Relationship Dynamic */}
          <div className="border-t border-white/10 pt-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                2
              </span>
              <h3 className="text-base font-semibold text-slate-200">
                Finances, Protection & Alignment
              </h3>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  Vesting Schedule
                  <button
                    type="button"
                    className="text-cyan-300/80 transition hover:text-cyan-200"
                    aria-label="What is vesting?"
                    aria-expanded={showVestHelp}
                    onClick={() => setShowVestHelp((open) => !open)}
                  >
                    <InfoIcon className="h-4 w-4" />
                  </button>
                </span>
                {showVestHelp ? (
                  <p className="rounded-2xl border border-cyan-400/20 bg-slate-950/90 p-3 text-xs leading-5 text-slate-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                    Vesting protects the venture: founders earn equity over 4 years with a 1-year cliff. Leaving in year one forfeits unearned shares. Immediate grants allow a departing co-founder to walk away with full equity.
                  </p>
                ) : null}
                <select
                  className="field"
                  value={props.vesting}
                  onChange={(e) =>
                    props.onVesting(e.target.value as VestingSchedule)
                  }
                >
                  {VESTING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Departure Terms & IP Protection
                </span>
                <select
                  className="field"
                  value={props.departureTerms}
                  onChange={(e) =>
                    props.onDeparture(e.target.value as DepartureTerms)
                  }
                >
                  {DEPARTURE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Personal Financial Runway in Months
                </span>
                <input
                  className="field"
                  type="number"
                  min={0}
                  max={120}
                  inputMode="numeric"
                  required
                  value={props.runwayMonths}
                  onChange={(e) => props.onRunway(e.target.value)}
                  placeholder="e.g. 6"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Salary & Compensation Expectations
                </span>
                <select
                  className="field"
                  value={props.salaryExpectation}
                  onChange={(e) =>
                    props.onSalary(e.target.value as SalaryExpectation)
                  }
                >
                  {SALARY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">
                  Working History & Collaboration Dynamic
                </span>
                <select
                  className="field"
                  value={props.workingHistory}
                  onChange={(e) =>
                    props.onHistory(e.target.value as WorkingHistory)
                  }
                >
                  {HISTORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">
                  Primary Qualitative Concern <span className="text-rose-400">*</span>
                </span>
                <textarea
                  required
                  maxLength={1000}
                  aria-invalid={concernError}
                  className={`field min-h-[110px] resize-y ${
                    concernError ? "border-rose-500/80 focus:border-rose-400" : ""
                  }`}
                  value={props.primaryConcern}
                  onChange={(e) => {
                    if (concernError) {
                      setConcernError(false);
                    }
                    props.onConcern(e.target.value);
                  }}
                  placeholder="What are you most worried about before you sign? Deadlock, someone leaving, asymmetric effort, cash pressure, intellectual property..."
                />
                {concernError ? (
                  <p className="text-xs font-medium text-rose-400">
                    Please describe your primary concern before running your Blindspot check.
                  </p>
                ) : null}
              </label>
            </div>
          </div>

          {/* Privacy & Legal Consent Notice */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-xs leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-300">Privacy & Diagnostic Notice:</span>{" "}
            Diagnostic answers are processed through Blindspot&apos;s deterministic scoring engine first.
            Google Gemini is only used if you explicitly consent below. When enabled, your submitted
            founder answers are sent to Google&apos;s Gemini API for contextual analysis and are not sent
            to the Gemini service otherwise. No passwords, credentials, or bank account numbers are collected.
            Blindspot provides educational diagnostic assessments and is not a substitute for licensed legal,
            tax, or financial advice.
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm leading-6 text-slate-300">
            <input
              type="checkbox"
              checked={props.aiConsent}
              onChange={(e) => props.onAiConsent(e.target.checked)}
              className="mt-1 h-4 w-4 accent-cyan-400"
            />
            <span>
              <span className="font-semibold text-slate-200">Optional: send my answers to Gemini for AI analysis.</span>{" "}
              This sends the founder form responses described above to Google Gemini; leave unchecked to run only the local deterministic engine.
            </span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={props.analyzing}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 px-6 py-4 text-sm font-semibold text-slate-950 shadow-[0_0_32px_rgba(34,211,238,0.35)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-90"
            >
              {props.analyzing ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Running Comprehensive Diagnostic & AI Analysis…
                </>
              ) : (
                "Run Blindspot Diagnostic"
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
