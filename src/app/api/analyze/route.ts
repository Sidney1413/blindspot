import { NextResponse } from "next/server";
import { runDiagnostic } from "@/lib/diagnostics";
import type {
  AIAnalysisResult,
  ContradictionItem,
  DiagnosticInputs,
  InterconnectedRisk,
  OverlookedWeakness,
  PrioritizedActions,
} from "@/lib/types";

interface AnalyzeRequestBody {
  inputs?: unknown;
  aiConsent?: unknown;
}

const EQUITY_SPLITS = new Set(["50-50", "60-40", "70-30", "custom"]);
const VESTING_SCHEDULES = new Set(["none", "standard", "custom"]);
const CONTRIBUTION_BALANCES = new Set([
  "balanced",
  "idea-vs-execution",
  "capital-vs-labor",
  "experience-gap",
]);
const COMMITMENT_LEVELS = new Set([
  "both-full-time",
  "one-part-time",
  "milestone-transition",
  "unclear",
]);
const DECISION_PROTOCOLS = new Set([
  "clear-ceo",
  "consensus-only",
  "formal-tiebreaker",
  "undecided",
]);
const SALARY_EXPECTATIONS = new Set([
  "both-unpaid",
  "immediate-salary-needed",
  "deferred-compensation",
  "different-runways",
]);
const WORKING_HISTORIES = new Set([
  "shipped-together",
  "new-collaborators",
  "past-tensions",
  "untested",
]);
const DEPARTURE_TERMS = new Set([
  "market-standard",
  "vesting-only",
  "no-formal-terms",
  "in-discussion",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalEnum(
  value: unknown,
  allowed: Set<string>,
): string | undefined {
  return typeof value === "string" && allowed.has(value) ? value : undefined;
}

function validateInputs(value: unknown): DiagnosticInputs | null {
  if (!isRecord(value)) return null;

  const equitySplit = optionalEnum(value.equitySplit, EQUITY_SPLITS);
  const vesting = optionalEnum(value.vesting, VESTING_SCHEDULES);
  const primaryConcern =
    typeof value.primaryConcern === "string"
      ? value.primaryConcern.trim()
      : "";
  const runwayMonths = value.runwayMonths;

  if (
    !equitySplit ||
    !vesting ||
    primaryConcern.length === 0 ||
    primaryConcern.length > 1000 ||
    typeof runwayMonths !== "number" ||
    !Number.isInteger(runwayMonths) ||
    runwayMonths < 0 ||
    runwayMonths > 120
  ) {
    return null;
  }

  let customSplitText: string | undefined;
  if (typeof value.customSplitText === "string") {
    customSplitText = value.customSplitText.trim();
    if (customSplitText.length > 100) return null;
  } else if (value.customSplitText !== undefined) {
    return null;
  }

  return {
    equitySplit: equitySplit as DiagnosticInputs["equitySplit"],
    vesting: vesting as DiagnosticInputs["vesting"],
    runwayMonths,
    primaryConcern,
    customSplitText: equitySplit === "custom" ? customSplitText : undefined,
    contributionBalance: optionalEnum(
      value.contributionBalance,
      CONTRIBUTION_BALANCES,
    ) as DiagnosticInputs["contributionBalance"],
    commitmentLevel: optionalEnum(
      value.commitmentLevel,
      COMMITMENT_LEVELS,
    ) as DiagnosticInputs["commitmentLevel"],
    decisionProtocol: optionalEnum(
      value.decisionProtocol,
      DECISION_PROTOCOLS,
    ) as DiagnosticInputs["decisionProtocol"],
    salaryExpectation: optionalEnum(
      value.salaryExpectation,
      SALARY_EXPECTATIONS,
    ) as DiagnosticInputs["salaryExpectation"],
    workingHistory: optionalEnum(
      value.workingHistory,
      WORKING_HISTORIES,
    ) as DiagnosticInputs["workingHistory"],
    departureTerms: optionalEnum(
      value.departureTerms,
      DEPARTURE_TERMS,
    ) as DiagnosticInputs["departureTerms"],
  };
}

function boundedText(value: unknown, limit = 600): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > limit) return null;
  return text;
}

function boundedStringArray(value: unknown, limit = 6, textLimit = 400): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, limit)
    .map((item) => boundedText(item, textLimit))
    .filter((item): item is string => item !== null);
}

function sanitizeInterconnected(value: unknown): InterconnectedRisk[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 6)
    .flatMap((item): InterconnectedRisk[] => {
      if (!isRecord(item)) return [];
      const title = boundedText(item.title, 160);
      const impact = boundedText(item.impact, 700);
      if (!title || !impact) return [];
      return [{
        title,
        impact,
        factors: boundedStringArray(item.factors, 6, 160),
      }];
    });
}

function sanitizeContradictions(value: unknown): ContradictionItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 6)
    .flatMap((item): ContradictionItem[] => {
      if (!isRecord(item)) return [];
      const detectedMismatch = boundedText(item.detectedMismatch, 220);
      const evidence = boundedText(item.evidence, 500);
      const implication = boundedText(item.implication, 500);
      if (!detectedMismatch || !evidence || !implication) return [];
      return [{ detectedMismatch, evidence, implication }];
    });
}

function sanitizeWeaknesses(value: unknown): OverlookedWeakness[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 6)
    .flatMap((item): OverlookedWeakness[] => {
      if (!isRecord(item)) return [];
      const weakness = boundedText(item.weakness, 220);
      const whyItMatters = boundedText(item.whyItMatters, 500);
      const actionToAddress = boundedText(item.actionToAddress, 500);
      if (!weakness || !whyItMatters || !actionToAddress) return [];
      return [{ weakness, whyItMatters, actionToAddress }];
    });
}

export async function POST(req: Request) {
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number(contentLength) > 16000) {
    return NextResponse.json(
      { success: false, fallback: true, message: "Request payload is too large." },
      { status: 413 },
    );
  }

  let body: AnalyzeRequestBody;
  try {
    body = (await req.json()) as AnalyzeRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, fallback: true, message: "Invalid JSON request payload." },
      { status: 400 },
    );
  }

  if (body?.aiConsent !== true) {
    return NextResponse.json(
      {
        success: false,
        fallback: true,
        message: "Gemini analysis requires explicit user consent.",
      },
      { status: 400 },
    );
  }

  const inputs = validateInputs(body.inputs);
  if (!inputs) {
    return NextResponse.json(
      {
        success: false,
        fallback: true,
        message: "Invalid diagnostic payload.",
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      fallback: true,
      message: "Gemini is not configured on the server.",
    });
  }

  const deterministic = runDiagnostic(inputs);
  const prompt = `You are a specialized co-founder equity and partnership risk analyst.
Use only the submitted facts below. Do not invent facts or change the numerical risk score.
Return valid JSON only, with no markdown fences.

FOUNDER INPUTS:
- Equity Split: ${inputs.equitySplit}${inputs.customSplitText ? ` (${inputs.customSplitText})` : ""}
- Contribution Balance: ${inputs.contributionBalance || "Not specified"}
- Time Commitment: ${inputs.commitmentLevel || "Not specified"}
- Decision Protocol: ${inputs.decisionProtocol || "Not specified"}
- Personal Runway: ${inputs.runwayMonths} months
- Salary Expectations: ${inputs.salaryExpectation || "Not specified"}
- Working History: ${inputs.workingHistory || "Not specified"}
- Vesting: ${inputs.vesting}
- Departure/IP Terms: ${inputs.departureTerms || "Not specified"}
- Primary Concern: "${inputs.primaryConcern}"

DETERMINISTIC CONTEXT (not to be modified):
- Score: ${deterministic.score}%
- Level: ${deterministic.level}
- Signals: ${deterministic.explanations?.join(" | ") || "None"}

Return this exact shape:
{"executiveSummary":"string","interconnectedRisks":[{"title":"string","impact":"string","factors":["string"]}],"contradictions":[{"detectedMismatch":"string","evidence":"string","implication":"string"}],"overlookedWeaknesses":[{"weakness":"string","whyItMatters":"string","actionToAddress":"string"}],"prioritizedActions":{"immediate":["string"],"beforeSigning":["string"],"longTermMonitoring":["string"],"needsClarification":["string"]},"discussionQuestions":["string"],"customizedScript":"string"}

Identify only 2-4 items in each list where supported. Keep text concise and strictly grounded in the submitted answers.`;

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const geminiRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 1536,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

    if (!geminiRes.ok) {
      const retryAfter = geminiRes.headers.get("retry-after");
      const headers = new Headers();
      if (geminiRes.status === 429 && retryAfter) {
        headers.set("retry-after", retryAfter);
      }

      console.warn(
        `[Blindspot AI] Gemini request failed with status ${geminiRes.status}.`,
      );

      return NextResponse.json(
        {
          success: false,
          fallback: true,
          message:
            geminiRes.status === 429
              ? "Gemini is temporarily rate limited. Using the deterministic diagnostic."
              : "Gemini analysis is unavailable. Using the deterministic diagnostic.",
        },
        {
          status: geminiRes.status === 429 ? 429 : 502,
          headers,
        },
      );
    }

    let geminiData: unknown;
    try {
      geminiData = await geminiRes.json();
    } catch {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: "Gemini returned an invalid response.",
      });
    }

    if (!isRecord(geminiData)) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: "Gemini returned an invalid response.",
      });
    }

    const candidates = geminiData.candidates;
    if (!Array.isArray(candidates) || !isRecord(candidates[0])) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: "Gemini returned no analysis.",
      });
    }

    const content = candidates[0].content;
    if (!isRecord(content) || !Array.isArray(content.parts) || !isRecord(content.parts[0])) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: "Gemini returned no analysis.",
      });
    }

    const rawContent =
      typeof content.parts[0].text === "string"
        ? content.parts[0].text.trim()
        : "";
    if (!rawContent || rawContent.length > 12000) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: "Gemini returned an invalid analysis.",
      });
    }

    const cleanJson = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      console.warn("[Blindspot AI] Gemini response was not valid JSON.");
      return NextResponse.json({
        success: false,
        fallback: true,
        message: "Gemini returned an invalid response format.",
      });
    }

    if (!isRecord(parsed)) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: "Gemini returned an invalid analysis.",
      });
    }

    const prioritized = isRecord(parsed.prioritizedActions)
      ? parsed.prioritizedActions
      : {};

    const prioritizedActions: PrioritizedActions = {
      immediate: boundedStringArray(prioritized.immediate),
      beforeSigning: boundedStringArray(prioritized.beforeSigning),
      longTermMonitoring: boundedStringArray(prioritized.longTermMonitoring),
      needsClarification: boundedStringArray(prioritized.needsClarification),
    };

    const validatedAnalysis: AIAnalysisResult = {
      isAIGenerated: true,
      modelUsed: model,
      executiveSummary:
        boundedText(parsed.executiveSummary, 1200) || deterministic.summary,
      interconnectedRisks: sanitizeInterconnected(parsed.interconnectedRisks),
      contradictions: sanitizeContradictions(parsed.contradictions),
      overlookedWeaknesses: sanitizeWeaknesses(parsed.overlookedWeaknesses),
      prioritizedActions,
      discussionQuestions: boundedStringArray(
        parsed.discussionQuestions,
        6,
        500,
      ),
      customizedScript:
        boundedText(parsed.customizedScript, 2000) || deterministic.script,
    };

    return NextResponse.json({
      success: true,
      analysis: validatedAnalysis,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("[Blindspot AI] Gemini request timed out.");
      return NextResponse.json(
        {
          success: false,
          fallback: true,
          message: "Gemini analysis timed out. Using the deterministic diagnostic.",
        },
        { status: 504 },
      );
    }

    console.warn("[Blindspot AI] Gemini request failed.");
    return NextResponse.json(
      {
        success: false,
        fallback: true,
        message: "Gemini analysis failed. Using the deterministic diagnostic.",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
