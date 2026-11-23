export type EquitySplit = "50-50" | "60-40" | "70-30" | "custom";
export type VestingSchedule = "none" | "standard" | "custom";

export type ContributionBalance =
  | "balanced"
  | "idea-vs-execution"
  | "capital-vs-labor"
  | "experience-gap";

export type CommitmentLevel =
  | "both-full-time"
  | "one-part-time"
  | "milestone-transition"
  | "unclear";

export type DecisionProtocol =
  | "clear-ceo"
  | "consensus-only"
  | "formal-tiebreaker"
  | "undecided";

export type SalaryExpectation =
  | "both-unpaid"
  | "immediate-salary-needed"
  | "deferred-compensation"
  | "different-runways";

export type WorkingHistory =
  | "shipped-together"
  | "new-collaborators"
  | "past-tensions"
  | "untested";

export type DepartureTerms =
  | "market-standard"
  | "vesting-only"
  | "no-formal-terms"
  | "in-discussion";

export type DiagnosticInputs = {
  equitySplit: EquitySplit;
  vesting: VestingSchedule;
  runwayMonths: number;
  primaryConcern: string;
  contributionBalance?: ContributionBalance;
  commitmentLevel?: CommitmentLevel;
  decisionProtocol?: DecisionProtocol;
  salaryExpectation?: SalaryExpectation;
  workingHistory?: WorkingHistory;
  departureTerms?: DepartureTerms;
  customSplitText?: string;
};

export type RiskLevel = "Elevated" | "Moderate" | "High" | "Critical";

export type DimensionKey =
  | "equityFairness"
  | "commitment"
  | "governance"
  | "financialPressure"
  | "trust"
  | "departureProtection";

export type DimensionScore = {
  key: DimensionKey;
  label: string;
  score: number;
  level: RiskLevel;
  finding: string;
  recommendation: string;
};

export type InterconnectedRisk = {
  title: string;
  impact: string;
  factors: string[];
};

export type ContradictionItem = {
  detectedMismatch: string;
  evidence: string;
  implication: string;
};

export type OverlookedWeakness = {
  weakness: string;
  whyItMatters: string;
  actionToAddress: string;
};

export type PrioritizedActions = {
  immediate: string[];
  beforeSigning: string[];
  longTermMonitoring: string[];
  needsClarification: string[];
};

export type DiagnosticEvidenceField = keyof DiagnosticInputs;

export type AnalysisEvidence = {
  field: DiagnosticEvidenceField;
  label: string;
  answer: string;
};

export type FindingKind =
  | "risk"
  | "contradiction"
  | "missing_agreement"
  | "unverified_assumption";

export type RiskSeverity = "high" | "moderate" | "low";
export type RiskLikelihood = "high" | "moderate" | "low" | "uncertain";
export type RiskPriority = "immediate" | "before_signing" | "monitor";

export type RiskFinding = {
  id: string;
  kind: FindingKind;
  title: string;
  severity: RiskSeverity;
  likelihood: RiskLikelihood;
  priority: RiskPriority;
  priorityRationale: string;
  evidence: AnalysisEvidence[];
  inference: string;
  consequence: string;
  recommendation: string;
  confirmationNeeded: string[];
};

export type RiskInterconnection = {
  title: string;
  findingIds: string[];
  mechanism: string;
};

export type AnswerConflict = {
  findingId: string;
  mismatch: string;
};

export type AnalysisAction = {
  findingIds: string[];
  action: string;
};

export type AnalysisActionPlan = {
  immediate: AnalysisAction[];
  beforeSigning: AnalysisAction[];
  monitoring: AnalysisAction[];
};

export type AIAnalysisResult = {
  isAIGenerated: boolean;
  modelUsed?: string;
  executiveSummary?: string;
  executiveVerdict?: string;
  findings?: RiskFinding[];
  topPriorityFindingId?: string;
  topPriorityRationale?: string;
  interconnections?: RiskInterconnection[];
  answerConflicts?: AnswerConflict[];
  actionPlan?: AnalysisActionPlan;
  additionalUnknowns?: string[];
  analysisWarnings?: string[];
  interconnectedRisks?: InterconnectedRisk[];
  contradictions?: ContradictionItem[];
  overlookedWeaknesses?: OverlookedWeakness[];
  prioritizedActions?: PrioritizedActions;
  discussionQuestions?: string[];
  customizedScript?: string;
};

export type FailurePattern = {
  id: string;
  title: string;
  stat: string;
  story: string;
  tag: string;
};

export type DiagnosticResult = {
  score: number;
  level: RiskLevel;
  summary: string;
  patterns: FailurePattern[];
  script: string;
  explanations?: string[];
  dimensions?: DimensionScore[];
  aiAnalysis?: AIAnalysisResult;
  aiStatus?: "available" | "unavailable";
  aiFailure?:
    | "configuration"
    | "rate_limit"
    | "timeout"
    | "api_error"
    | "invalid_response";
  aiFailureMessage?: string;
};
