import type { AnalysisResult } from "./types";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "meta/llama-3.1-70b-instruct";

const SYSTEM_PROMPT = `You are a legal risk analyst AI. Analyze contracts and return ONLY a valid JSON object with no markdown, no explanation outside the JSON. Return this exact structure:
{
  "flags": [
    {
      "id": "1",
      "clause_text": "exact text from contract",
      "severity": "high|medium|low",
      "explanation": "plain English explanation",
      "suggestion": "negotiate|clarify|remove|accept",
      "reason_for_suggestion": "why this action"
    }
  ],
  "overall_risk_score": 0-100,
  "overall_summary": "2-3 sentence summary",
  "contract_type": "type passed in",
  "disclaimer": "This analysis is AI-generated guidance only and does not constitute legal advice. Consult a qualified attorney before signing."
}

Rules:
- "severity" must be exactly one of: high, medium, low.
- "suggestion" must be exactly one of: negotiate, clarify, remove, accept.
- "overall_risk_score" is an integer from 0 (no risk) to 100 (extremely risky).
- Quote clause_text verbatim from the contract where possible.
- Flag every risky, unusual, one-sided, ambiguous, or unfair clause.
- Return ONLY the JSON object. Do not wrap it in markdown fences.`;

/**
 * Strips markdown code fences and any leading/trailing prose the model may
 * have added around the JSON payload, then returns the JSON substring.
 */
function extractJson(raw: string): string {
  let text = raw.trim();

  // Remove ```json ... ``` or ``` ... ``` fences if present.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Fall back to slicing from the first { to the last } so any stray
  // commentary around the object is discarded.
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    text = text.slice(first, last + 1);
  }

  return text;
}

export class NvidiaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NvidiaError";
  }
}

/**
 * Calls the NVIDIA NIM chat completions endpoint to analyze a contract and
 * returns a parsed, validated AnalysisResult.
 *
 * The NVIDIA_API_KEY is read from the server environment and never exposed to
 * the client. This function must only ever run server-side.
 */
export async function analyzeContract(
  contractText: string,
  contractType: string,
): Promise<AnalysisResult> {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey || apiKey === "your_nvidia_nim_key_here") {
    throw new NvidiaError(
      "The NVIDIA API key is not configured. Add NVIDIA_API_KEY to your environment.",
    );
  }

  const userMessage = `Contract Type: ${contractType}
Analyze this contract and flag all risky, unusual, or one-sided clauses:

${contractText}`;

  let response: Response;
  try {
    response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 3000,
        temperature: 0.2,
        top_p: 0.9,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });
  } catch (err) {
    throw new NvidiaError(
      `Could not reach the NVIDIA NIM service. ${
        err instanceof Error ? err.message : "Unknown network error."
      }`,
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new NvidiaError(
      `NVIDIA NIM API returned ${response.status} ${response.statusText}. ${detail.slice(
        0,
        300,
      )}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new NvidiaError("The NVIDIA NIM API returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(content));
  } catch {
    throw new NvidiaError(
      "The AI returned a response that could not be parsed as JSON. Please try again.",
    );
  }

  return normalizeResult(parsed, contractType);
}

const VALID_SEVERITY = new Set(["high", "medium", "low"]);
const VALID_SUGGESTION = new Set(["negotiate", "clarify", "remove", "accept"]);
const DEFAULT_DISCLAIMER =
  "This analysis is AI-generated guidance only and does not constitute legal advice. Consult a qualified attorney before signing.";

/**
 * Validates and coerces the raw parsed JSON into a well-formed AnalysisResult,
 * guarding against missing fields or out-of-range values from the model.
 */
function normalizeResult(parsed: unknown, contractType: string): AnalysisResult {
  if (typeof parsed !== "object" || parsed === null) {
    throw new NvidiaError("The AI response was not a valid analysis object.");
  }

  const obj = parsed as Record<string, unknown>;
  const rawFlags = Array.isArray(obj.flags) ? obj.flags : [];

  const flags = rawFlags.map((flag, index) => {
    const f = (typeof flag === "object" && flag !== null ? flag : {}) as Record<
      string,
      unknown
    >;
    const severity = String(f.severity ?? "").toLowerCase();
    const suggestion = String(f.suggestion ?? "").toLowerCase();

    return {
      id: String(f.id ?? index + 1),
      clause_text: String(f.clause_text ?? "").trim(),
      severity: (VALID_SEVERITY.has(severity) ? severity : "medium") as
        | "high"
        | "medium"
        | "low",
      explanation: String(f.explanation ?? "").trim(),
      suggestion: (VALID_SUGGESTION.has(suggestion) ? suggestion : "clarify") as
        | "negotiate"
        | "clarify"
        | "remove"
        | "accept",
      reason_for_suggestion: String(f.reason_for_suggestion ?? "").trim(),
    };
  });

  const rawScore = Number(obj.overall_risk_score);
  const overall_risk_score = Number.isFinite(rawScore)
    ? Math.max(0, Math.min(100, Math.round(rawScore)))
    : 0;

  return {
    flags,
    overall_risk_score,
    overall_summary: String(obj.overall_summary ?? "").trim(),
    contract_type: String(obj.contract_type ?? contractType),
    disclaimer: String(obj.disclaimer ?? DEFAULT_DISCLAIMER).trim() || DEFAULT_DISCLAIMER,
  };
}
