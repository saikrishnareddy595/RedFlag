"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  FileCheck2,
  Gauge,
  Lock,
  LogOut,
  Menu,
  Minus,
  Plus,
  ScanSearch,
  ShieldCheck,
  Star,
  Wand2,
  X,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
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

      const rawBody = await response.text();
      let data: (AnalysisResult & { error?: string }) | null = null;
      try {
        data = rawBody ? (JSON.parse(rawBody) as AnalysisResult & { error?: string }) : null;
      } catch {
        data = null;
      }

      if (!response.ok || !data) {
        const message =
          data?.error ||
          (response.status === 504 || response.status === 408 || response.status === 0
            ? "The analysis timed out. The model took too long to respond — please try again, or use a shorter contract."
            : `Analysis failed (HTTP ${response.status || "network error"}). Please try again.`);
        throw new Error(message);
      }

      sessionStorage.setItem("redflag:result", JSON.stringify(data));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
      clearInterval(interval);
    }
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <Navbar />
      <main>
        <Hero />
        <Logos />
        <Analyzer
          contractText={contractText}
          contractType={contractType}
          file={file}
          isLoading={isLoading}
          error={error}
          canAnalyze={canAnalyze}
          onTextChange={setContractText}
          onTypeChange={setContractType}
          onFileChange={setFile}
          onAnalyze={handleAnalyze}
        />
        <TrustStats />
        <Features />
        <Testimonials />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <AnimatePresence>{isLoading && <LoadingOverlay message={loadingMsg} />}</AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */

function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const displayName = session?.user?.name || session?.user?.email || "Account";
  const initials = displayName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/70 backdrop-blur-xl">
      <div className="section flex h-16 items-center justify-between">
        <a href="#top">
          <Logo size={30} />
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {authed ? (
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="max-w-[140px] truncate text-sm font-medium text-zinc-200">
                  {displayName}
                </span>
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Sign in
              </Link>
              <a href="#analyze" className="btn-primary">
                Analyze a contract
                <ArrowRight size={16} />
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/10 bg-ink-950 md:hidden"
          >
            <div className="section flex flex-col gap-1 py-3">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5"
                >
                  {l.label}
                </a>
              ))}
              {authed ? (
                <>
                  <div className="mt-1 flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white">
                      {initials}
                    </span>
                    <span className="truncate text-sm font-medium text-zinc-200">
                      {displayName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="btn-secondary mt-1 w-full"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn-secondary mt-1 w-full"
                  >
                    Sign in
                  </Link>
                  <a href="#analyze" onClick={() => setOpen(false)} className="btn-primary w-full">
                    Analyze a contract
                  </a>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora animate-aurora absolute inset-0 opacity-80" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.4] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[600px] spotlight" />
        <div className="absolute left-[8%] top-[22%] h-2.5 w-2.5 animate-float rounded-full bg-brand-400/70" />
        <div className="absolute right-[12%] top-[32%] h-2 w-2 animate-float-slow rounded-full bg-sky-400/60" />
        <div className="absolute left-[22%] bottom-[16%] h-1.5 w-1.5 animate-float rounded-full bg-amber-400/60" />
      </div>

      <div className="section grid items-center gap-12 pb-20 pt-16 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center lg:text-left"
        >
          <span className="eyebrow">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            AI Contract Risk Review
          </span>

          <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Read <span className="text-gradient">between</span>
            <br className="hidden sm:block" /> the lines.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-zinc-400 lg:mx-0">
            RedFlag reviews any contract in seconds — surfacing risky clauses, ranking them by
            severity, and explaining each in plain English. Know exactly what you&apos;re
            signing.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <a href="#analyze" className="btn-primary group px-7 py-3.5 text-base">
              <Wand2 size={18} />
              Analyze a contract
              <ArrowRight
                size={18}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </a>
            <a href="#how" className="btn-ghost text-base">
              See how it works
            </a>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <RatingBadge platform="G2" score="4.9" />
            <RatingBadge platform="Capterra" score="4.8" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-zinc-500 lg:justify-start">
            <span className="inline-flex items-center gap-1.5">
              <Lock size={15} className="text-brand-400" /> Nothing stored
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} className="text-brand-400" /> Results in seconds
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck2 size={15} className="text-brand-400" /> PDF reports
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroPreview />
        </motion.div>
      </div>
    </section>
  );
}

function RatingBadge({ platform, score }: { platform: string; score: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5">
      <span className="flex">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
        ))}
      </span>
      <span className="text-xs font-semibold text-zinc-200">{score}</span>
      <span className="text-xs text-zinc-500">on {platform}</span>
    </div>
  );
}

/** Self-running, looping mock of RedFlag analyzing a contract. */
function HeroPreview() {
  const FLAGS = [
    {
      text: "Landlord may enter the premises at any time without notice.",
      action: "Negotiate",
      dot: "bg-red-500",
      chip: "bg-red-500/15 text-red-300 border-red-500/30",
      bar: "bg-red-500",
    },
    {
      text: "Tenant waives all rights to a security-deposit refund.",
      action: "Remove",
      dot: "bg-red-500",
      chip: "bg-red-500/15 text-red-300 border-red-500/30",
      bar: "bg-red-500",
    },
    {
      text: "Lease auto-renews for 5 years with a $5,000 penalty.",
      action: "Clarify",
      dot: "bg-amber-400",
      chip: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      bar: "bg-amber-400",
    },
  ];
  const SCORES = [0, 34, 61, 82];

  const [visible, setVisible] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setVisible((v) => (v >= FLAGS.length ? 0 : v + 1)), 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const score = useEase(SCORES[visible]);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const scoreColor = score > 70 ? "#f43f5e" : score >= 40 ? "#eab308" : "#22c55e";

  return (
    <div className="relative mx-auto max-w-md">
      <div className="absolute -inset-6 -z-10 spotlight blur-2xl" />

      <div className="absolute -left-4 top-10 z-10 hidden animate-float rounded-xl border border-white/10 bg-ink-800/90 px-3 py-2 shadow-elevated backdrop-blur sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Flags found
        </p>
        <p className="text-lg font-bold text-white">{visible}</p>
      </div>
      <div className="absolute -right-3 bottom-16 z-10 hidden animate-float-slow items-center gap-2 rounded-xl border border-white/10 bg-ink-800/90 px-3 py-2 shadow-elevated backdrop-blur sm:flex">
        <ShieldCheck size={16} className="text-green-400" />
        <span className="text-xs font-semibold text-zinc-200">Privacy-first</span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900/80 shadow-elevated backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-brand-400">
              <FileCheck2 size={15} />
            </span>
            <span className="text-sm font-semibold text-zinc-200">Lease_Agreement.pdf</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            Analyzing
          </span>
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="7" className="stroke-white/10" />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  strokeWidth="7"
                  strokeLinecap="round"
                  stroke={scoreColor}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                {score}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Overall risk
              </p>
              <p className="text-sm font-medium text-zinc-300">
                {score > 70
                  ? "High risk — review before signing"
                  : score >= 40
                    ? "Moderate risk detected"
                    : "Scanning clauses…"}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {FLAGS.slice(0, visible).map((f) => (
                <motion.div
                  key={f.text}
                  layout
                  initial={{ opacity: 0, x: 12, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3 pl-4"
                >
                  <span className={`absolute inset-y-0 left-0 w-1 ${f.bar}`} />
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${f.dot}`} />
                      <p className="text-xs leading-relaxed text-zinc-300">{f.text}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${f.chip}`}>
                      {f.action}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {visible < FLAGS.length && (
              <div className="shimmer rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 pl-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2/3 rounded bg-white/10" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Eases a displayed integer toward `target` whenever it changes. */
function useEase(target: number, ms = 650): number {
  const [value, setValue] = useState(target);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = value;
    const tick = (now: number) => {
      const p = Math.min((now - start) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ms]);
  return value;
}

/* ------------------------------------------------------------------ */
/* Logo marquee                                                        */
/* ------------------------------------------------------------------ */

function Logos() {
  const names = ["Northwind", "Lumen", "Vertex", "Quantix", "Hadley & Co", "Brightway", "Meridian", "Cobalt"];
  const loop = [...names, ...names];
  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="section py-8">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Trusted by individuals and teams everywhere
        </p>
        <div className="marquee-mask mt-6 overflow-hidden">
          <div className="flex w-max animate-marquee items-center gap-12">
            {loop.map((n, i) => (
              <span
                key={`${n}-${i}`}
                className="whitespace-nowrap text-lg font-bold tracking-tight text-zinc-600 transition-colors hover:text-zinc-300"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Analyzer                                                            */
/* ------------------------------------------------------------------ */

interface AnalyzerProps {
  contractText: string;
  contractType: string;
  file: File | null;
  isLoading: boolean;
  error: string | null;
  canAnalyze: boolean;
  onTextChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onFileChange: (f: File | null) => void;
  onAnalyze: () => void;
}

function Analyzer({
  contractText,
  contractType,
  file,
  isLoading,
  error,
  canAnalyze,
  onTextChange,
  onTypeChange,
  onFileChange,
  onAnalyze,
}: AnalyzerProps) {
  return (
    <section id="analyze" className="scroll-mt-20 py-20 sm:py-24">
      <div className="section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-elevated backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-6 py-4 sm:px-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-brand-400">
              <ScanSearch size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">Review a contract</h2>
              <p className="text-xs text-zinc-500">Pick a type, add your text, and analyze.</p>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <ContractTypeSelector value={contractType} onChange={onTypeChange} />
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-200">Your contract</label>
              <ContractUpload
                text={contractText}
                file={file}
                onTextChange={onTextChange}
                onFileChange={onFileChange}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-red-300">Analysis failed</p>
                  <p className="text-sm text-red-200/80">{error}</p>
                </div>
              </motion.div>
            )}

            <button
              type="button"
              onClick={onAnalyze}
              disabled={!canAnalyze || isLoading}
              className="btn-primary w-full py-4 text-base"
            >
              {isLoading ? (
                "Analyzing your contract…"
              ) : (
                <>
                  <Wand2 size={18} />
                  Analyze Contract
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {!canAnalyze && !isLoading && (
              <p className="text-center text-xs text-zinc-500">
                Select a contract type and add your contract to begin.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust stats                                                         */
/* ------------------------------------------------------------------ */

function TrustStats() {
  const stats = [
    { to: 25000, prefix: "", suffix: "+", label: "Contracts reviewed" },
    { to: 100, prefix: "", suffix: "%", label: "Processed privately" },
    { to: 3, prefix: "", suffix: "", label: "Severity levels ranked" },
    { to: 30, prefix: "<", suffix: "s", label: "Average review time" },
  ];
  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="section grid grid-cols-2 gap-6 py-12 md:grid-cols-4">
        {stats.map((s, i) => (
          <CountStat key={s.label} {...s} delay={i * 0.05} />
        ))}
      </div>
    </section>
  );
}

function CountStat({
  to,
  prefix,
  suffix,
  label,
  delay,
}: {
  to: number;
  prefix: string;
  suffix: string;
  label: string;
  delay: number;
}) {
  const [active, setActive] = useState(false);
  const value = useEase(active ? to : 0, 1100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay }}
      onViewportEnter={() => setActive(true)}
      className="text-center"
    >
      <p className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

function Features() {
  const features = [
    {
      icon: <LogoMark size={20} />,
      title: "Clause-level red flags",
      desc: "Every risky, unusual, or one-sided clause is identified and quoted directly from your contract.",
    },
    {
      icon: <Gauge size={20} />,
      title: "Severity scoring",
      desc: "High, medium, and low risk badges plus an overall 0–100 score so you know where to focus.",
    },
    {
      icon: <Wand2 size={20} />,
      title: "Plain-English advice",
      desc: "Clear explanations and a recommended action — negotiate, clarify, remove, or accept.",
    },
    {
      icon: <FileCheck2 size={20} />,
      title: "Downloadable reports",
      desc: "Export a polished, multi-page PDF report to share with your team or your attorney.",
    },
    {
      icon: <Lock size={20} />,
      title: "Private by design",
      desc: "Files are parsed in your browser and contract text is never stored on our servers.",
    },
    {
      icon: <ShieldCheck size={20} />,
      title: "Any contract type",
      desc: "Leases, NDAs, employment, freelance, SaaS terms, and more — tuned per contract type.",
    },
  ];
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="section">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to review with confidence"
          subtitle="RedFlag reads contracts the way a careful lawyer would — then explains the risks in language anyone can act on."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400 transition-colors group-hover:bg-brand-500/25">
                {f.icon}
              </span>
              <h3 className="text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */

const TESTIMONIALS = [
  {
    quote:
      "RedFlag caught an auto-renewal clause with a hefty penalty that I'd completely glossed over. It paid for itself before I even signed.",
    name: "Sarah Chen",
    role: "Freelance Product Designer",
    initials: "SC",
    tint: "bg-brand-500/20 text-brand-300",
  },
  {
    quote:
      "We run every vendor agreement through RedFlag before it reaches legal. The severity ranking tells us exactly where to focus.",
    name: "Marcus Reyes",
    role: "Operations Lead, Lumen",
    initials: "MR",
    tint: "bg-sky-500/20 text-sky-300",
  },
  {
    quote:
      "As a first-time renter, the plain-English explanations were a lifesaver. It flagged a no-notice entry clause I would have signed.",
    name: "Priya Natarajan",
    role: "First-time Renter",
    initials: "PN",
    tint: "bg-emerald-500/20 text-emerald-300",
  },
];

function Testimonials() {
  return (
    <section className="border-t border-white/10 bg-white/[0.02] py-20 sm:py-28">
      <div className="section">
        <SectionHeading
          eyebrow="Testimonials"
          title="Loved by people who read the fine print"
          subtitle="From first-time renters to operations teams, RedFlag turns dense legalese into clear, confident decisions."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-7"
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-zinc-300">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${t.tint}`}>
                  {t.initials}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{t.name}</span>
                  <span className="block text-xs text-zinc-500">{t.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Add your contract",
      desc: "Paste the text or upload a PDF, DOCX, or TXT file and choose the contract type.",
    },
    {
      n: "02",
      title: "AI reviews every clause",
      desc: "Our model flags risky terms, ranks them by severity, and explains what each one means.",
    },
    {
      n: "03",
      title: "Act & download",
      desc: "Filter by severity, read the suggested actions, and export a shareable PDF report.",
    },
  ];
  return (
    <section id="how" className="scroll-mt-20 py-20 sm:py-28">
      <div className="section">
        <SectionHeading
          eyebrow="How it works"
          title="From contract to clarity in three steps"
          subtitle="No setup, no account hoops, no legalese — just answers."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-7"
            >
              <span className="font-display text-4xl font-bold text-brand-500/40">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <a href="#analyze" className="btn-dark px-7 py-3.5 text-base">
            Try it now — it&apos;s free
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "Is this legal advice?",
    a: "No. RedFlag provides AI-generated guidance to help you understand a contract. It does not constitute legal advice — always consult a qualified attorney before signing.",
  },
  {
    q: "Is my contract data stored?",
    a: "No. Uploaded files are parsed in your browser, and the extracted text is processed in-memory to generate your analysis and then discarded. We don't store your contracts.",
  },
  {
    q: "What file types are supported?",
    a: "You can paste plain text or upload PDF, DOCX, or TXT files up to 50,000 characters. Scanned PDFs without selectable text aren't supported.",
  },
  {
    q: "Which AI model powers RedFlag?",
    a: "RedFlag runs on Meta's Llama 3.1 served through the NVIDIA NIM API, with prompts tuned specifically for contract risk analysis.",
  },
  {
    q: "How much does it cost?",
    a: "RedFlag is free to use for contract review. Bring your own NVIDIA NIM API key to self-host it without limits.",
  },
];

function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-20 border-t border-white/10 bg-white/[0.02] py-20 sm:py-28">
      <div className="section max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <div className="mt-10 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {FAQS.map((item, i) => {
            const open = openIdx === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <span className="text-sm font-semibold text-white sm:text-base">{item.q}</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-400">
                    {open ? <Minus size={15} /> : <Plus size={15} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-zinc-400">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="py-24">
      <div className="section">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-ink-800 to-ink-900 px-6 py-16 text-center shadow-elevated sm:px-12">
          <div className="pointer-events-none absolute inset-0 spotlight" />
          <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Don&apos;t sign blind. Read between the lines.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-balance text-zinc-400">
              Get a clear, severity-ranked breakdown of any contract in seconds — free.
            </p>
            <div className="mt-8 flex justify-center">
              <a href="#analyze" className="btn-primary group px-8 py-4 text-base">
                <Wand2 size={18} />
                Analyze a contract now
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <Lock size={13} className="text-brand-400" /> Encrypted in transit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-brand-400" /> No data retention
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileCheck2 size={13} className="text-brand-400" /> GDPR-aligned
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-sm font-bold uppercase tracking-wider text-brand-400">{eyebrow}</span>
      <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-balance text-lg leading-relaxed text-zinc-400">{subtitle}</p>}
    </div>
  );
}

function LoadingOverlay({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/10 bg-ink-900 p-8 text-center shadow-elevated"
      >
        <span className="relative flex h-14 w-14 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/30" />
          <ScanSearch size={32} className="text-brand-400" />
        </span>
        <div>
          <p className="text-base font-semibold text-white">{message}</p>
          <p className="mt-1 text-sm text-zinc-500">This usually takes a few seconds.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-white/[0.02]">
      <div className="section py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div className="max-w-xs text-center md:text-left">
            <div className="flex justify-center md:justify-start">
              <Logo size={28} />
            </div>
            <p className="mt-3 text-sm font-medium text-brand-400">Read between the lines.</p>
            <p className="mt-2 text-sm text-zinc-500">
              AI contract risk review that explains the fine print before you sign.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white">
              Features
            </a>
            <a href="#how" className="text-sm font-medium text-zinc-400 hover:text-white">
              How it works
            </a>
            <a href="#faq" className="text-sm font-medium text-zinc-400 hover:text-white">
              FAQ
            </a>
            <a href="#analyze" className="text-sm font-medium text-zinc-400 hover:text-white">
              Analyze
            </a>
          </nav>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} RedFlag · AI-generated guidance, not legal advice.
          </p>
          <p className="text-xs text-zinc-600">Built with Next.js &amp; NVIDIA NIM</p>
        </div>
      </div>
    </footer>
  );
}
