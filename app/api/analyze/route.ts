import { NextResponse } from "next/server";
import { analyzeContract, NvidiaError } from "@/lib/nvidia";
import { MAX_CONTRACT_CHARS, type AnalyzeRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: Partial<AnalyzeRequest>;

  try {
    body = (await request.json()) as Partial<AnalyzeRequest>;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON." },
      { status: 400 },
    );
  }

  const contractText = typeof body.contract_text === "string" ? body.contract_text.trim() : "";
  const contractType = typeof body.contract_type === "string" ? body.contract_type.trim() : "";

  if (!contractText) {
    return NextResponse.json(
      { error: "Contract text is required." },
      { status: 400 },
    );
  }

  if (!contractType) {
    return NextResponse.json(
      { error: "Contract type is required." },
      { status: 400 },
    );
  }

  if (contractText.length > MAX_CONTRACT_CHARS) {
    return NextResponse.json(
      {
        error: `Contract text exceeds the ${MAX_CONTRACT_CHARS.toLocaleString()} character limit.`,
      },
      { status: 400 },
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[analyze] type=${contractType} length=${contractText.length} chars`,
    );
  }

  try {
    const result = await analyzeContract(contractText, contractType);

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[analyze] success: ${result.flags.length} flags, score=${result.overall_risk_score}`,
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[analyze] error:", err);

    const message =
      err instanceof NvidiaError
        ? err.message
        : "Something went wrong while analyzing the contract. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
