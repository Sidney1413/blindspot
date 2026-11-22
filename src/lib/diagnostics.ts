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
      "Active erosion of trust post-transition (+7)",
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
      "Severe breach of mutual trust (+7)",
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
      "Explicit acknowledgement of potential dispute (+4)",
      "uncertainty",
    );
  }

  // 3. Epistemic hedge: "I don't think we have a deadlock"
  if (/(?:don't|do\s+not)\s+think\s+we\s+have\s+(?:a\s+)?deadlock/i.test(t)) {
    addDomainFinding(
      "governance",
      3,
      "Epistemic hedge on deadlock (+3)",
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
      "Unprompted denial of departure risk (+2)",
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
        "Active governance deadlock / stalemate (+7)",
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
        "Active dispute over control and voting rights (+7)",
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
        "Governance deadlock / final decision dispute (+6)",
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
        "Governance tie-breaker uncertainty (+4)",
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
        "Unresolved control / governance discussion (+2)",
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
        "Negated deadlock risk with agreed tie-breaker (+0)",
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
        "Clear governance alignment (+0)",
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
        "Active walk-away / abandonment threat (+7)",
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
        "Speculative concern regarding departure (+4)",
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
        "Part-time or split commitment noted (+3)",
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
        "Ambiguous relationship / co-founder strain (+3)",
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
        "Explicit negation of walk-away risk (+0)",
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
        "Affirmed mutual trust & alignment (+0)",
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
        "Active disagreement / dispute over equity terms (+6)",
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
        "Labor vs ownership contribution mismatch (+4)",
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
        "Dilution and vesting schedule uncertainty (+3)",
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
        "Unfinalized or rushed equity agreement (+2)",
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
        "Negated equity / vesting concerns (+0)",
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
        "Affirmed equity fairness (+0)",
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
        "Negated financial distress (+0)",
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
        "Acute personal cash insolvency and financial strain (+6)",
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
        "Compensation/salary friction or tight runway (+3)",
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
        "Uncertain cash flow or fundraising pressure (+2)",
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
        "Affirmed financial stability (+0)",
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
      ? "Steep disparity or unaligned expectations between ideation, capital, and ongoing sweat equity."
      : equityScore >= 50
        ? "Equity split requires explicit contribution milestones to prevent future labor-ownership drift."
        : "Equity distribution broadly reflects documented operational expectations.";

  const equityRec =
    inputs.contributionBalance === "idea-vs-execution"
      ? "Institute an annual equity review clause tied to milestone delivery rather than historical ideation."
      : inputs.contributionBalance === "capital-vs-labor"
        ? "Separate founder common shares from capital investment notes (SAFE/Convertible) so equity reflects labor."
        : "Document role charters and contribution milestones in writing before formal signing.";

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
      ? "Substantial time or availability asymmetry risks one founder carrying the venture alone."
      : commitScore >= 50
        ? "Staggered transitions to full-time create vulnerable execution windows if revenue delays."
        : "Full-time dedication is aligned across all co-founders.";

  const commitRec =
    inputs.commitmentLevel === "one-part-time"
      ? "Set a strict contractual deadline for the part-time founder to go full-time, with proportional vesting adjustments if missed."
      : inputs.commitmentLevel === "milestone-transition"
        ? "Define objective capital or revenue triggers for full-time transition in your founder accord."
        : "Maintain quarterly availability check-ins to catch silent operational drift early.";

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
      ? "Consensus-only rule without a tie-breaker creates critical freeze exposure on hiring, pivots, and fundraising."
      : govScore >= 50
        ? "Informal division of decision authority needs explicit boundaries between operational and board matters."
        : "Clear leadership hierarchy or third-party deadlock breaker minimizes governance stalemate.";

  const govRec =
    inputs.decisionProtocol === "consensus-only"
      ? "Designate an independent third-party advisor with a binding casting vote for structural deadlocks."
      : inputs.decisionProtocol === "undecided"
        ? "Write down domain autonomy immediately: CEO owns final commercial calls, CTO owns architecture."
        : "Establish a 14-day formal cooling-off and mediation procedure before any shotgun dispute.";

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
      ? "Acute personal cash constraints threaten to force panic fundraising, dilution, or sudden founder departure."
      : finScore >= 50
        ? "Disparate personal runways create misaligned risk tolerance when deciding whether to raise or bootstrap."
        : "Adequate financial cushion gives the founding team room to negotiate from strength.";

  const finRec =
    inputs.salaryExpectation === "immediate-salary-needed" || finScore >= 70
      ? "Model emergency cash floors: agree on the exact date when outside consulting or an angel bridge must be initiated."
      : "Pre-agree on founder salary tiers upon closing a seed round to prevent post-financing compensation disputes.";

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
      ? "Existing interpersonal friction or unaddressed suspicions threaten partnership cohesion under pressure."
      : trustScore >= 50
        ? "Untested partnership dynamic: founders have not yet stress-tested collaboration through an acute crisis."
        : "High baseline transparency and demonstrated shared execution history.";

  const trustRec =
    inputs.workingHistory === "new-collaborators" ||
    inputs.workingHistory === "untested"
      ? "Complete a 30-day pre-incorporation trial sprint on a key milestone before executing final cap table paperwork."
      : "Conduct a monthly 'unspoken issues' retrospective to air latent frustrations before they fester.";

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
      ? "Critical vulnerability: a departing founder could walk away with significant equity, unassigned IP, or no buyout terms."
      : depScore >= 50
        ? "Basic vesting is planned, but IP assignment, buyback mechanisms, and good/bad leaver clauses are unresolved."
        : "Comprehensive 4-year vesting, 1-year cliff, and explicit company repurchase rights protect the cap table.";

  const depRec =
    inputs.vesting === "none"
      ? "Implement standard 4-year reverse vesting with a 1-year cliff immediately. Non-negotiable for institutional funding."
      : "Ensure proprietary invention and IP assignment agreements (CIIAA) are signed concurrently with stock purchase agreements.";

  return [
    {
      key: "equityFairness",
      label: "Equity Fairness",
      score: equityScore,
      level: riskLevel(equityScore),
      finding: equityFinding,
      recommendation: equityRec,
    },
    {
      key: "commitment",
      label: "Commitment & Contribution",
      score: commitScore,
      level: riskLevel(commitScore),
      finding: commitFinding,
      recommendation: commitRec,
    },
    {
      key: "governance",
      label: "Governance & Decisions",
      score: govScore,
      level: riskLevel(govScore),
      finding: govFinding,
      recommendation: govRec,
    },
    {
      key: "financialPressure",
      label: "Financial Pressure",
      score: finScore,
      level: riskLevel(finScore),
      finding: finFinding,
      recommendation: finRec,
    },
    {
      key: "trust",
      label: "Trust & Communication",
      score: trustScore,
      level: riskLevel(trustScore),
      finding: trustFinding,
      recommendation: trustRec,
    },
    {
      key: "departureProtection",
      label: "Departure & Founder Protection",
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
  const aiAnalysis = generateDeterministicInsights(
    inputs,
    dimensions,
    concernAnalysis.explanations,
  );

  return {
    score,
    level: riskLevel(score),
    summary: summaryFor(score, inputs),
    patterns: pickPatterns(inputs),
    script: buildScript(inputs),
    explanations: concernAnalysis.explanations,
    dimensions,
    aiAnalysis,
  };
}

export const EQUITY_OPTIONS: { value: EquitySplit; label: string }[] = [
  { value: "50-50", label: "50/50 Equal" },
  { value: "60-40", label: "60/40 Split" },
  { value: "70-30", label: "70/30 Split" },
  { value: "custom", label: "Other / Custom Ratio" },
];

export const VESTING_OPTIONS: { value: VestingSchedule; label: string }[] = [
  { value: "none", label: "No Vesting / Immediate" },
  { value: "standard", label: "4-Year with 1-Year Cliff" },
  { value: "custom", label: "Custom Phased Schedule" },
];

export const CONTRIBUTION_OPTIONS: {
  value: ContributionBalance;
  label: string;
  description: string;
}[] = [
  {
    value: "balanced",
    label: "Balanced Workload & Shared Execution",
    description: "Both co-founders share direct product, engineering, and commercial execution.",
  },
  {
    value: "idea-vs-execution",
    label: "Originator / Idea vs. Primary Builder",
    description: "One founder conceived the IP/vision; the other builds and runs daily operations.",
  },
  {
    value: "capital-vs-labor",
    label: "Capital Investor vs. Full Sweat Equity",
    description: "One founder put in early capital/savings while the other works full-time unpaid.",
  },
  {
    value: "experience-gap",
    label: "Senior / Serial Founder vs. Junior Founder",
    description: "One founder has prior exits or industry tenure; the other is earlier in career.",
  },
];

export const COMMITMENT_OPTIONS: {
  value: CommitmentLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "both-full-time",
    label: "Both Full-Time From Day One",
    description: "Full working hours dedicated immediately with no outside employment.",
  },
  {
    value: "one-part-time",
    label: "One Full-Time, One Part-Time",
    description: "One partner is maintaining a salaried job or consulting on the side.",
  },
  {
    value: "milestone-transition",
    label: "Phased Transition on Funding",
    description: "Transitioning to full-time only after closing an angel/pre-seed check.",
  },
  {
    value: "unclear",
    label: "Flexible / Not Explicitly Defined Yet",
    description: "Hours and availability have not been contractually agreed upon.",
  },
];

export const DECISION_OPTIONS: {
  value: DecisionProtocol;
  label: string;
  description: string;
}[] = [
  {
    value: "clear-ceo",
    label: "Designated CEO With Domain Autonomy",
    description: "Clear executive authority with explicit functional ownership (Tech vs. Business).",
  },
  {
    value: "consensus-only",
    label: "Consensus Required on All Major Decisions",
    description: "Both founders must agree on every major call; no unilateral voting.",
  },
  {
    value: "formal-tiebreaker",
    label: "Independent Advisor / Board Tie-Breaker",
    description: "Agreed independent third-party with casting vote on deadlocks.",
  },
  {
    value: "undecided",
    label: "No Formal Protocol Agreed Yet",
    description: "We haven't discussed what happens when we disagree fundamentally.",
  },
];

export const SALARY_OPTIONS: {
  value: SalaryExpectation;
  label: string;
  description: string;
}[] = [
  {
    value: "both-unpaid",
    label: "Both Work Unpaid (Sufficient Runway)",
    description: "Both founders can survive on savings until the seed round.",
  },
  {
    value: "immediate-salary-needed",
    label: "One Founder Needs Immediate Income",
    description: "One partner cannot afford to work unpaid for more than 1–2 months.",
  },
  {
    value: "deferred-compensation",
    label: "Accruing Deferred Salary Debt",
    description: "Tracking unpaid market wages as company debt to be repaid post-funding.",
  },
  {
    value: "different-runways",
    label: "Asymmetric Runway (>6 Month Gap)",
    description: "One founder has substantial savings; the other has tight personal runway.",
  },
];

export const HISTORY_OPTIONS: {
  value: WorkingHistory;
  label: string;
  description: string;
}[] = [
  {
    value: "shipped-together",
    label: "Shipped Real Projects Together Before",
    description: "Proven track record of building and delivering under real deadlines.",
  },
  {
    value: "new-collaborators",
    label: "Recently Met (Matching / Hackathon)",
    description: "Early partnership; dynamic still untested under acute crisis pressure.",
  },
  {
    value: "past-tensions",
    label: "Navigated Past Disagreements, Friction Remains",
    description: "Strong alignment overall, but some past communication scar tissue.",
  },
  {
    value: "untested",
    label: "Friends or Colleagues, Never Co-Founded",
    description: "Great personal relationship, but unproven as business fiduciaries.",
  },
];

export const DEPARTURE_OPTIONS: {
  value: DepartureTerms;
  label: string;
  description: string;
}[] = [
  {
    value: "market-standard",
    label: "Market-Standard Vesting, IP Assignment & Repurchase",
    description: "4-year vest, 1-year cliff, written CIIAA, customary good/bad leaver buyback.",
  },
  {
    value: "vesting-only",
    label: "Vesting Agreed, IP & Buyout Unsigned",
    description: "Vesting schedule chosen, but legal IP assignment and buyout terms are unwritten.",
  },
  {
    value: "no-formal-terms",
    label: "Handshake Deal (No Written Terms)",
    description: "No formal founder agreement or IP protection executed yet.",
  },
  {
    value: "in-discussion",
    label: "Currently Negotiating With Counsel",
    description: "Drafting shareholder accord and founder documentation now.",
  },
];