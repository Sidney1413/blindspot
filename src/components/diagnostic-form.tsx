"use client";

import { useState } from "react";
import { EQUITY_OPTIONS, VESTING_OPTIONS } from "@/lib/diagnostics";
import type { EquitySplit, VestingSchedule } from "@/lib/types";
import { InfoIcon, SpinnerIcon } from "./icons";

type Props = {
  equitySplit: EquitySplit;
  vesting: VestingSchedule;
  runwayMonths: string;
  primaryConcern: string;
  analyzing: boolean;
  onEquity: (v: EquitySplit) => void;
  onVesting: (v: VestingSchedule) => void;
  onRunway: (v: string) => void;
  onConcern: (v: string) => void;
  onSubmit: () => void;
};

export function DiagnosticForm(props: Props) {
  const [showVestHelp, setShowVestHelp] = useState(false);

  return (
    <section id="diagnostic" className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <div className="glass-card glow-border relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
              Stage 1 · Inputs
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-50">
              Co-founder equity diagnostic
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Tell us the deal you are about to sign. Blindspot will match it
              against failure patterns from real post-mortems.
            </p>
          </div>
        </div>

        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            props.onSubmit();
          }}
        >
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
              <p className="rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-3 text-xs leading-5 text-slate-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                Vesting means founders earn equity over time instead of receiving
                it all on day one. A 4-year schedule with a 1-year cliff is the
                market default: leave in year one and you keep nothing. No
                vesting / immediate lets a departing co-founder walk with a full
                stake.
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

          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium text-slate-200">
              Primary Concern
            </span>
            <textarea
              className="field min-h-[110px] resize-y"
              value={props.primaryConcern}
              onChange={(e) => props.onConcern(e.target.value)}
              placeholder="What are you most worried about before you sign? Deadlock, someone leaving, fairness, cash pressure…"
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={props.analyzing}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_32px_rgba(34,211,238,0.35)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-90"
            >
              {props.analyzing ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Analyzing post-mortems…
                </>
              ) : (
                "Run Blindspot Check"
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
