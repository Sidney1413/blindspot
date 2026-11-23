import type { AIAnalysisResult, RiskFinding } from "@/lib/types";

interface AdaptiveAnalysisReportProps {
  analysis: AIAnalysisResult;
}

const severityLabels = {
  high: "High severity",
  moderate: "Moderate severity",
  low: "Low severity",
} as const;

const severityStyles = {
  high: "border-red-300 bg-red-50 text-red-900",
  moderate: "border-amber-300 bg-amber-50 text-amber-950",
  low: "border-brand-sage/50 bg-brand-sage-soft text-brand-forest-strong",
} as const;

const priorityLabels = {
  immediate: "Start now",
  before_signing: "Before signing",
  monitor: "Monitor",
} as const;

const priorityStyles = {
  immediate: "border-red-200 bg-red-50 text-red-900",
  before_signing: "border-amber-200 bg-amber-50 text-amber-950",
  monitor: "border-brand-line bg-brand-cream-muted text-brand-muted",
} as const;

const priorityRank: Record<RiskFinding["priority"], number> = {
  immediate: 0,
  before_signing: 1,
  monitor: 2,
};

const severityRank: Record<RiskFinding["severity"], number> = {
  high: 0,
  moderate: 1,
  low: 2,
};

const likelihoodRank: Record<RiskFinding["likelihood"], number> = {
  high: 0,
  moderate: 1,
  low: 2,
  uncertain: 3,
};

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function AdaptiveAnalysisReport({
  analysis,
}: AdaptiveAnalysisReportProps) {
  const findings = analysis.findings ?? [];
  const orderedFindings = [...findings].sort(
    (left, right) =>
      priorityRank[left.priority] - priorityRank[right.priority] ||
      severityRank[left.severity] - severityRank[right.severity] ||
      likelihoodRank[left.likelihood] - likelihoodRank[right.likelihood],
  );
  const findingIds = new Set(findings.map((finding) => finding.id));
  const connections = (analysis.interconnections ?? []).filter((connection) => {
    const referencedFindings = new Set(
      connection.findingIds.filter((id) => findingIds.has(id)),
    );
    return (
      referencedFindings.size > 1 &&
      connection.title.trim().length > 0 &&
      connection.mechanism.trim().length > 0
    );
  });

  const recommendationTexts = new Set(
    findings.map((finding) => normalizeText(finding.recommendation)),
  );
  const actionCandidates = [
    ...(analysis.actionPlan?.immediate ?? []).map((action) => ({
      ...action,
      timing: "immediate" as const,
    })),
    ...(analysis.actionPlan?.beforeSigning ?? []).map((action) => ({
      ...action,
      timing: "before_signing" as const,
    })),
    ...(analysis.actionPlan?.monitoring ?? []).map((action) => ({
      ...action,
      timing: "monitor" as const,
    })),
  ];
  const seenActions = new Set<string>();
  const actions = actionCandidates
    .filter((item) => {
      const normalized = normalizeText(item.action);
      if (
        !normalized ||
        !item.findingIds.some((id) => findingIds.has(id)) ||
        recommendationTexts.has(normalized) ||
        seenActions.has(normalized)
      ) {
        return false;
      }
      seenActions.add(normalized);
      return true;
    })
    .slice(0, 5);

  const seenQuestions = new Set<string>();
  const questions = [
    ...(analysis.discussionQuestions ?? []),
    ...orderedFindings.flatMap((finding) => finding.confirmationNeeded),
    ...(analysis.additionalUnknowns ?? []),
  ]
    .map((question) => question.trim().replace(/\s+/g, " "))
    .filter((question) => {
      const normalized = normalizeText(question);
      if (!normalized || seenQuestions.has(normalized)) return false;
      seenQuestions.add(normalized);
      return true;
    })
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <section aria-labelledby="biggest-risks">
        <h2
          id="biggest-risks"
          className="text-xl font-semibold text-brand-forest sm:text-2xl"
        >
          Your biggest risks
        </h2>
        {findings.length > 0 ? (
          <ol className="mt-4 space-y-4">
            {orderedFindings.map((finding, index) => {
              const evidenceItems = finding.evidence.filter((evidence) =>
                evidence.answer.trim(),
              );
              const explanation = [finding.inference, finding.consequence]
                .map((part) => part.trim())
                .filter(Boolean)
                .join(" ");
              const recommendation = finding.recommendation.trim();

              return (
                <li key={finding.id}>
                  <article className="rounded-2xl border border-brand-line bg-brand-surface p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-sage-soft text-xs font-semibold text-brand-forest-strong">
                        {index + 1}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityStyles[finding.severity]}`}
                      >
                        {severityLabels[finding.severity]}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityStyles[finding.priority]}`}
                      >
                        {finding.priority === "monitor"
                          ? "Monitor over time"
                          : priorityLabels[finding.priority]}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold leading-6 text-brand-forest">
                      {finding.title}
                    </h3>

                    {evidenceItems.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {evidenceItems.map((evidence, evidenceIndex) => (
                          <li
                            key={`${finding.id}-${evidence.field}-${evidenceIndex}`}
                            className="rounded-xl bg-brand-cream-muted px-3 py-2 text-sm leading-6 text-brand-forest"
                          >
                            <span className="font-semibold">
                              {evidence.label}:
                            </span>{" "}
                            <span className="whitespace-pre-wrap">
                              {evidence.answer}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {explanation ? (
                      <p className="mt-3 text-sm leading-6 text-brand-muted">
                        {explanation}
                      </p>
                    ) : null}

                    {recommendation ? (
                      <p className="mt-3 border-t border-brand-line pt-3 text-sm leading-6 text-brand-forest-strong">
                        <span className="font-semibold">
                          Practical next step:{" "}
                        </span>
                        {recommendation}
                      </p>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-3 rounded-xl border border-brand-line bg-brand-surface p-4 text-sm leading-6 text-brand-muted">
            This review did not identify specific risks in the answers. That
            does not guarantee the partnership has no risks.
          </p>
        )}
      </section>

      {connections.length > 0 ? (
        <section aria-labelledby="risk-connections">
          <h2
            id="risk-connections"
            className="text-xl font-semibold text-brand-forest sm:text-2xl"
          >
            How the risks connect
          </h2>
          <div className="mt-4 space-y-3">
            {connections.map((connection, index) => (
              <article
                key={`${connection.title}-${index}`}
                className="rounded-2xl border border-brand-sage/40 bg-brand-sage-soft/60 p-4 sm:p-5"
              >
                <h3 className="font-semibold text-brand-forest">
                  {connection.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  {connection.mechanism}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {actions.length > 0 ? (
        <section aria-labelledby="next-actions">
          <h2
            id="next-actions"
            className="text-xl font-semibold text-brand-forest sm:text-2xl"
          >
            What to do next
          </h2>
          <ol className="mt-3 space-y-2">
            {actions.map((item, index) => (
              <li
                key={`${item.action}-${index}`}
                className="flex items-start gap-3 rounded-xl border border-brand-line bg-brand-surface p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-sage-soft text-xs font-semibold text-brand-forest-strong">
                  {index + 1}
                </span>
                <div>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityStyles[item.timing]}`}
                  >
                    {priorityLabels[item.timing]}
                  </span>
                  <p className="mt-2 text-sm leading-6 text-brand-forest">
                    {item.action.trim()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {questions.length > 0 ? (
        <section aria-labelledby="discuss-together">
          <h2
            id="discuss-together"
            className="text-xl font-semibold text-brand-forest sm:text-2xl"
          >
            Discuss together
          </h2>
          <ol className="mt-3 space-y-2">
            {questions.map((question, index) => (
              <li
                key={`${index}-${question}`}
                className="flex items-start gap-3 rounded-xl border border-brand-line bg-brand-surface p-4 text-sm leading-6 text-brand-forest"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-sage-soft text-xs font-semibold text-brand-forest-strong">
                  {index + 1}
                </span>
                {question}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
