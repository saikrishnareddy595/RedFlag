export type Severity = "high" | "medium" | "low";

export type Suggestion = "negotiate" | "clarify" | "remove" | "accept";

export interface RiskFlag {
  id: string;
  clause_text: string;
  severity: Severity;
  explanation: string;
  suggestion: Suggestion;
  reason_for_suggestion: string;
}

export interface AnalysisResult {
  flags: RiskFlag[];
  overall_risk_score: number; // 0–100
  overall_summary: string;
  contract_type: string;
  disclaimer: string;
}

export interface AnalyzeRequest {
  contract_text: string;
  contract_type: string;
}

export interface ContractTypeOption {
  value: string;
  label: string;
  description: string;
}

export const CONTRACT_TYPES: ContractTypeOption[] = [
  {
    value: "lease",
    label: "Lease / Rental Agreement",
    description: "Residential or commercial property leases",
  },
  {
    value: "nda",
    label: "Non-Disclosure Agreement (NDA)",
    description: "Confidentiality and secrecy agreements",
  },
  {
    value: "employment",
    label: "Employment Agreement",
    description: "Offer letters and employment contracts",
  },
  {
    value: "freelance",
    label: "Freelance / Independent Contractor",
    description: "Contractor and service agreements",
  },
  {
    value: "saas",
    label: "Software / SaaS Terms of Service",
    description: "Software licenses and ToS",
  },
  {
    value: "other",
    label: "Other Contract",
    description: "Any other type of legal agreement",
  },
];

export const MAX_CONTRACT_CHARS = 50_000;
