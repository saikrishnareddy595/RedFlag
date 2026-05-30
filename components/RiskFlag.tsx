"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  AlertTriangle,
  ChevronDown,
  Handshake,
  HelpCircle,
  Quote,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { RiskFlag as RiskFlagType, Severity, Suggestion } from "@/lib/types";

interface RiskFlagProps {
  flag: RiskFlagType;
  index: number;
}

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; badge: string; accent: string; icon: React.ReactNode }
> = {
  high: {
    label: "High risk",
    badge: "bg-red-500/15 border-red-500/30 text-red-300",
    accent: "bg-red-500",
    icon: <AlertOctagon size={13} />,
  },
  medium: {
    label: "Medium risk",
    badge: "bg-yellow-500/15 border-yellow-500/30 text-yellow-300",
    accent: "bg-yellow-400",
    icon: <AlertTriangle size={13} />,
  },
  low: {
    label: "Low risk",
    badge: "bg-green-500/15 border-green-500/30 text-green-300",
    accent: "bg-green-500",
    icon: <ShieldCheck size={13} />,
  },
};

const SUGGESTION_CONFIG: Record<
  Suggestion,
  { label: string; chip: string; icon: React.ReactNode }
> = {
  negotiate: {
    label: "Negotiate",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: <Handshake size={13} />,
  },
  clarify: {
    label: "Clarify",
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    icon: <HelpCircle size={13} />,
  },
  remove: {
    label: "Remove",
    chip: "bg-red-500/15 text-red-300 border-red-500/30",
    icon: <Trash2 size={13} />,
  },
  accept: {
    label: "Accept",
    chip: "bg-green-500/15 text-green-300 border-green-500/30",
    icon: <ShieldCheck size={13} />,
  },
};

export function RiskFlag({ flag, index }: RiskFlagProps) {
  const [expanded, setExpanded] = useState(false);
  const severity = SEVERITY_CONFIG[flag.severity];
  const suggestion = SUGGESTION_CONFIG[flag.suggestion];

  const isLong = flag.clause_text.length > 220;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.05]"
    >
      {/* Severity accent rail */}
      <span
        className={`absolute inset-y-0 left-0 w-1 ${severity.accent}`}
        aria-hidden
      />

      <div className="p-5 pl-6 sm:p-6 sm:pl-7">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${severity.badge}`}
            >
              {severity.icon}
              {severity.label}
            </span>
            <span className="text-xs font-medium text-zinc-600">
              Flag #{flag.id}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${suggestion.chip}`}
          >
            {suggestion.icon}
            {suggestion.label}
          </span>
        </div>

        {/* Clause text */}
        <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <Quote size={14} className="mb-1.5 text-zinc-600" aria-hidden />
          <p
            className={`text-sm italic leading-relaxed text-zinc-300 ${
              !expanded && isLong ? "line-clamp-3" : ""
            }`}
          >
            {flag.clause_text || "(No clause text was extracted.)"}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300"
            >
              {expanded ? "Show less" : "Show full clause"}
              <ChevronDown
                size={13}
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>

        {/* Explanation */}
        <div className="mb-4">
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
            What it means
          </h4>
          <p className="text-sm leading-relaxed text-zinc-300">{flag.explanation}</p>
        </div>

        {/* Reason for suggestion */}
        {flag.reason_for_suggestion && (
          <div className="rounded-lg bg-white/[0.03] px-3.5 py-2.5">
            <p className="text-xs leading-relaxed text-zinc-400">
              <span className="font-semibold text-zinc-300">
                Why {suggestion.label.toLowerCase()}:{" "}
              </span>
              {flag.reason_for_suggestion}
            </p>
          </div>
        )}
      </div>
    </motion.article>
  );
}
