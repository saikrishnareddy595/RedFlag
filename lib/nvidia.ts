import type { AnalysisResult } from "./types";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
// 8B instruct is fast and reliable on the free tier (a few seconds vs. 60–90s+
// for 70B, which frequently exceeds serverless timeouts). Override per-deploy
// with the NVIDIA_MODEL env var if you have higher rate limits.
const MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";

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

Rules (follow these EXACTLY):
- "severity" MUST be the lowercase string "high", "medium", or "low". NEVER a number, score, or any other value.
- "suggestion" MUST be the single lowercase word "negotiate", "clarify", "remove", or "accept". NEVER a sentence or phrase. Put any reasoning in "reason_for_suggestion".
- "id" is a string like "1", "2", "3".
- "overall_risk_score" is a single integer from 0 (no risk) to 100 (extremely risky).
- Quote clause_text verbatim from the contract where possible.
- Flag every risky, unusual, one-sided, ambiguous, or unfair clause.
- Return ONLY the JSON object. No markdown fences, no text before or after.`;

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
  // Prefer the environment variable (e.g. Vercel env vars); fall back to the
  // hardcoded testing key below. NOTE: this hardcoded key is for testing only
  // and should be rotated and replaced with NVIDIA_API_KEY in production.
  const FALLBACK_TESTING_KEY =
    "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";
  const apiKey = process.env.NVIDIA_API_KEY || FALLBACK_TESTING_KEY;

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
        max_tokens: 4000,
        temperature: 0.2,
        top_p: 0.9,
        // Force a JSON object response so the content is never wrapped in
        // markdown or surrounded by prose, eliminating parse failures.
        response_format: { type: "json_object" },
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
 * Coerces a model-supplied severity into one of high/medium/low. Handles the
 * canonical strings, numeric scores (0–10 or 0–100 scales), and free text.
 */
function coerceSeverity(raw: unknown): "high" | "medium" | "low" {
  if (typeof raw === "string") {
    const s = raw.toLowerCase().trim();
    if (VALID_SEVERITY.has(s)) return s as "high" | "medium" | "low";
    if (s.includes("high") || s.includes("critical") || s.includes("severe"))
      return "high";
    if (s.includes("med") || s.includes("moderate")) return "medium";
    if (s.includes("low") || s.includes("minor")) return "low";
  }
  const n = Number(raw);
  if (Number.isFinite(n)) {
    // Normalize a 0–10 scale to 0–100, then band it.
    const scaled = n <= 10 ? n * 10 : n;
    if (scaled >= 67) return "high";
    if (scaled >= 34) return "medium";
    return "low";
  }
  return "medium";
}

/**
 * Coerces a model-supplied suggestion into one of negotiate/clarify/remove/accept,
 * inferring intent from free-text recommendations when needed.
 */
function coerceSuggestion(
  raw: unknown,
): "negotiate" | "clarify" | "remove" | "accept" {
  const s = String(raw ?? "").toLowerCase();
  if (VALID_SUGGESTION.has(s)) return s as "negotiate" | "clarify" | "remove" | "accept";
  if (s.includes("negoti") || s.includes("revise") || s.includes("amend"))
    return "negotiate";
  if (s.includes("remov") || s.includes("delet") || s.includes("strike"))
    return "remove";
  if (s.includes("accept") || s.includes("ok") || s.includes("fine") || s.includes("standard"))
    return "accept";
  return "clarify";
}

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
    return {
      id: String(f.id ?? index + 1),
      clause_text: String(f.clause_text ?? "").trim(),
      severity: coerceSeverity(f.severity),
      explanation: String(f.explanation ?? "").trim(),
      suggestion: coerceSuggestion(f.suggestion),
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
