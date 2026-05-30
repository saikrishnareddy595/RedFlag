"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Flag,
  Gauge,
  Loader2,
  Lock,
  Sparkles,
  Wand2,
} from "lucide-react";
import { ContractTypeSelector } from "@/components/ContractTypeSelector";
import { ContractUpload } from "@/components/ContractUpload";
import { parseFile, parsePastedText } from "@/lib/parseContract";
import type { AnalysisResult } from "@/lib/types";

const LOADING_MESSAGES = [
  "Reading your contract…",
  "Identifying risky clauses…",
  "Ranking by severity…",
  "Drafting plain-English explanations…",
];

export default function HomePage() {
  const router = useRouter();
  const [contractText, setContractText] = useState("");
  const [contractType, setContractType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

  const canAnalyze = useMemo(
    () => Boolean(contractType) && (Boolean(file) || contractText.trim().length > 0),
    [contractType, file, contractText],
  );

  function cycleLoadingMessages() {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[i]);
    }, 2200);
    return interval;
  }

  async function handleAnalyze() {
    if (!canAnalyze || isLoading) return;
    setError(null);
    setIsLoading(true);
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = cycleLoadingMessages();

    try {
      const text = file ? await parseFile(file) : parsePastedText(contractText);

      if (!text.trim()) {
        throw new Error(
          "We couldn't find any text to analyze. Please check your file or paste the contract directly.",
        );
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract_text: text, contract_type: contractType }),
      });

      const data = (await response.json()) as AnalysisResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed. Please try again.");
      }

      sessionStorage.setItem("redflag:result", JSON.stringify(data));
      router.push("/results");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setIsLoading(false);
      clearInterval(interval);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900 to-slate-50" style={{ height: "520px" }} />
        <div className="absolute left-1/2 top-0 h-[520px] w-full max-w-5xl -translate-x-1/2 bg-radial-fade" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-grid-pattern [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <Header />

      <main className="container-page pb-24 pt-10 sm:pt-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
            <Sparkles size={13} className="text-brand-300" />
            Powered by NVIDIA NIM · Llama 3.1 70B
          </span>
          <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
            Spot the{" "}
            <span className="text-gradient">red flags</span> before you sign
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-navy-200 sm:text-lg">
            Paste or upload any contract and let AI surface risky clauses, rank
            them by severity, and explain each one in plain English — with an
            instant, downloadable risk report.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-navy-300">
            <span className="inline-flex items-center gap-1.5">
              <Lock size={13} className="text-brand-300" /> Never stored
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Gauge size={13} className="text-brand-300" /> Results in seconds
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Flag size={13} className="text-brand-300" /> Severity-ranked
            </span>
          </div>
        </motion.div>

        {/* Workspace card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-10 max-w-3xl"
        >
          <div className="glass-card p-6 sm:p-8">
            <div className="space-y-6">
              <ContractTypeSelector
                value={contractType}
                onChange={setContractType}
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-navy-700">
                  Your contract
                </label>
                <ContractUpload
                  text={contractText}
                  file={file}
                  onTextChange={setContractText}
                  onFileChange={setFile}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Analysis failed
                    </p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </motion.div>
              )}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!canAnalyze || isLoading}
                className="btn-primary w-full py-4 text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Analyzing your contract…
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Analyze Contract
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {!canAnalyze && !isLoading && (
                <p className="text-center text-xs text-navy-400">
                  Select a contract type and add your contract to begin.
                </p>
              )}
            </div>
          </div>

          <FeatureRow />
        </motion.div>
      </main>

      {isLoading && <LoadingOverlay message={loadingMsg} />}

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="relative z-20">
      <div className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-glow">
            <Flag size={18} className="text-white" fill="white" />
          </span>
          <div className="leading-none">
            <span className="text-lg font-bold tracking-tight text-white">
              Red<span className="text-brand-400">Flag</span>
            </span>
          </div>
        </div>
        <span className="hidden text-xs font-medium text-navy-300 sm:block">
          AI Contract Risk Scanner
        </span>
      </div>
    </header>
  );
}

function FeatureRow() {
  const features = [
    {
      icon: <Flag size={18} />,
      title: "Clause-level flags",
      desc: "Every risky or one-sided clause, called out individually.",
    },
    {
      icon: <Gauge size={18} />,
      title: "Severity scoring",
      desc: "High, medium, and low risk with a 0–100 overall score.",
    },
    {
      icon: <Wand2 size={18} />,
      title: "Plain-English advice",
      desc: "Clear suggestions: negotiate, clarify, remove, or accept.",
    },
  ];
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {features.map((f) => (
        <div
          key={f.title}
          className="rounded-2xl border border-navy-100 bg-white/70 p-5 shadow-soft backdrop-blur"
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            {f.icon}
          </span>
          <h3 className="text-sm font-semibold text-navy-900">{f.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-navy-500">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

function LoadingOverlay({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card mx-4 flex max-w-sm flex-col items-center gap-4 p-8 text-center"
      >
        <span className="relative flex h-14 w-14 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/30" />
          <Loader2 size={36} className="animate-spin text-brand-500" />
        </span>
        <div>
          <p className="text-base font-semibold text-navy-900">{message}</p>
          <p className="mt-1 text-sm text-navy-400">
            This usually takes 10–20 seconds.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-white/50">
      <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-center sm:flex-row sm:text-left">
        <p className="text-xs text-navy-400">
          © {new Date().getFullYear()} RedFlag · AI-generated guidance, not legal
          advice.
        </p>
        <p className="text-xs text-navy-400">
          Built with Next.js & NVIDIA NIM
        </p>
      </div>
    </footer>
  );
}
