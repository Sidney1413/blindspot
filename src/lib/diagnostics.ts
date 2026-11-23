import type {
  AIAnalysisResult,
  CommitmentLevel,
  ContributionBalance,
  DecisionProtocol,
  DepartureTerms,
  DiagnosticInputs,
  DiagnosticResult,
  DimensionScore,
  EquitySplit,
  FailurePattern,
  RiskLevel,
  SalaryExpectation,
  VestingSchedule,
  WorkingHistory,
} from "./types";

const PATTERNS: Record<string, FailurePattern> = {
  deadlock: {
    id: "deadlock",
    title: "No agreed way to break a tie",
    tag: "Big decisions",
    stat: "If both founders must approve a decision, a disagreement can stop the business from moving forward.",
    story:
      "Example: Two founders own equal shares and both must approve major decisions. They disagree about whether to raise money or keep costs low. With no tie-break rule, neither can move the decision forward.",
  },
  noVest: {
    id: "noVest",
    title: "Shares are given up front",
    tag: "Shares",
    stat: "Without a plan for earning shares over time, a founder may keep all assigned shares after leaving.",
    story:
      "Example: A founder receives all of their shares at the start, then leaves early. The remaining founder continues the work, but the agreement does not say whether any shares can be returned or how the company keeps operating.",
  },
  resentment: {
    id: "resentment",
    title: "Ownership and ongoing work may not match",
    tag: "Work and shares",
    stat: "If one founder does much more of the ongoing work than the ownership split suggests, both founders may see the arrangement as unfair.",
    story:
      "Example: One founder's share is based on the original idea, while the other later handles most of the building and customer work. If they never agree on how to account for those contributions, frustration can grow.",
  },
  runway: {
    id: "runway",
    title: "Personal savings may run short",
    tag: "Personal money",
    stat: "Limited personal savings can put pressure on a founder to earn income or make decisions sooner. This does not tell us how much cash the company has.",
    story:
      "Example: One founder's savings may not cover their expenses for long, while the company has no agreed salary plan. That founder may need paid work before the other does. Personal savings are different from company cash.",
  },
  imbalance: {
    id: "imbalance",
    title: "Roles and decision rights are unclear",
    tag: "Roles",
    stat: "If founders have different ideas about who leads each part of the business, routine choices can turn into repeated disagreements.",
    story:
      "Example: Founders agree on an ownership split but do not write down who decides about product, hiring, or sales. Later, each may believe they have the final say on the same decision.",
  },
  trust: {
    id: "trust",
    title: "Unspoken concerns stay unresolved",
    tag: "Working together",
    stat: "A concern that is not discussed can remain unresolved even after founders sign an agreement.",
    story:
      "Example: One founder worries their partner may leave but never raises the concern. Without an agreed plan for shares and responsibilities if someone departs, that question remains open.",
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
  if (split === "60-40") return 11;
  return 14;
}

function vestingWeight(vesting: VestingSchedule) {
  if (vesting === "none") return 28;
  if (vesting === "standard") return 6;
  return 12;
}

function runwayWeight(months: number) {
  if (months <= 2) return 24;
  if (months <= 5) return 18;
  if (months <= 9) return 12;
  if (months <= 14) return 7;
  return 3;
}

type DomainKey = "governance" | "commitment" | "equity" | "financial";

interface DomainFinding {
  weight: number;
  reason: string;
  classification:
    | "positive"
    | "negated"
    | "uncertainty"
    | "active_risk"
    | "ambiguous";
}

export type ConcernAnalysis = {
  weight: number;
  explanations: string[];
};

export function analyzeConcern(text: string): ConcernAnalysis {
  const t = text.trim();
  if (!t) return { weight: 0, explanations: [] };

  const domainScores: Record<
    DomainKey,
    { weight: number; reasons: DomainFinding[] }
  > = {
    governance: { weight: 0, reasons: [] },
    commitment: { weight: 0, reasons: [] },
    equity: { weight: 0, reasons: [] },
    financial: { weight: 0, reasons: [] },
  };

  const domainCaps: Record<DomainKey, number> = {
    governance: 7,
    commitment: 7,
    equity: 6,
    financial: 6,
  };

  function addDomainFinding(
    domain: DomainKey,
    weight: number,
    reason: string,
    classification: DomainFinding["classification"],
  ) {
    if (weight > domainScores[domain].weight) {
      domainScores[domain].weight = Math.min(domainCaps[domain], weight);
    }
    domainScores[domain].reasons.push({ weight, reason, classification });
  }

  // 1. Cross-clause temporal trust erosion: "used to have trust, but not anymore"
  if (
    /(?:used\s+to\s+have\s+trust|once\s+had\s+trust|previously\s+trusted).*?(?:not\s+anymore|no\s+longer|lost\s+it|broken)/i.test(
      t,
    )
  ) {
    addDomainFinding(
      "commitment",
      7,
      "You said trust has worsened since you began working together (+7)",
      "active_risk",
    );
  } else if (
    /(?:lost\s+trust|don't\s+trust\s+(?:each\s+other|them|him|her)\s+anymore|breach\s+of\s+trust|no\s+trust\s+left)/i.test(
      t,
    )
  ) {
    addDomainFinding(
      "commitment",
      7,
      "You described a serious loss of trust (+7)",
      "active_risk",
    );
  }

  // 2. Double negative dispute: "cannot rule out a future dispute"
  if (
    /(?:cannot|can't)\s+rule\s+out\s+(?:a\s+)?(?:future\s+)?(?:dispute|deadlock|conflict|stalemate)/i.test(
      t,
    )
  ) {
    addDomainFinding(
      "governance",
      4,
      "You said a disagreement may happen (+4)",
      "uncertainty",
    );
  }

  // 3. Epistemic hedge: "I don't think we have a deadlock"
  if (/(?:don't|do\s+not)\s+think\s+we\s+have\s+(?:a\s+)?deadlock/i.test(t)) {
    addDomainFinding(
      "governance",
      3,
      "You are unsure whether you could get stuck on a decision (+3)",
      "uncertainty",
    );
  }

  // 4. Defensive unprompted denial: "There is no evidence that my co-founder plans to leave"
  if (
    /no\s+evidence\s+that.*?(?:plans\s+to\s+leave|will\s+leave|quitting)/i.test(
      t,
    )
  ) {
    addDomainFinding(
      "commitment",
      2,
      "You mentioned there is no evidence that someone plans to leave (+2)",
      "ambiguous",
    );
  }

  // Clause-level analysis: split on sentence breaks and contrastive conjunctions
  const clauses = t
    .split(
      /(?:[.!?;]|\r?\n|(?:,\s*|\s+)(?:but|however|although|yet|though)\b)/i,
    )
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const clause of clauses) {
    // ---- DOMAIN 1: Governance & Deadlock ----
    if (
      /(?:50\/50\s+deadlock|locked\s+in\s+deadlock|unresolvable\s+stalemate|deadlock\s+on|stalemate\s+on|hit\s+a\s+deadlock|deadlock\s+trap)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "governance",
        7,
        "You described a disagreement that has stopped a decision (+7)",
        "active_risk",
      );
    } else if (
      /(?:fighting\s+over\s+control|fight\s+for\s+control|losing\s+control|board\s+control\s+dispute|voting\s+dispute|blocking\s+decisions|refusing\s+to\s+vote)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "governance",
        7,
        "You described a dispute over who controls decisions (+7)",
        "active_risk",
      );
    } else if (
      /(?:cannot\s+agree\s+on\s+who\s+makes\s+the\s+final\s+call|demanding\s+(?:an?\s+)?(?:equal\s+)?board\s+seat|hit\s+a\s+wall\s+on\s+decisions)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "governance",
        6,
        "You cannot agree on who makes the final decision (+6)",
        "active_risk",
      );
    } else if (
      /(?:worried\s+about\s+(?:deadlock|control|disagreements)|wondering\s+how\s+we\s+break\s+ties|what\s+if\s+we\s+disagree|unsure\s+who\s+has\s+(?:the\s+)?final\s+say)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "governance",
        4,
        "You are unsure how you would settle a tie (+4)",
        "uncertainty",
      );
    } else if (
      /(?:need\s+to\s+discuss\s+control|control\s+and\s+equity\s+allocation|governance\s+unfinalized|voting\s+is\s+complicated|philosophical\s+differences\s+on\s+(?:control|governance))/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "governance",
        2,
        "You said decision authority still needs to be discussed (+2)",
        "ambiguous",
      );
    } else if (
      /(?:no\s+risk\s+of\s+deadlock|no\s+deadlock|never\s+had\s+a\s+stalemate|agreed\s+tie-breaker|casting\s+vote\s+in\s+place|clear\s+tie-breaker|without\s+deadlock)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "governance",
        0,
        "You report having a way to resolve decision ties (+0)",
        "negated",
      );
    } else if (
      /(?:aligned\s+on\s+decisions|clear\s+division\s+of\s+authority|smooth\s+decision-making|agreement\s+on\s+governance)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "governance",
        0,
        "You report agreeing on how decisions are made (+0)",
        "positive",
      );
    }

    // ---- DOMAIN 2: Commitment & Trust ----
    if (
      /(?:threatened\s+to\s+(?:quit|leave|walk)|walking\s+away|walk\s+away\s+if|walk\s+out|quit\s+abruptly|secretly\s+interviewing|stopped\s+showing\s+up|ghosting|completely\s+absent\s+from)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "commitment",
        7,
        "You described a founder leaving or threatening to leave (+7)",
        "active_risk",
      );
    } else if (
      /(?:worried\s+(?:they|someone|co-founder)\s+might\s+leave|wondering\s+what\s+happens\s+if\s+one\s+of\s+us\s+needs\s+to\s+leave|not\s+sure\s+about\s+(?:long-term\s+)?commitment|what\s+if\s+(?:one\s+of\s+us|they)\s+(?:leaves|quits))/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "commitment",
        4,
        "You are worried that someone may leave (+4)",
        "uncertainty",
      );
    } else if (
      /(?:working\s+part-time|has\s+a\s+day\s+job|has\s+another\s+job|competing\s+commitments)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "commitment",
        3,
        "You said one founder works part-time or has another job (+3)",
        "uncertainty",
      );
    } else if (
      /(?:things\s+have\s+gotten\s+complicated|relationship\s+is\s+strained|tension\s+between\s+us|communication\s+has\s+broken\s+down)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "commitment",
        3,
        "You described tension or communication problems (+3)",
        "ambiguous",
      );
    } else if (
      /(?:neither\s+of\s+us\s+will\s+(?:ever\s+)?(?:quit|leave|walk)|nobody\s+will\s+(?:quit|walk)|won't\s+walk\s+away|no\s+risk\s+of\s+(?:leaving|quitting|walking)|committed\s+full-time|both\s+fully\s+committed)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "commitment",
        0,
        "You said both founders plan to stay and contribute (+0)",
        "negated",
      );
    } else if (
      /(?:trust\s+(?:my\s+co-founder|each\s+other|partner)\s+completely|mutual\s+trust|high\s+mutual\s+trust|complete\s+trust|totally\s+aligned|vision\s+is\s+totally\s+aligned|love\s+working\s+with|trust\s+each\s+other)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "commitment",
        0,
        "You report trusting each other and sharing a direction (+0)",
        "positive",
      );
    }

    // ---- DOMAIN 3: Equity & Vesting ----
    if (
      /(?:disagree\s+about\s+equity|equity\s+dispute|fight\s+over\s+equity|refusing\s+(?:to\s+sign\s+)?vesting|demanding\s+(?:more\s+shares|higher\s+equity)|holding\s+shares\s+hostage|refuses\s+to\s+sign\s+(?:the\s+)?ip\s+assignment|wants?.*?(?:full\s+)?(?:\d+%\s+)?grant\s+vested\s+immediately)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "equity",
        6,
        "You described a disagreement about ownership or share terms (+6)",
        "active_risk",
      );
    } else if (
      /(?:i\s+write\s+100%\s+of\s+the\s+code|i\s+do\s+all\s+the\s+coding|carrying\s+(?:all\s+the\s+|the\s+entire\s+)?work(?:load)?|unspoken\s+labor\s+vs\s+ownership|sweat\s+equity\s+mismatch)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "equity",
        4,
        "You said ongoing work may not match the ownership split (+4)",
        "uncertainty",
      );
    } else if (
      /(?:unsure\s+how\s+dilution|worried\s+about\s+dilution|wondering\s+if\s+(?:the\s+)?split\s+is\s+fair|unsure\s+about\s+cliff\s+terms|what\s+happens\s+to\s+shares\s+if)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "equity",
        3,
        "You are unsure how future share changes or earning shares over time would work (+3)",
        "uncertainty",
      );
    } else if (
      /(?:equity\s+(?:allocation\s+)?needs\s+review|split\s+was\s+rushed|haven't\s+settled\s+on\s+vesting|still\s+need\s+to\s+discuss.*?equity)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "equity",
        2,
        "The ownership split or plan for earning shares is not settled (+2)",
        "ambiguous",
      );
    } else if (
      /(?:no\s+equity\s+disputes?|happy\s+with\s+(?:the\s+)?vesting|agreed\s+on\s+the\s+split|no\s+disagreement\s+over\s+equity)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "equity",
        0,
        "You report no current disagreement about ownership or the share-earning plan (+0)",
        "negated",
      );
    } else if (
      /(?:split\s+is\s+(?:completely\s+)?fair|both\s+satisfied\s+with\s+(?:equity|terms)|vesting\s+fully\s+embraced|fair\s+split|split\s+feels?\s+fair)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "equity",
        0,
        "You say the ownership split feels fair (+0)",
        "positive",
      );
    }

    // ---- DOMAIN 4: Financial Pressure ----
    if (
      /(?:not\s+broke|no\s+money\s+issues|plenty\s+of\s+savings|runway\s+is\s+fine|never\s+had\s+money\s+problems)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "financial",
        0,
        "You said you are not under financial pressure (+0)",
        "negated",
      );
    } else if (
      /(?:out\s+of\s+money|cannot\s+pay\s+rent|can't\s+pay\s+rent|\bbroke\b|panic\s+to\s+close|cannot\s+survive\s+unpaid|burning\s+(?:through\s+)?(?:cash|savings)|only\s+\w+\s+(?:weeks?|days?)\s+of\s+(?:personal\s+)?savings)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "financial",
        6,
        "You said personal savings are low or expenses may be hard to cover (+6)",
        "active_risk",
      );
    } else if (
      /(?:wants?\s+(?:a\s+)?higher\s+salary|salary\s+dispute|concerned\s+about\s+runway|cash\s+could\s+get\s+tight|wondering\s+about\s+salaries)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "financial",
        3,
        "You raised a concern about pay or how long personal savings will last (+3)",
        "uncertainty",
      );
    } else if (
      /(?:money\s+is\s+tricky|cash\s+situation\s+unclear|pressured\s+to\s+fundraise|salary\s+expectations\s+unsettled)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "financial",
        2,
        "You said money or pay plans are unclear (+2)",
        "ambiguous",
      );
    } else if (
      /(?:financially\s+comfortable|plenty\s+of\s+cash|finances\s+are\s+stable|savings\s+are\s+strong|capital\s+is\s+secured)/i.test(
        clause,
      )
    ) {
      addDomainFinding(
        "financial",
        0,
        "You reported having savings or funding in place (+0)",
        "positive",
      );
    }
  }

  const rawSum =
    domainScores.governance.weight +
    domainScores.commitment.weight +
    domainScores.equity.weight +
    domainScores.financial.weight;

  const finalWeight = Math.min(20, rawSum);

  const domainLabels: Record<DomainKey, string> = {
    governance: "Governance",
    commitment: "Commitment",
    equity: "Equity",
    financial: "Finance",
  };

  const explanations: string[] = [];
  const domainKeys = Object.keys(domainScores) as DomainKey[];

  for (const dom of domainKeys) {
    const data = domainScores[dom];
    if (data.weight > 0) {
      const topReason = [...data.reasons].sort((a, b) => b.weight - a.weight)[0];
      explanations.push(`[${domainLabels[dom]}] ${topReason.reason}`);
    } else if (data.reasons.some((r) => r.classification === "positive")) {
      const pos = data.reasons.find((r) => r.classification === "positive");
      if (pos) {
        explanations.push(`[${domainLabels[dom]}] ${pos.reason}`);
      }
    } else if (data.reasons.some((r) => r.classification === "negated")) {
      const neg = data.reasons.find((r) => r.classification === "negated");
      if (neg) {
        explanations.push(`[${domainLabels[dom]}] ${neg.reason}`);
      }
    }
  }

  return { weight: finalWeight, explanations };
}

export function concernWeight(text: string): number {
  return analyzeConcern(text).weight;
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
      ? "equal ownership"
      : inputs.equitySplit === "60-40"
        ? "a 60/40 ownership split"
        : inputs.equitySplit === "70-30"
          ? "a 70/30 ownership split"
          : "the ownership split we described";
  const vestingLine =
    inputs.vesting === "none"
      ? "We have not agreed on a plan for founders to earn their shares over time."
      : inputs.vesting === "standard"
        ? "We selected a four-year plan for earning shares, with a one-year wait before any shares are earned."
        : "We selected a custom plan for earning shares over time.";
  const workLine =
    inputs.commitmentLevel === "one-part-time"
      ? "We should agree on each person's weekly hours and what would need to happen for the part-time founder to work more."
      : inputs.commitmentLevel === "unclear"
        ? "We should agree on each person's expected hours and responsibilities."
        : inputs.commitmentLevel === "milestone-transition"
          ? "We should write down the funding or revenue milestone that would change someone's work hours."
          : "We should write down who is responsible for each major part of the work.";
  const decisionLine =
    inputs.decisionProtocol === "consensus-only"
      ? "We should decide what happens if we cannot agree on a major decision."
      : inputs.decisionProtocol === "undecided"
        ? "We should decide who makes which calls and how we resolve a disagreement."
        : inputs.decisionProtocol === "formal-tiebreaker"
          ? "We should write down which decisions need the outside tie-breaker."
          : "We should write down which decisions each person can make and which need both of us.";
  const concern = inputs.primaryConcern.trim();
  const concernLine = concern
    ? `You wrote that your main concern is: "${concern}"`
    : "Let's start with anything either of us is still unsure about.";

  return `I want us to agree on the important parts of working together before we sign anything.

You selected ${splitLabel}. ${vestingLine} ${workLine}

${concernLine}.

Let's answer these questions:
1. What does our ownership split mean if one of us leaves or our work changes?
2. What weekly work and responsibilities do we each agree to?
3. ${decisionLine}
4. What do we still need to put in writing, and who will do it?

Before we finish, let's list what we have agreed on and what still needs an answer.`;
}

function summaryFor(score: number, inputs: DiagnosticInputs): string {
  const split =
    inputs.equitySplit === "50-50"
      ? "equal ownership"
      : inputs.equitySplit === "70-30"
        ? "a 70/30 ownership split"
        : inputs.equitySplit === "60-40"
          ? "a 60/40 ownership split"
          : "a custom ownership split";
  const vest =
    inputs.vesting === "none"
      ? "no plan for earning shares over time"
      : inputs.vesting === "standard"
        ? "a four-year plan for earning shares, with a one-year wait before earning any shares"
        : "a custom plan for earning shares over time";
  return `Your score is ${score} out of 100. It reflects risk signals in the answers you selected; it is not the chance that your business will fail. You reported ${split}, ${vest}, and personal savings that may cover about ${inputs.runwayMonths} month${inputs.runwayMonths === 1 ? "" : "s"} of expenses.`;
}

export function evaluateDimensions(
  inputs: DiagnosticInputs,
  explanations: string[] = [],
): DimensionScore[] {
  // 1. Equity Fairness
  let equityScore = 40;
  if (inputs.equitySplit === "50-50") equityScore = 65;
  else if (inputs.equitySplit === "70-30") equityScore = 60;
  else if (inputs.equitySplit === "custom") equityScore = 55;
  else equityScore = 38; // 60-40

  if (inputs.contributionBalance === "idea-vs-execution") equityScore += 18;
  else if (inputs.contributionBalance === "capital-vs-labor") equityScore += 16;
  else if (inputs.contributionBalance === "experience-gap") equityScore += 10;
  else if (inputs.contributionBalance === "balanced") equityScore -= 8;

  if (explanations.some((e) => e.includes("[Equity]"))) equityScore += 12;
  equityScore = clamp(Math.round(equityScore), 15, 95);

  const equityFinding =
    equityScore >= 70
      ? "Your selected ownership split and work pattern may not match. Agree how each founder's current and future work will count."
      : equityScore >= 50
        ? "Write down how the ownership split reflects each founder's work and when you will review it."
        : "Your selected ownership split and work pattern appear broadly aligned. Put the agreement in writing.";

  const equityRec =
    inputs.contributionBalance === "idea-vs-execution"
      ? "Agree how the original idea and the ongoing work each count, and set a time to review contributions."
      : inputs.contributionBalance === "capital-vs-labor"
        ? "Write down separately how money put in will be repaid or counted, and what work each founder is expected to do."
        : "Write down each founder's role, expected work, and when you will review ownership.";

  // 2. Commitment and Contribution
  let commitScore = 35;
  if (inputs.commitmentLevel === "one-part-time") commitScore = 80;
  else if (inputs.commitmentLevel === "unclear") commitScore = 75;
  else if (inputs.commitmentLevel === "milestone-transition") commitScore = 55;
  else commitScore = 25; // both-full-time

  if (explanations.some((e) => e.includes("[Commitment]"))) commitScore += 12;
  commitScore = clamp(Math.round(commitScore), 15, 95);

  const commitFinding =
    commitScore >= 70
      ? "One founder is working fewer hours, or the expected hours are unclear. Agree on each person's workload so one does not end up carrying most of the work."
      : commitScore >= 50
        ? "One founder plans to change their work hours later. Agree on the milestone and what happens if it is delayed."
        : "Both founders report working full-time.";

  const commitRec =
    inputs.commitmentLevel === "one-part-time"
      ? "Agree on weekly hours, responsibilities, and a date or milestone for changing to full-time. Decide what you will do if plans change."
      : inputs.commitmentLevel === "milestone-transition"
        ? "Write down the funding or revenue milestone that would change someone's work hours, and what happens if it is not reached."
        : "Write down each person's responsibilities and check in regularly about workload.";

  // 3. Governance and Decision-Making
  let govScore = 35;
  if (inputs.decisionProtocol === "consensus-only" && inputs.equitySplit === "50-50")
    govScore = 88;
  else if (inputs.decisionProtocol === "consensus-only") govScore = 70;
  else if (inputs.decisionProtocol === "undecided") govScore = 78;
  else if (inputs.decisionProtocol === "clear-ceo") govScore = 32;
  else if (inputs.decisionProtocol === "formal-tiebreaker") govScore = 28;

  if (explanations.some((e) => e.includes("[Governance]"))) govScore += 12;
  govScore = clamp(Math.round(govScore), 15, 95);

  const govFinding =
    govScore >= 70
      ? "If both founders must approve every major decision, or you have no agreed process, one disagreement can hold up important work."
      : govScore >= 50
        ? "Write down which decisions need both founders and who can make day-to-day choices."
        : "You selected a named decision-maker or a tie-breaker. Write down which decisions that rule covers.";

  const govRec =
    inputs.decisionProtocol === "consensus-only"
      ? "Agree which decisions need both founders, who handles day-to-day choices, and what to do when you cannot agree."
      : inputs.decisionProtocol === "undecided"
        ? "Choose who makes day-to-day decisions in each area and how you will settle disagreements."
        : "Write down how your named leader or outside adviser will help resolve a disagreement, and which decisions the rule covers.";

  // 4. Financial Pressure
  let finScore = 30;
  if (inputs.runwayMonths <= 2) finScore = 88;
  else if (inputs.runwayMonths <= 5) finScore = 72;
  else if (inputs.runwayMonths <= 9) finScore = 52;
  else if (inputs.runwayMonths <= 14) finScore = 35;
  else finScore = 20;

  if (inputs.salaryExpectation === "immediate-salary-needed") finScore += 18;
  else if (inputs.salaryExpectation === "different-runways") finScore += 14;
  else if (inputs.salaryExpectation === "deferred-compensation") finScore += 10;

  if (explanations.some((e) => e.includes("[Finance]"))) finScore += 10;
  finScore = clamp(Math.round(finScore), 15, 95);

  const finFinding =
    finScore >= 70
      ? "Your answers point to limited personal savings or a near-term need for pay. Agree how that pressure could affect decisions; this score does not measure company cash."
      : finScore >= 50
        ? "Your personal savings or pay expectations may affect how long each founder can wait. Discuss this separately from the company's cash."
        : "Your answers suggest less immediate pressure around personal savings and pay. They do not tell us how much cash the company has.";

  const finRec =
    inputs.salaryExpectation === "immediate-salary-needed" || finScore >= 70
      ? "Agree when each founder may be paid and whether either needs outside work. Review company cash separately from personal savings."
      : "Write down when founder pay can begin and make sure both founders agree on the same rule.";

  // 5. Trust and Communication
  let trustScore = 35;
  if (inputs.workingHistory === "past-tensions") trustScore = 75;
  else if (inputs.workingHistory === "new-collaborators") trustScore = 55;
  else if (inputs.workingHistory === "untested") trustScore = 48;
  else trustScore = 22; // shipped-together

  if (
    explanations.some((e) => e.includes("[Commitment]") && e.includes("trust"))
  )
    trustScore += 15;
  trustScore = clamp(Math.round(trustScore), 15, 95);

  const trustFinding =
    trustScore >= 70
      ? "You report past tension. Agree on how to raise disagreements and work through them instead of assuming they will go away."
      : trustScore >= 50
        ? "You have not worked together for long. A small shared project can show how you handle deadlines and disagreements."
        : "You report having built and delivered work together.";

  const trustRec =
    inputs.workingHistory === "new-collaborators" ||
    inputs.workingHistory === "untested"
      ? "Try a short, clearly defined project together and review how you handle deadlines, feedback, and disagreements."
      : "Set a regular time to discuss concerns and agree on how you will resolve disagreements.";

  // 6. Departure and Founder Protection
  let depScore = 35;
  if (inputs.vesting === "none") depScore = 85;
  else if (inputs.vesting === "standard") depScore = 35;
  else depScore = 55;

  if (inputs.departureTerms === "no-formal-terms") depScore += 20;
  else if (inputs.departureTerms === "vesting-only") depScore += 10;
  else if (inputs.departureTerms === "in-discussion") depScore += 5;
  else if (inputs.departureTerms === "market-standard") depScore -= 10;

  depScore = clamp(Math.round(depScore), 15, 95);

  const depFinding =
    depScore >= 70
      ? "Some rules for shares or leaving may be missing. Write down what happens to shares and work if a founder leaves."
      : depScore >= 50
        ? "You selected a plan for earning shares, but some rules about work ownership or leaving may still need to be written down."
        : "You report having written rules for earning shares and what happens if someone leaves. Make sure both founders understand them.";

  const depRec =
    inputs.vesting === "none"
      ? "Agree on a written plan for when each founder earns shares and what happens if they leave. Ask a qualified startup lawyer to review it."
      : "Check that your written agreement says who owns work made for the business and what happens to shares if someone leaves.";

  return [
    {
      key: "equityFairness",
      label: "Ownership and fairness",
      score: equityScore,
      level: riskLevel(equityScore),
      finding: equityFinding,
      recommendation: equityRec,
    },
    {
      key: "commitment",
      label: "Time and workload",
      score: commitScore,
      level: riskLevel(commitScore),
      finding: commitFinding,
      recommendation: commitRec,
    },
    {
      key: "governance",
      label: "Making decisions",
      score: govScore,
      level: riskLevel(govScore),
      finding: govFinding,
      recommendation: govRec,
    },
    {
      key: "financialPressure",
      label: "Personal money and pay",
      score: finScore,
      level: riskLevel(finScore),
      finding: finFinding,
      recommendation: finRec,
    },
    {
      key: "trust",
      label: "Trust and communication",
      score: trustScore,
      level: riskLevel(trustScore),
      finding: trustFinding,
      recommendation: trustRec,
    },
    {
      key: "departureProtection",
      label: "If someone leaves",
      score: depScore,
      level: riskLevel(depScore),
      finding: depFinding,
      recommendation: depRec,
    },
  ];
}

export function generateDeterministicInsights(
  inputs: DiagnosticInputs,
  dimensions: DimensionScore[],
  explanations: string[] = [],
): AIAnalysisResult {
  const interconnectedRisks = [];
  const contradictions = [];
  const overlookedWeaknesses = [];

  // A. Interconnected Risks
  if (
    inputs.equitySplit === "50-50" &&
    (inputs.decisionProtocol === "consensus-only" ||
      inputs.decisionProtocol === "undecided")
  ) {
    interconnectedRisks.push({
      title: "50/50 Deadlock Vortex",
      impact:
        "Equal 50/50 ownership combined with consensus-only decision protocol creates an unresolvable veto trap. The first disagreement on a strategic pivot or funding term can freeze the board completely.",
      factors: [
        "50/50 Equal Split",
        "Consensus-Only Governance",
        "No Casting Vote Protocol",
      ],
    });
  }

  if (
    inputs.vesting === "none" &&
    inputs.commitmentLevel === "one-part-time"
  ) {
    interconnectedRisks.push({
      title: "Immediate Equity Extraction Under Part-Time Labor",
      impact:
        "Unvested stock paired with a part-time founder allows that founder to walk away after a few months while retaining a permanent common equity block that sterilizes future fundraising.",
      factors: [
        "No Vesting / Immediate Grant",
        "Asymmetric Workload / Part-Time Founder",
        "No Clawback Mechanism",
      ],
    });
  }

  if (
    inputs.runwayMonths < 6 &&
    inputs.salaryExpectation === "immediate-salary-needed"
  ) {
    interconnectedRisks.push({
      title: "Financial Exhaustion & Panic Dilution Spiral",
      impact:
        "Sub-6-month runway coupled with an immediate personal salary requirement forces founders into emergency terms with unfavorable investor rights or abrupt founder departures.",
      factors: [
        `Under 6 Months Runway (${inputs.runwayMonths} months)`,
        "Immediate Salary Requirement",
        "Cash Pressure Asymmetry",
      ],
    });
  }

  if (
    inputs.contributionBalance === "idea-vs-execution" &&
    inputs.equitySplit === "70-30"
  ) {
    interconnectedRisks.push({
      title: "Idea-Premium vs. Ongoing Labor Resentment",
      impact:
        "Granting 70% to an originator while the 30% builder ships the code and runs operations creates compounding bitterness within 12–18 months unless reviewed against delivery milestones.",
      factors: [
        "Steep 70/30 Split",
        "Idea vs Execution Asymmetry",
        "Unwritten Labor Milestones",
      ],
    });
  }

  // Fallback interconnected risk if none matched
  if (interconnectedRisks.length === 0) {
    const highestDim = [...dimensions].sort((a, b) => b.score - a.score)[0];
    interconnectedRisks.push({
      title: `Compounding Vulnerability in ${highestDim.label}`,
      impact: `${highestDim.finding} When combined with early fundraising deadlines, this structural friction limits strategic agility.`,
      factors: [
        `${highestDim.label} (${highestDim.level} Risk)`,
        "Early Venture Uncertainty",
        "Unwritten Expectations",
      ],
    });
  }

  // B. Contradictions & Mismatched Expectations
  if (
    inputs.equitySplit === "50-50" &&
    inputs.commitmentLevel === "one-part-time"
  ) {
    contradictions.push({
      detectedMismatch:
        "Equal equity ownership claimed despite unequal operational time commitments.",
      evidence:
        "Inputs show a 50/50 split but one founder is operating part-time while the other is full-time.",
      implication:
        "The full-time operator absorbs operational burden and will naturally resent the passive partner within 12 months.",
    });
  }

  if (
    inputs.decisionProtocol === "consensus-only" &&
    inputs.workingHistory === "past-tensions"
  ) {
    contradictions.push({
      detectedMismatch:
        "Strict consensus decision-making relied upon despite existing relationship frictions.",
      evidence:
        "Governance relies on 100% agreement, while working history indicates past communication strain.",
      implication:
        "Consensus works when communication is effortless. With past tensions, it functions as a weaponized veto.",
    });
  }

  if (
    inputs.vesting === "none" &&
    inputs.departureTerms === "market-standard"
  ) {
    contradictions.push({
      detectedMismatch:
        "Market-standard departure protection claimed while vesting schedule is marked as None.",
      evidence:
        "Vesting is set to immediate, yet departure terms are reported as market standard.",
      implication:
        "Market-standard terms require 4-year vesting with a 1-year cliff. Immediate grants leave the venture legally unprotected.",
    });
  }

  if (contradictions.length === 0) {
    contradictions.push({
      detectedMismatch:
        "Operational expectations are assumed rather than contractually papered.",
      evidence:
        "Questionnaire indicates high founder alignment, yet primary concern highlights unresolved worries.",
      implication:
        "Founders often substitute initial optimism for rigorous contractual clarity.",
    });
  }

  // C. Overlooked Structural Weaknesses
  if (inputs.departureTerms !== "market-standard") {
    overlookedWeaknesses.push({
      weakness: "Missing Proprietary Inventions & IP Assignment Agreement",
      whyItMatters:
        "Without signed IP assignment, code, designs, and patents remain the personal property of the individual author, giving a departing founder leverage to halt the company.",
      actionToAddress:
        "Execute a comprehensive Confidential Information and Inventions Assignment Agreement (CIIAA) before incorporation.",
    });
  }

  if (
    inputs.decisionProtocol !== "clear-ceo" &&
    inputs.decisionProtocol !== "formal-tiebreaker"
  ) {
    overlookedWeaknesses.push({
      weakness: "Absence of Deadlock Resolution & Casting Vote Protocol",
      whyItMatters:
        "When two founders reach an impasse on fundraising or product pivots, without a pre-agreed deadlock mechanism the company enters legal limbo.",
      actionToAddress:
        "Establish an independent advisory seat or designated CEO casting vote for deadlocks after a 14-day cooling-off window.",
    });
  }

  overlookedWeaknesses.push({
    weakness: "Unclear 83(b) Tax Election & Reverse Vesting Terms",
    whyItMatters:
      "Subjecting shares to reverse vesting without filing an IRS Section 83(b) election within 30 days can create massive unexpected personal tax liabilities.",
    actionToAddress:
      "Calendar and file 83(b) elections via certified mail within 30 days of stock grant execution.",
  });

  // D. Prioritized Actions
  const immediateActions: string[] = [];
  const beforeSigningActions: string[] = [];
  const longTermActions: string[] = [];
  const needsClarification: string[] = [];

  if (inputs.vesting === "none") {
    immediateActions.push(
      "Institute a 4-year reverse vesting schedule with a 1-year cliff on all common founder grants.",
    );
  }
  if (
    inputs.equitySplit === "50-50" &&
    inputs.decisionProtocol === "consensus-only"
  ) {
    immediateActions.push(
      "Agree on a binding tie-breaker: either designate a CEO with domain authority or name an independent casting voter.",
    );
  }
  if (immediateActions.length === 0) {
    immediateActions.push(
      "Review the primary concern in a dedicated 60-minute alignment session before exchanging legal drafts.",
    );
  }

  beforeSigningActions.push(
    "Execute written IP Assignment and Non-Disclosure agreements for all prior and future work.",
  );
  beforeSigningActions.push(
    "Define clear Good Leaver vs. Bad Leaver buyback repurchase rights in the Shareholder Agreement.",
  );

  longTermActions.push(
    "Establish a formal 6-month and 12-month role review to revisit equity and titles as the business scales.",
  );
  longTermActions.push(
    "Re-evaluate founder salary restoration triggers once $500k+ in outside capital is secured.",
  );

  if (inputs.primaryConcern.trim()) {
    needsClarification.push(
      `Clarify specific mutual expectations regarding: "${inputs.primaryConcern.trim()}"`,
    );
  } else {
    needsClarification.push(
      "Formalize agreed minimum hours per week for all participating founders.",
    );
  }

  if (explanations && explanations.length > 0) {
    needsClarification.push(
      `Revisit key diagnostic signal: ${explanations[0]}`,
    );
  }

  // E. Discussion Questions
  const discussionQuestions = [
    "If one of us receives a lucrative job offer at month 10, exactly how many shares can the company repurchase, and at what price?",
    "If we deadlocked 50/50 on whether to accept an acquisition offer or bridge loan, who casts the deciding vote?",
    "What specific traction milestones must be hit before any founder draws a full market salary?",
    "If one founder’s operational speed falls behind company growth, what is our process for bringing in a senior executive over them?",
  ];

  return {
    isAIGenerated: false,
    modelUsed: "Blindspot Deterministic Intelligence Engine",
    executiveSummary: `The diagnostic evaluates your partnership at a Risk Exposure Index of ${inputs.runwayMonths < 6 ? "elevated vulnerability" : "manageable structural risk"}. Key areas requiring immediate contractual clarity include ${dimensions[0].label} and ${dimensions[2].label}.`,
    interconnectedRisks,
    contradictions,
    overlookedWeaknesses,
    prioritizedActions: {
      immediate: immediateActions,
      beforeSigning: beforeSigningActions,
      longTermMonitoring: longTermActions,
      needsClarification,
    },
    discussionQuestions,
  };
}

export function runDiagnostic(inputs: DiagnosticInputs): DiagnosticResult {
  const concernAnalysis = analyzeConcern(inputs.primaryConcern);
  const raw =
    22 +
    splitWeight(inputs.equitySplit) +
    vestingWeight(inputs.vesting) +
    runwayWeight(inputs.runwayMonths) +
    concernAnalysis.weight;
  const score = clamp(Math.round(raw), 34, 94);
  const dimensions = evaluateDimensions(inputs, concernAnalysis.explanations);

  return {
    score,
    level: riskLevel(score),
    summary: summaryFor(score, inputs),
    patterns: pickPatterns(inputs),
    script: buildScript(inputs),
    explanations: concernAnalysis.explanations,
    dimensions,
  };
}

export const EQUITY_OPTIONS: { value: EquitySplit; label: string }[] = [
  { value: "50-50", label: "50/50 — equal ownership" },
  { value: "60-40", label: "60/40 ownership split" },
  { value: "70-30", label: "70/30 ownership split" },
  { value: "custom", label: "Another ownership split" },
];

export const VESTING_OPTIONS: { value: VestingSchedule; label: string }[] = [
  { value: "none", label: "Shares are assigned right away" },
  { value: "standard", label: "Earn shares over 4 years; none in year one" },
  { value: "custom", label: "Another plan for earning shares" },
];

export const CONTRIBUTION_OPTIONS: {
  value: ContributionBalance;
  label: string;
  description: string;
}[] = [
  {
    value: "balanced",
    label: "We do a similar amount of work",
    description: "Both founders share the day-to-day work of building and running the business.",
  },
  {
    value: "idea-vs-execution",
    label: "One brought the idea; the other does most of the building",
    description: "One founder came up with the idea; the other builds the product and handles daily work.",
  },
  {
    value: "capital-vs-labor",
    label: "One put in money; the other works without pay",
    description: "One founder contributed money or savings while the other contributes unpaid work.",
  },
  {
    value: "experience-gap",
    label: "One has more startup or industry experience",
    description: "One founder has more experience building businesses or working in this industry.",
  },
];

export const COMMITMENT_OPTIONS: {
  value: CommitmentLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "both-full-time",
    label: "Both work full-time from the start",
    description: "Both founders can focus their working hours on this business.",
  },
  {
    value: "one-part-time",
    label: "One works full-time; one works part-time",
    description: "One founder has another job or consulting work as well.",
  },
  {
    value: "milestone-transition",
    label: "Work hours change after a funding milestone",
    description: "A founder plans to work more hours only after the business receives funding.",
  },
  {
    value: "unclear",
    label: "We have not agreed on work hours yet",
    description: "The founders have not agreed how much time each person will commit.",
  },
];

export const DECISION_OPTIONS: {
  value: DecisionProtocol;
  label: string;
  description: string;
}[] = [
  {
    value: "clear-ceo",
    label: "One founder leads agreed areas of work",
    description: "One founder can make decisions in the areas both founders have assigned to them.",
  },
  {
    value: "consensus-only",
    label: "Both founders must agree on major decisions",
    description: "Neither founder can make a major decision alone.",
  },
  {
    value: "formal-tiebreaker",
    label: "An outside adviser breaks ties",
    description: "An agreed adviser or board member helps decide when the founders cannot agree.",
  },
  {
    value: "undecided",
    label: "We have not agreed what to do when we disagree",
    description: "The founders have not decided how to settle an important disagreement.",
  },
];

export const SALARY_OPTIONS: {
  value: SalaryExpectation;
  label: string;
  description: string;
}[] = [
  {
    value: "both-unpaid",
    label: "Both can work without pay for now",
    description: "Both founders say their personal savings can cover their expenses for now.",
  },
  {
    value: "immediate-salary-needed",
    label: "One founder needs income soon",
    description: "One founder cannot keep working without pay for much longer.",
  },
  {
    value: "deferred-compensation",
    label: "Unpaid salary will be owed later",
    description: "The founders expect the business to record unpaid salary and pay it later.",
  },
  {
    value: "different-runways",
    label: "Personal savings differ by more than 6 months",
    description: "One founder can cover personal expenses much longer than the other.",
  },
];

export const HISTORY_OPTIONS: {
  value: WorkingHistory;
  label: string;
  description: string;
}[] = [
  {
    value: "shipped-together",
    label: "We have completed projects together",
    description: "The founders have built and finished projects together before.",
  },
  {
    value: "new-collaborators",
    label: "We met recently and have little work history",
    description: "The founders have not worked together for long.",
  },
  {
    value: "past-tensions",
    label: "We have worked through disagreements, but some tension remains",
    description: "The founders have resolved disagreements before, but still have some tension.",
  },
  {
    value: "untested",
    label: "We are friends or colleagues, but have not started a business together",
    description: "The founders know each other but have not worked together as business owners.",
  },
];

export const DEPARTURE_OPTIONS: {
  value: DepartureTerms;
  label: string;
  description: string;
}[] = [
  {
    value: "market-standard",
    label: "Written rules cover shares, work ownership, and leaving",
    description: "The founders report having written terms for earning shares, ownership of work, and what happens if someone leaves.",
  },
  {
    value: "vesting-only",
    label: "Share plan agreed; work ownership or buyout terms are unsigned",
    description: "The founders chose how shares are earned, but have not signed all work-ownership or buyout terms.",
  },
  {
    value: "no-formal-terms",
    label: "No written founder terms yet",
    description: "The founders have not signed a written agreement covering their partnership.",
  },
  {
    value: "in-discussion",
    label: "Working with a lawyer on written terms",
    description: "The founders are preparing a written agreement with a lawyer.",
  },
];