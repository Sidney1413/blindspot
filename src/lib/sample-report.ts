import { runDiagnostic } from "@/lib/diagnostics";
import type { DiagnosticInputs, DiagnosticResult } from "@/lib/types";

const SAMPLE_INPUTS: DiagnosticInputs = {
  equitySplit: "50-50",
  vesting: "standard",
  runwayMonths: 4,
  primaryConcern:
    "I am worried we will get stuck on product decisions, someone may leave while working part-time, and we have not agreed on pay.",
  contributionBalance: "capital-vs-labor",
  commitmentLevel: "one-part-time",
  decisionProtocol: "consensus-only",
  salaryExpectation: "different-runways",
  workingHistory: "past-tensions",
  departureTerms: "no-formal-terms",
};

export const SAMPLE_REPORT_CONTENT = {
  signals: [
    "One founder works part-time.",
    "Ownership is split equally.",
    "One founder reports savings for about four months.",
  ],
  risks: [
    {
      title: "No agreed way to resolve major disagreements",
      whyItMatters:
        "A past disagreement delayed a customer trial, and both founders must approve major decisions.",
      action:
        "Agree which decisions either founder can make and how to break a tie.",
    },
    {
      title: "Different financial pressure between founders",
      whyItMatters:
        "Your reported savings differ, and you have not agreed how to treat the $25,000 founder contribution or when pay can begin.",
      action:
        "Write down whether the $25,000 will be repaid and when pay can start.",
    },
  ],
  guide: {
    opening:
      "Before we sign, I want to make sure we agree on decisions, work, and money.",
    questions: [
      "How will we resolve major disagreements?",
      "What weekly commitment are we each making?",
      "How will we handle founder contributions and pay?",
    ],
    closing:
      "Write down what you agree on, who will prepare it, and by when.",
  },
} as const;

export function createSampleDiagnosticResult(): DiagnosticResult {
  const result = runDiagnostic(SAMPLE_INPUTS);
  const { opening, questions, closing } = SAMPLE_REPORT_CONTENT.guide;
  result.script = [
    `Opening: ${opening}`,
    "",
    "Questions:",
    ...questions.map((question, index) => `${index + 1}. ${question}`),
    "",
    closing,
  ].join("\n");
  return result;
}
