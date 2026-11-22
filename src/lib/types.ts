export type EquitySplit = "50-50" | "60-40" | "70-30";
export type VestingSchedule = "none" | "standard";

export type DiagnosticInputs = {
  equitySplit: EquitySplit;
  vesting: VestingSchedule;
  runwayMonths: number;
  primaryConcern: string;
};

export type RiskLevel = "Elevated" | "Moderate" | "High" | "Critical";

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
};
