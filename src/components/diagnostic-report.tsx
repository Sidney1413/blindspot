import type { DiagnosticResult, RiskLevel } from "@/lib/types";
import { AdaptiveAnalysisReport } from "./adaptive-analysis-report";

interface DiagnosticReportProps {
  result: DiagnosticResult;
  onEdit: () => void;
}

const riskStyles: Record<RiskLevel, string> = {
  Elevated: "border-brand-sage/50 bg-brand-sage-soft text-brand-forest-strong",
  Moderate: "border-amber-300 bg-amber-50 text-amber-950",
  High: "border-orange-300 bg-orange-50 text-orange-950",
  Critical: "border-red-300 bg-red-50 text-red-900",
};

const scoreBarStyles: Record<RiskLevel, string> = {
  Elevated: "bg-brand-sage-deep",
  Moderate: "bg-amber-500",
  High: "bg-orange-600",
  Critical: "bg-red-700",
};

export function DiagnosticReport({ result, onEdit }: DiagnosticReportProps) {
  const analysis =
    result.aiStatus === "available" && result.aiAnalysis?.isAIGenerated
      ? result.aiAnalysis
      : null;

  return (
    <section
      aria-labelledby="report-title"
      className="mx-auto max-w-4xl px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12"
    >
      <header className="rounded-3xl border border-brand-line bg-brand-surface p-6 shadow-[0_16px_48px_rgba(25,61,46,0.06)] sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-sage-deep">
          Blindspot diagnostic
        </p>
        <h1
          id="report-title"
          className="mt-2 font-serif text-3xl tracking-tight text-brand-forest sm:text-4xl"
        >
          Overall result
        </h1>

        <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
          <p
            className="font-serif text-6xl leading-none tracking-tight text-brand-forest sm:text-7xl"
            aria-label={`Risk score: ${result.score} out of 100`}
          >
            {result.score}
            <span className="ml-1 text-2xl text-brand-muted sm:text-3xl">
              /100
            </span>
          </p>
          <span
            className={`mb-1 rounded-full border px-3 py-1.5 text-sm font-semibold ${riskStyles[result.level]}`}
          >
            {result.level} risk
          </span>
        </div>

        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-brand-cream-muted"
          role="meter"
          aria-label="Risk score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={result.score}
        >
          <div
            className={`h-full rounded-full transition-[width] ${scoreBarStyles[result.level]}`}
            style={{ width: `${Math.min(100, Math.max(0, result.score))}%` }}
          />
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-brand-muted sm:text-base">
          Your score reflects the partnership risks surfaced by your answers,
          not the probability that your business will fail.
        </p>

        <button
          type="button"
          onClick={onEdit}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-brand-forest/20 px-5 py-2.5 text-sm font-semibold text-brand-forest transition-colors hover:bg-brand-cream-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sage-deep"
        >
          Edit answers
        </button>
      </header>

      {analysis ? (
        <div className="mt-8">
          <AdaptiveAnalysisReport analysis={analysis} />
        </div>
      ) : null}

      {result.dimensions && result.dimensions.length > 0 ? (
        <details className="mt-8 rounded-2xl border border-brand-line bg-brand-surface px-5 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-brand-forest marker:text-brand-sage-deep">
            View all six partnership areas
          </summary>
          <ul className="mt-4 divide-y divide-brand-line">
            {result.dimensions.map((dimension) => (
              <li
                key={dimension.key}
                className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <h2 className="text-sm font-semibold text-brand-forest">
                  {dimension.label}
                </h2>
                <span
                  className={`inline-flex w-fit shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${riskStyles[dimension.level]}`}
                >
                  {dimension.score}/100 · {dimension.level}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="mt-8 text-xs leading-5 text-brand-muted">
        This assessment is for informational purposes only and is not legal,
        tax, or financial advice.
      </p>
    </section>
  );
}
