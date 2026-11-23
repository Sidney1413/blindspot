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
import { SiteFooter } from "./site-footer";

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

  const [analyzing, setAnalyzing] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [stage, setStage] = useState<"form" | "loading" | "results">("form");
  const reportAnchor = useRef<HTMLDivElement>(null);
  const submissionInProgress = useRef(false);

  function scrollToTop(behavior: "auto" | "smooth") {
    if (behavior === "auto") {
      window.scrollTo(0, 0);
      return;
    }

    try {
      window.scrollTo({ top: 0, behavior });
    } catch {
      window.scrollTo(0, 0);
    }
  }

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
    let initialResult: DiagnosticResult | null = null;
    let timeoutId: number | null = null;
    let apiRequestInitiated = false;

    setSubmissionError(null);
    setResult(null);

    try {
      setAnalyzing(true);
      setStage("loading");
      scrollToTop("auto");

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

      initialResult = runDiagnostic(inputs);
      initialResult.aiStatus = "unavailable";

      const controller =
        typeof AbortController === "undefined" ? null : new AbortController();
      if (controller) {
        timeoutId = window.setTimeout(() => controller.abort(), 25000);
      }

      apiRequestInitiated = true;
      const requestOptions: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs }),
      };
      if (controller) {
        requestOptions.signal = controller.signal;
      }
      const response = await fetch("/api/analyze", {
        ...requestOptions,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.analysis) {
          const aiData = data.analysis as AIAnalysisResult;
          initialResult.aiAnalysis = aiData;
          initialResult.aiStatus = "available";
          if (aiData.customizedScript) {
            initialResult.script = aiData.customizedScript;
          }
        } else {
          const failureData = data as
            | {
                failureKind?: DiagnosticResult["aiFailure"];
                message?: string;
              }
            | null;
          initialResult.aiFailure =
            failureData?.failureKind ?? "api_error";
          initialResult.aiFailureMessage =
            failureData?.message ??
            "The analysis service returned no valid result.";
        }
      } else {
        const data = await response.json().catch(() => null) as
          | {
              failureKind?: DiagnosticResult["aiFailure"];
              message?: string;
            }
          | null;
        initialResult.aiFailure = data?.failureKind ?? "api_error";
        initialResult.aiFailureMessage =
          data?.message ??
          `The analysis request failed with status ${response.status}.`;
      }
    } catch (error) {
      if (initialResult && error instanceof Error && error.name === "AbortError") {
        initialResult.aiFailure = "timeout";
        initialResult.aiFailureMessage = "The analysis request timed out.";
      } else if (initialResult) {
        initialResult.aiFailure = "api_error";
        initialResult.aiFailureMessage = apiRequestInitiated
          ? "The analysis request could not be completed. Check your connection."
          : "The analysis could not be prepared in this browser.";
      } else {
        setSubmissionError(
          "Blindspot could not prepare the analysis. Your answers are still available; please try again.",
        );
      }
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      submissionInProgress.current = false;
      setAnalyzing(false);
    }

    if (initialResult) {
      setResult(initialResult);
      setStage("results");
      scrollToTop("auto");
    } else {
      setResult(null);
      setStage("form");
    }
  }

  function returnToForm() {
    setResult(null);
    setStage("form");
    scrollToTop("smooth");
  }

  return (
    <div
      id="top"
      className="relative min-h-full overflow-x-hidden bg-background text-foreground"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(115,144,118,0.08),transparent_50%)]" />

      <NavBar />

      <main className="relative min-h-[calc(100vh-4rem)]">
        {stage === "form" ? (
          <section className="mx-auto max-w-6xl px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-14">
            <h1 className="max-w-3xl font-serif text-3xl leading-tight tracking-tight text-brand-forest sm:text-4xl">
              Your founder partnership assessment
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-brand-muted">
              Let’s understand how you and your co-founder plan to work together.
            </p>
          </section>
        ) : null}

        <DiagnosticForm
          stage={stage}
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
          submissionError={submissionError}
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
          onSubmit={onSubmit}
        />

        {stage === "loading" ? (
          <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center px-6 py-16">
            <div className="w-full rounded-3xl border border-brand-line bg-brand-surface p-8 text-center shadow-[0_16px_48px_rgba(25,61,46,0.08)] sm:p-12">
              <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-brand-sage/20 border-t-brand-sage" />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-brand-sage-deep">
                Step 2 · Reviewing your answers
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-brand-forest sm:text-3xl">
                Checking the partnership structure
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-brand-muted">
                Calculating your score and asking Groq to review the risks in your answers.
              </p>
            </div>
          </section>
        ) : null}

        {stage === "results" && result ? (
          <div ref={reportAnchor} className="transition-opacity duration-300">
            <DiagnosticReport
              result={result}
              onEdit={returnToForm}
            />
          </div>
        ) : null}
      </main>
      <SiteFooter variant="assessment" />
    </div>
  );
}
