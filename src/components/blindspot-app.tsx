"use client";

import { useRef, useState } from "react";
import { runDiagnostic } from "@/lib/diagnostics";
import type {
  AIAnalysisResult,
  CommitmentLevel,
  ContributionBalance,
  DecisionProtocol,
  DepartureTerms,
  DiagnosticInputs,
  DiagnosticResult,
  EquitySplit,
  SalaryExpectation,
  VestingSchedule,
  WorkingHistory,
} from "@/lib/types";
import { DiagnosticForm } from "./diagnostic-form";
import { DiagnosticReport } from "./diagnostic-report";
import { NavBar } from "./nav-bar";

export function BlindspotApp() {
  const [equitySplit, setEquitySplit] = useState<EquitySplit>("50-50");
  const [vesting, setVesting] = useState<VestingSchedule>("none");
  const [runwayMonths, setRunwayMonths] = useState("6");
  const [primaryConcern, setPrimaryConcern] = useState("");
  const [contributionBalance, setContributionBalance] =
    useState<ContributionBalance>("balanced");
  const [commitmentLevel, setCommitmentLevel] =
    useState<CommitmentLevel>("both-full-time");
  const [decisionProtocol, setDecisionProtocol] =
    useState<DecisionProtocol>("consensus-only");
  const [salaryExpectation, setSalaryExpectation] =
    useState<SalaryExpectation>("both-unpaid");
  const [workingHistory, setWorkingHistory] =
    useState<WorkingHistory>("shipped-together");
  const [departureTerms, setDepartureTerms] =
    useState<DepartureTerms>("no-formal-terms");
  const [customSplitText, setCustomSplitText] = useState("");
  const [aiConsent, setAiConsent] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadState, setLeadState] = useState<"idle" | "sent">("idle");
  const reportAnchor = useRef<HTMLDivElement>(null);
  const submissionInProgress = useRef(false);

  async function onSubmit() {
    if (submissionInProgress.current) return;

    const months = Number.parseInt(runwayMonths, 10);
    if (
      Number.isNaN(months) ||
      months < 0 ||
      months > 120 ||
      !primaryConcern.trim() ||
      primaryConcern.trim().length > 1000 ||
      (equitySplit === "custom" && customSplitText.trim().length > 100)
    ) return;

    submissionInProgress.current = true;
    setAnalyzing(true);

    const inputs: DiagnosticInputs = {
      equitySplit,
      vesting,
      runwayMonths: months,
      primaryConcern,
      contributionBalance,
      commitmentLevel,
      decisionProtocol,
      salaryExpectation,
      workingHistory,
      departureTerms,
      customSplitText: equitySplit === "custom" ? customSplitText : undefined,
    };

    // Calculate authoritative deterministic baseline
    const initialResult = runDiagnostic(inputs);

    if (aiConsent) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs,
            aiConsent: true,
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.analysis) {
            const aiData = data.analysis as AIAnalysisResult;
            initialResult.aiAnalysis = aiData;
            if (aiData.customizedScript) {
              initialResult.script = aiData.customizedScript;
            }
          }
        }
      } catch {
        // AI is optional; the deterministic result is always returned.
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    submissionInProgress.current = false;
    setAnalyzing(false);
    setResult(initialResult);
    window.setTimeout(() => {
      reportAnchor.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  return (
    <div id="top" className="relative min-h-full overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.16),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <NavBar />

      <main className="relative">
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
            High-stakes co-founder decisions, stress-tested against failure data
          </p>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight tracking-tight text-slate-50 sm:text-6xl">
            Catch the landmines before you sign.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Blindspot matches your co-founder equity, governance, and financial arrangements against real-world post-mortems and Gemini risk intelligence to reveal what breaks before you commit.
          </p>
        </section>

        <DiagnosticForm
          equitySplit={equitySplit}
          vesting={vesting}
          runwayMonths={runwayMonths}
          primaryConcern={primaryConcern}
          contributionBalance={contributionBalance}
          commitmentLevel={commitmentLevel}
          decisionProtocol={decisionProtocol}
          salaryExpectation={salaryExpectation}
          workingHistory={workingHistory}
          departureTerms={departureTerms}
          customSplitText={customSplitText}
          analyzing={analyzing}
          aiConsent={aiConsent}
          onEquity={setEquitySplit}
          onVesting={setVesting}
          onRunway={setRunwayMonths}
          onConcern={setPrimaryConcern}
          onContribution={setContributionBalance}
          onCommitment={setCommitmentLevel}
          onDecision={setDecisionProtocol}
          onSalary={setSalaryExpectation}
          onHistory={setWorkingHistory}
          onDeparture={setDepartureTerms}
          onCustomSplit={setCustomSplitText}
          onAiConsent={setAiConsent}
          onSubmit={onSubmit}
        />

        <div ref={reportAnchor}>
          {result ? (
            <DiagnosticReport
              result={result}
              leadEmail={leadEmail}
              setLeadEmail={setLeadEmail}
              leadState={leadState}
              onLeadSubmit={() => setLeadState("sent")}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
