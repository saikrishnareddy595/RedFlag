"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, FileSearch, Inbox } from "lucide-react";
import { Logo } from "@/components/Logo";
import { RiskFlag } from "@/components/RiskFlag";
import { RiskSummary } from "@/components/RiskSummary";
import { DownloadReport } from "@/components/DownloadReport";
import { CONTRACT_TYPES, type AnalysisResult, type Severity } from "@/lib/types";

type FilterValue = "all" | Severity;

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<FilterValue>("all");

  useEffect(() => {
    const raw = sessionStorage.getItem("redflag:result");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setResult(JSON.parse(raw) as AnalysisResult);
    } catch {
      router.replace("/");
      return;
    }
    setHydrated(true);
  }, [router]);

  const sortedFlags = useMemo(() => {
    if (!result) return [];
    return [...result.flags].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    );
  }, [result]);

  const visibleFlags = useMemo(
    () =>
      filter === "all"
        ? sortedFlags
        : sortedFlags.filter((f) => f.severity === filter),
    [sortedFlags, filter],
  );

  const counts = useMemo(() => {
    const base: Record<FilterValue, number> = {
      all: sortedFlags.length,
      high: 0,
      medium: 0,
      low: 0,
    };
    for (const f of sortedFlags) base[f.severity] += 1;
    return base;
  }, [sortedFlags]);

  if (!hydrated || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <FileSearch size={28} className="animate-pulse text-zinc-600" />
      </div>
    );
  }

  const typeLabel =
    CONTRACT_TYPES.find((t) => t.value === result.contract_type)?.label ??
    result.contract_type;

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink-950/70 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={17} />
            New analysis
          </button>
          <Logo size={28} />
        </div>
      </header>

      <main className="container-page space-y-6 py-8 sm:py-10">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-semibold text-zinc-300">
            {typeLabel}
          </span>
          <span>·</span>
          <span>{result.flags.length} clauses flagged</span>
        </div>

        <RiskSummary result={result} />

        {/* Filter bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`relative rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  filter === f.value ? "text-ink-950" : "text-zinc-400 hover:text-white"
                }`}
              >
                {filter === f.value && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 rounded-lg bg-white"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  {f.label}
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      filter === f.value ? "bg-ink-950/15 text-ink-950" : "bg-white/10 text-zinc-400"
                    }`}
                  >
                    {counts[f.value]}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="hidden sm:block">
            <DownloadReport result={result} />
          </div>
        </div>

        {/* Flags list */}
        {visibleFlags.length > 0 ? (
          <div className="space-y-4">
            {visibleFlags.map((flag, i) => (
              <RiskFlag key={flag.id} flag={flag} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] py-16 text-center">
            <Inbox size={32} className="mb-3 text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-200">
              No {filter !== "all" ? filter : ""} risk flags
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {sortedFlags.length === 0
                ? "The AI did not flag any clauses in this contract."
                : "Try a different severity filter."}
            </p>
          </div>
        )}

        {/* Mobile download button */}
        <div className="pt-2 sm:hidden">
          <DownloadReport result={result} />
        </div>
      </main>
    </div>
  );
}
