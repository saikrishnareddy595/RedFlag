"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  FileCheck2,
  Flag,
  Gauge,
  Lock,
  Menu,
  Minus,
  Plus,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Star,
  Wand2,
  X,
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

      // The server may return a non-JSON error page (e.g. a platform timeout),
      // so read as text and parse defensively to avoid cryptic JSON errors.
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
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setIsLoading(false);
      clearInterval(interval);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <Hero />

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
  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/80 backdrop-blur-xl">
      <div className="section flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-glow">
            <Flag size={18} className="text-white" fill="white" />
          </span>
          <span className="text-lg font-bold tracking-tight text-navy-900">
            Red<span className="text-brand-500">Flag</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-navy-600 transition-colors hover:text-navy-900"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a href="#analyze" className="btn-dark">
            Analyze a contract
            <ArrowRight size={16} />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-navy-700 md:hidden"
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
            className="overflow-hidden border-t border-navy-100 bg-white md:hidden"
          >
            <div className="section flex flex-col gap-1 py-3">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
                >
                  {l.label}
                </a>
              ))}
              <a href="#analyze" onClick={() => setOpen(false)} className="btn-dark mt-2 w-full">
                Analyze a contract
              </a>
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
      {/* soft ambient color */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute left-[12%] top-[20%] h-72 w-72 rounded-full bg-sky-100/50 blur-3xl" />
      </div>

      <div className="section pb-12 pt-16 text-center sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="eyebrow">
            <Sparkles size={13} className="text-brand-500" />
            AI Contract Risk Review · Powered by NVIDIA NIM
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-navy-900 sm:text-5xl md:text-6xl">
            Spot the <span className="text-gradient">red flags</span> before you sign
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-relaxed text-navy-500">
            Paste or upload any contract and let AI surface risky clauses, rank them by
            severity, and explain each one in plain English — with an instant, downloadable
            risk report.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#analyze" className="btn-primary px-7 py-3.5 text-base">
              <Wand2 size={18} />
              Analyze a contract
            </a>
            <a href="#how" className="btn-ghost text-base">
              See how it works
              <ArrowRight size={16} />
            </a>
          </div>

          {/* trust row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-navy-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                ))}
              </span>
              <span className="font-semibold text-navy-700">Plain-English clarity</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock size={15} className="text-brand-500" /> Private — nothing stored
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} className="text-brand-500" /> Results in seconds
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Analyzer (the functional tool)                                      */
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
    <section id="analyze" className="scroll-mt-20 pb-20">
      <div className="section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-elevated"
        >
          <div className="flex items-center gap-3 border-b border-navy-100 bg-navy-50/50 px-6 py-4 sm:px-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600 shadow-soft">
              <ScanSearch size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-navy-900">Review a contract</h2>
              <p className="text-xs text-navy-400">
                Pick a type, add your text, and analyze.
              </p>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <ContractTypeSelector value={contractType} onChange={onTypeChange} />

            <div>
              <label className="mb-2 block text-sm font-semibold text-navy-700">
                Your contract
              </label>
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
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Analysis failed</p>
                  <p className="text-sm text-red-600">{error}</p>
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
              <p className="text-center text-xs text-navy-400">
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
/* Trust stats strip                                                   */
/* ------------------------------------------------------------------ */

function TrustStats() {
  const stats = [
    { value: "3", label: "Severity levels ranked" },
    { value: "0–100", label: "Overall risk score" },
    { value: "Seconds", label: "Not hours of review" },
    { value: "100%", label: "Processed privately" },
  ];
  return (
    <section className="border-y border-navy-100 bg-navy-50/40">
      <div className="section grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-bold tracking-tight text-navy-900">{s.value}</p>
            <p className="mt-1 text-sm text-navy-500">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

function Features() {
  const features = [
    {
      icon: <Flag size={20} />,
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
    <section id="features" className="scroll-mt-20 py-20 sm:py-24">
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
              className="group rounded-2xl border border-navy-100 bg-white p-6 shadow-soft transition-shadow duration-300 hover:shadow-card"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                {f.icon}
              </span>
              <h3 className="text-base font-semibold text-navy-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">{f.desc}</p>
            </motion.div>
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
    <section id="how" className="scroll-mt-20 border-y border-navy-100 bg-navy-50/40 py-20 sm:py-24">
      <div className="section">
        <SectionHeading
          eyebrow="How it works"
          title="From contract to clarity in three steps"
          subtitle="No setup, no account, no legalese — just answers."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative rounded-2xl border border-navy-100 bg-white p-7 shadow-soft"
            >
              <span className="text-4xl font-bold text-brand-200">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold text-navy-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">{s.desc}</p>
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
    <section id="faq" className="scroll-mt-20 py-20 sm:py-24">
      <div className="section max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <div className="mt-10 divide-y divide-navy-100 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-soft">
          {FAQS.map((item, i) => {
            const open = openIdx === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-navy-50/50"
                >
                  <span className="text-sm font-semibold text-navy-900 sm:text-base">
                    {item.q}
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-500">
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
                      <p className="px-6 pb-5 text-sm leading-relaxed text-navy-500">
                        {item.a}
                      </p>
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
    <section className="pb-24">
      <div className="section">
        <div className="relative overflow-hidden rounded-3xl bg-navy-950 px-6 py-16 text-center shadow-elevated sm:px-12">
          <div className="pointer-events-none absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 bg-radial-fade" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Don&apos;t sign blind. Find the red flags first.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-balance text-navy-300">
              Get a clear, severity-ranked breakdown of any contract in seconds — free.
            </p>
            <div className="mt-8 flex justify-center">
              <a href="#analyze" className="btn-primary px-8 py-4 text-base">
                <Wand2 size={18} />
                Analyze a contract now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
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
      <span className="text-sm font-bold uppercase tracking-wider text-brand-500">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-balance text-lg leading-relaxed text-navy-500">{subtitle}</p>
      )}
    </div>
  );
}

function LoadingOverlay({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/60 bg-white p-8 text-center shadow-elevated"
      >
        <span className="relative flex h-14 w-14 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/30" />
          <ScanSearch size={32} className="text-brand-500" />
        </span>
        <div>
          <p className="text-base font-semibold text-navy-900">{message}</p>
          <p className="mt-1 text-sm text-navy-400">This usually takes a few seconds.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-navy-50/40">
      <div className="section py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div className="max-w-xs text-center md:text-left">
            <div className="flex items-center justify-center gap-2.5 md:justify-start">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600">
                <Flag size={15} className="text-white" fill="white" />
              </span>
              <span className="text-base font-bold tracking-tight text-navy-900">
                Red<span className="text-brand-500">Flag</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-navy-500">
              AI contract risk review that explains the fine print before you sign.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="#features" className="text-sm font-medium text-navy-600 hover:text-navy-900">
              Features
            </a>
            <a href="#how" className="text-sm font-medium text-navy-600 hover:text-navy-900">
              How it works
            </a>
            <a href="#faq" className="text-sm font-medium text-navy-600 hover:text-navy-900">
              FAQ
            </a>
            <a href="#analyze" className="text-sm font-medium text-navy-600 hover:text-navy-900">
              Analyze
            </a>
          </nav>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-navy-100 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-navy-400">
            © {new Date().getFullYear()} RedFlag · AI-generated guidance, not legal advice.
          </p>
          <p className="text-xs text-navy-400">Built with Next.js &amp; NVIDIA NIM</p>
        </div>
      </div>
    </footer>
  );
}
