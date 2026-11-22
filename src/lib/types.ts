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

export type AIAnalysisResult = {
  isAIGenerated: boolean;
  modelUsed?: string;
  executiveSummary?: string;
  interconnectedRisks: InterconnectedRisk[];
  contradictions: ContradictionItem[];
  overlookedWeaknesses: OverlookedWeakness[];
  prioritizedActions: PrioritizedActions;
  discussionQuestions: string[];
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
};
