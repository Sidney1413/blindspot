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

function isValidRunway(value: string) {
  const months = Number.parseInt(value, 10);
  return !Number.isNaN(months) && months >= 0 && months <= 120;
}

type Props = {
  stage: "form" | "loading" | "results";
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
  submissionError: string | null;
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
  onSubmit: () => void;
};

export function DiagnosticForm(props: Props) {
  const [showVestHelp, setShowVestHelp] = useState(false);
  const [concernError, setConcernError] = useState(false);
  const [runwayError, setRunwayError] = useState(false);

  function validateAndSubmit() {
    const invalidConcern =
      !props.primaryConcern.trim() || props.primaryConcern.trim().length > 1000;
    const invalidRunway = !isValidRunway(props.runwayMonths);
    setConcernError(invalidConcern);
    setRunwayError(invalidRunway);
    if (invalidConcern || invalidRunway) {
      return;
    }
    props.onSubmit();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    validateAndSubmit();
  }

  return (
    <>
      <section
        id="diagnostic"
        className={
          props.stage === "form"
            ? "mx-auto max-w-6xl px-4 pb-10 sm:px-6"
            : "hidden"
        }
      >
        {props.submissionError ? (
          <p
            className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {props.submissionError}
          </p>
        ) : null}
        <div className="glass-card glow-border relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <form noValidate className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-sage-soft text-xs font-semibold text-brand-forest-strong">
                1
              </span>
              <h2 className="text-base font-semibold text-brand-forest">
                Ownership &amp; commitment
              </h2>
            </div>

            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-200">
                  How will you split ownership?
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
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-200">
                    Describe your ownership split
                  </span>
                  <input
                    type="text"
                    className="field"
                    placeholder="e.g. 45/45, with 10% set aside for future hires"
                    maxLength={100}
                    value={props.customSplitText}
                    onChange={(e) => props.onCustomSplit(e.target.value)}
                  />
                </label>
              ) : (
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-200">
                    How does your work compare?
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

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-200">
                  How much time can each person commit?
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

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-200">
                  How will you make important decisions?
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

          <div className="border-t border-brand-line pt-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-sage-soft text-xs font-semibold text-brand-forest-strong">
                2
              </span>
              <h2 className="text-base font-semibold text-brand-forest">
                Money &amp; agreements
              </h2>
            </div>

            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  Vesting Schedule
                  <button
                    type="button"
                    className="text-brand-sage-deep transition hover:text-brand-forest"
                    aria-label="What is vesting?"
                    aria-expanded={showVestHelp}
                    onClick={() => setShowVestHelp((open) => !open)}
                  >
                    <InfoIcon className="h-4 w-4" />
                  </button>
                </span>
                {showVestHelp ? (
                  <p className="rounded-2xl border border-brand-line bg-brand-surface p-3 text-xs leading-5 text-slate-300 shadow-[0_8px_24px_rgba(25,61,46,0.08)]">
                    A share-earning plan lets founders earn shares over time. For example, a four-year plan may wait one year before any shares are earned; that wait is called a “cliff.” Shares assigned right away may not depend on how long a founder stays. The written agreement sets the actual rules.
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

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-200">
                  What have you agreed if someone leaves or work is created?
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

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-200">
                  How many months can you cover your personal expenses with your savings?
                </span>
                <input
                  className="field"
                  type="number"
                  min={0}
                  max={120}
                  inputMode="numeric"
                  required
                  aria-invalid={runwayError}
                  aria-describedby={runwayError ? "runway-error" : undefined}
                  value={props.runwayMonths}
                  onChange={(e) => {
                    const value = e.target.value;
                    props.onRunway(value);
                    if (runwayError && isValidRunway(value)) {
                      setRunwayError(false);
                    }
                  }}
                  placeholder="e.g. 6"
                />
                {runwayError ? (
                  <p id="runway-error" className="text-xs font-medium text-rose-800">
                    Enter a value from 0 to 120 months.
                  </p>
                ) : null}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-200">
                  What do you expect about pay?
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

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">
                  How well have you worked together?
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

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">
                  What worries you most before you sign?{" "}
                  <span className="text-rose-800">*</span>
                </span>
                <textarea
                  required
                  maxLength={1000}
                  aria-invalid={concernError}
                  className={`field min-h-[110px] resize-y ${
                    concernError ? "border-rose-600/80 focus:border-rose-700" : ""
                  }`}
                  value={props.primaryConcern}
                  onChange={(e) => {
                    if (concernError) {
                      setConcernError(false);
                    }
                    props.onConcern(e.target.value);
                  }}
                  placeholder="For example: how you'll make decisions, differences in work hours, personal money, or who owns the product and code."
                />
                {concernError ? (
                  <p className="text-xs font-medium text-rose-800">
                    Please tell us what worries you most before continuing.
                  </p>
                ) : null}
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={validateAndSubmit}
              disabled={props.analyzing}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-brand-forest-strong px-6 py-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(32,75,55,0.14)] transition-colors hover:bg-brand-forest-deep disabled:cursor-not-allowed disabled:opacity-70"
            >
              {props.analyzing ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Reviewing your answers…
                </>
              ) : (
                "Run Blindspot Diagnostic"
              )}
            </button>
          </div>
          </form>
        </div>
      </section>
    </>
  );
}
