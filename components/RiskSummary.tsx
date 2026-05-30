"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, AlertTriangle, Info, ShieldCheck } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

interface RiskSummaryProps {
  result: AnalysisResult;
}

function getRiskBand(score: number) {
  if (score > 70) {
    return {
      label: "High Risk",
      stroke: "#ef4444",
      text: "text-red-600",
      ring: "text-red-500",
      soft: "bg-red-50",
    };
  }
  if (score >= 40) {
    return {
      label: "Moderate Risk",
      stroke: "#eab308",
      text: "text-yellow-600",
      ring: "text-yellow-500",
      soft: "bg-yellow-50",
    };
  }
  return {
    label: "Low Risk",
    stroke: "#22c55e",
    text: "text-green-600",
    ring: "text-green-500",
    soft: "bg-green-50",
  };
}

function useCountUp(target: number, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function RiskSummary({ result }: RiskSummaryProps) {
  const band = getRiskBand(result.overall_risk_score);
  const animatedScore = useCountUp(result.overall_risk_score);

  const counts = {
    high: result.flags.filter((f) => f.severity === "high").length,
    medium: result.flags.filter((f) => f.severity === "medium").length,
    low: result.flags.filter((f) => f.severity === "low").length,
  };

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (animatedScore / 100) * circumference;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-elevated"
    >
      <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:gap-10">
        {/* Score gauge */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative h-44 w-44">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-navy-100"
              />
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={band.stroke}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold tracking-tight ${band.text}`}>
                {animatedScore}
              </span>
              <span className="text-xs font-medium text-navy-400">/ 100</span>
            </div>
          </div>
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${band.soft} ${band.text}`}
          >
            {band.label}
          </span>
        </div>

        {/* Summary + counts */}
        <div className="flex flex-col justify-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-400">
            Overall assessment
          </h2>
          <p className="mt-2 text-balance text-lg leading-relaxed text-navy-800">
            {result.overall_summary || "No summary was provided."}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <CountCard
              label="High"
              count={counts.high}
              icon={<AlertOctagon size={16} />}
              className="bg-red-50 text-red-600"
            />
            <CountCard
              label="Medium"
              count={counts.medium}
              icon={<AlertTriangle size={16} />}
              className="bg-yellow-50 text-yellow-600"
            />
            <CountCard
              label="Low"
              count={counts.low}
              icon={<ShieldCheck size={16} />}
              className="bg-green-50 text-green-600"
            />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 border-t border-navy-100 bg-navy-50/60 px-6 py-4 sm:px-8">
        <Info size={16} className="mt-0.5 shrink-0 text-navy-400" />
        <p className="text-xs leading-relaxed text-navy-500">
          {result.disclaimer}
        </p>
      </div>
    </motion.section>
  );
}

interface CountCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  className: string;
}

function CountCard({ label, count, icon, className }: CountCardProps) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-3 text-center shadow-soft">
      <span
        className={`mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg ${className}`}
      >
        {icon}
      </span>
      <p className="text-2xl font-bold text-navy-900">{count}</p>
      <p className="text-xs font-medium text-navy-400">{label}</p>
    </div>
  );
}
