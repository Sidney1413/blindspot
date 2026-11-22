import type {
  DiagnosticInputs,
  DiagnosticResult,
  EquitySplit,
  FailurePattern,
  RiskLevel,
  VestingSchedule,
} from "./types";

const PATTERNS: Record<string, FailurePattern> = {
  deadlock: {
    id: "deadlock",
    title: "50/50 Deadlock Trap",
    tag: "Governance",
    stat: "In Founder’s Dilemmas research, ~65% of startups face a co-founder conflict — and equal splits without a tie-breaker are the most common freeze point.",
    story:
      "Two technical co-founders of a B2B SaaS company split equity 50/50 with no deadlock clause. Eighteen months in they disagreed on whether to raise or stay bootstrapped. The board could not vote. Payroll slipped two weeks. A term sheet died in diligence when counsel flagged an unresolvable stalemate. The company wound down with a working product and zero proceeds for either founder.",
  },
  noVest: {
    id: "noVest",
    title: "Unvested Walk-Away",
    tag: "Vesting",
    stat: "Market-standard founder grants vest over 4 years with a 1-year cliff. Immediate grants let a departing founder keep 100% of a stake they no longer earn.",
    story:
      "A consumer app’s ‘idea’ co-founder received 40% on day one with no vesting. They left after seven months for a salaried job. The remaining founder kept building for two years, then lost a Series A because the cap table showed a large inactive holder who would not sign a reverse vesting amendment. Investors walked. The operating founder later said the unsigned handshake was the only decision they would undo.",
  },
  resentment: {
    id: "resentment",
    title: "Steep Split Resentment",
    tag: "Contribution",
    stat: "Post-mortems repeatedly show 70/30 (and steeper) splits without a contribution review clause correlate with quiet quitting by the minority founder within 12–18 months.",
    story:
      "A hardware startup granted 70/30 because one founder ‘brought the idea.’ The 30% founder shipped the firmware, ran suppliers, and closed the first five customers. When they asked to rebalance, the majority holder refused. The minority founder disengaged, a key supplier relationship collapsed, and the company missed a CES window it never recovered. The autopsy cited ‘unspoken labor vs. ownership mismatch,’ not the product.",
  },
  runway: {
    id: "runway",
    title: "Personal Runway Collapse",
    tag: "Cash",
    stat: "CB Insights consistently ranks running out of cash among the top failure causes (~29% of post-mortems). Personal runway under 6 months is a leading trigger for panic dilution or a bad 50/50 ‘just sign it’ deal.",
    story:
      "Two co-founders incorporated after one had three months of savings left. They signed a 50/50, no-vesting agreement in a weekend scramble to ‘make it official’ before a friends-and-family round. The cash-short founder took a consulting gig six weeks later. The round never closed. Equity was already locked. The remaining founder could not recapture the idle shares without a lawsuit they could not afford.",
  },
  imbalance: {
    id: "imbalance",
    title: "Silent 60/40 Drift",
    tag: "Roles",
    stat: "60/40 splits often feel ‘fair enough’ at signing, then drift: the 40% partner absorbs ops while the 60% partner keeps narrative control. Role charters are missing in most failed 60/40 cases.",
    story:
      "A marketplace co-founding pair chose 60/40 because one had previously raised a seed. Roles were never written down. Two years later the 40% partner was CEO in practice but not on paper, and could not approve a pivot. The 60% partner blocked the hire of a COO. A bridge round collapsed when the lead asked who actually ran the company and got two different answers.",
  },
  trust: {
    id: "trust",
    title: "Unspoken Concern Becomes the Deal",
    tag: "Alignment",
    stat: "In co-founder breakup interviews, the original ‘gut worry’ at signing — control, money, or commitment — is the same issue named in the post-mortem 70%+ of the time.",
    story:
      "A fintech pair papered a clean-looking split but never put the real fear on the table: one founder did not trust the other to stay after a competing offer. They used optimism as a substitute for vesting, cliff, and a good-leaver clause. The offer arrived in month 11. There was no cliff. There was no conversation script. There was only a cap table that no longer matched who was in the building.",
  },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function riskLevel(score: number): RiskLevel {
  if (score >= 80) return "Critical";
  if (score >= 65) return "High";
  if (score >= 48) return "Moderate";
  return "Elevated";
}

function splitWeight(split: EquitySplit) {
  if (split === "50-50") return 18;
  if (split === "70-30") return 16;
  return 11;
}

function vestingWeight(vesting: VestingSchedule) {
  return vesting === "none" ? 28 : 6;
}

function runwayWeight(months: number) {
  if (months <= 2) return 24;
  if (months <= 5) return 18;
  if (months <= 9) return 12;
  if (months <= 14) return 7;
  return 3;
}

function concernWeight(text: string) {
  const t = text.toLowerCase();
  let extra = 0;
  if (/(trust|control|deadlock|lawsuit|quit|leave|walk)/.test(t)) extra += 8;
  if (/(money|runway|salary|broke|cash)/.test(t)) extra += 6;
  if (/(vest|equity|dilut|fair)/.test(t)) extra += 5;
  if (t.trim().length > 80) extra += 2;
  return extra;
}

function pickPatterns(inputs: DiagnosticInputs): FailurePattern[] {
  const ranked: string[] = [];
  if (inputs.vesting === "none") ranked.push("noVest");
  if (inputs.equitySplit === "50-50") ranked.push("deadlock");
  if (inputs.equitySplit === "70-30") ranked.push("resentment");
  if (inputs.runwayMonths < 12) ranked.push("runway");
  if (inputs.equitySplit === "60-40") ranked.push("imbalance");
  ranked.push("trust");

  const unique = [...new Set(ranked)].slice(0, 2);
  return unique.map((id) => PATTERNS[id]);
}

function buildScript(inputs: DiagnosticInputs): string {
  const splitLabel =
    inputs.equitySplit === "50-50"
      ? "50/50"
      : inputs.equitySplit === "60-40"
        ? "60/40"
        : "70/30";
  const vestLine =
    inputs.vesting === "none"
      ? "we currently have no vesting, which means either of us could leave tomorrow and keep a full stake"
      : "even with a standard vest, we should still write down what happens on deadlock, departure, and role drift";
  const runwayLine =
    inputs.runwayMonths < 12
      ? `My personal runway is about ${inputs.runwayMonths} month${inputs.runwayMonths === 1 ? "" : "s"}, so I don’t want us to lock a fragile deal just to feel official.`
      : `We’ve got some personal runway (${inputs.runwayMonths} months on my side), which is exactly when it’s easiest to skip the hard clauses.`;
  const concern = inputs.primaryConcern.trim();
  const concernLine = concern
    ? `The thing I keep coming back to is: "${concern}". I’d rather put that on the table now than discover it in a post-mortem.`
    : "I want us to name the real risks now rather than discover them after we sign.";

  return `I’ve been thinking about how we protect the company — and each other — before we sign.

We’re looking at a ${splitLabel} split, and ${vestLine}. ${runwayLine}

${concernLine}

Can we spend one focused conversation on three things: (1) 4-year vesting with a 1-year cliff if we don’t already have it, (2) a simple deadlock-break (casting vote, independent advisor, or shotgun after a cooling-off period), and (3) a written role charter we can revisit at 12 months? I’m not trying to unwind the partnership. I want the version of this that still works if one of us gets hit by a bus, a competing offer, or a bad quarter.

Happy to draft a one-pager we both mark up.`;
}

function summaryFor(score: number, inputs: DiagnosticInputs): string {
  const split =
    inputs.equitySplit === "50-50"
      ? "equal ownership with no automatic tie-break"
      : inputs.equitySplit === "70-30"
        ? "a steep ownership tilt that can sour as labor diverges"
        : "a 60/40 tilt that often hides role ambiguity";
  const vest =
    inputs.vesting === "none"
      ? "unvested equity — the highest-frequency landmine in founder post-mortems"
      : "vesting in place, but other structural gaps still show up in failed companies";
  return `Your Risk Exposure Index is ${score}. The model weights ${split}, plus ${vest}. Personal runway of ${inputs.runwayMonths} month${inputs.runwayMonths === 1 ? "" : "s"} ${inputs.runwayMonths < 12 ? "increases pressure to sign a fragile deal." : "reduces panic risk but does not erase structural gaps."}`;
}

export function runDiagnostic(inputs: DiagnosticInputs): DiagnosticResult {
  const raw =
    22 +
    splitWeight(inputs.equitySplit) +
    vestingWeight(inputs.vesting) +
    runwayWeight(inputs.runwayMonths) +
    concernWeight(inputs.primaryConcern);
  const score = clamp(Math.round(raw), 34, 94);
  return {
    score,
    level: riskLevel(score),
    summary: summaryFor(score, inputs),
    patterns: pickPatterns(inputs),
    script: buildScript(inputs),
  };
}

export const EQUITY_OPTIONS: { value: EquitySplit; label: string }[] = [
  { value: "50-50", label: "50/50 Equal" },
  { value: "60-40", label: "60/40 Split" },
  { value: "70-30", label: "70/30 Split" },
];

export const VESTING_OPTIONS: { value: VestingSchedule; label: string }[] = [
  { value: "none", label: "No Vesting / Immediate" },
  { value: "standard", label: "4-Year with 1-Year Cliff" },
];