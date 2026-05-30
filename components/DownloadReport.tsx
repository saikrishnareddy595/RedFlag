"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { CONTRACT_TYPES, type AnalysisResult, type Severity } from "@/lib/types";

interface DownloadReportProps {
  result: AnalysisResult;
}

const SEVERITY_COLOR: Record<Severity, [number, number, number]> = {
  high: [220, 38, 38],
  medium: [202, 138, 4],
  low: [22, 163, 74],
};

function contractTypeLabel(value: string): string {
  return CONTRACT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function DownloadReport({ result }: DownloadReportProps) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let y = margin;

      const addFooters = () => {
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.line(margin, pageHeight - 42, pageWidth - margin, pageHeight - 42);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          const footer = doc.splitTextToSize(result.disclaimer, contentWidth - 60);
          doc.text(footer, margin, pageHeight - 30);
          doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 30, {
            align: "right",
          });
        }
      };

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - 60) {
          doc.addPage();
          y = margin;
        }
      };

      // Header banner
      doc.setFillColor(10, 25, 41);
      doc.rect(0, 0, pageWidth, 96, "F");
      doc.setFillColor(244, 63, 94);
      doc.circle(margin + 8, 44, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("RedFlag", margin + 26, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(159, 179, 200);
      doc.text("AI Contract Risk Report", margin + 26, 68);
      doc.setFontSize(9);
      doc.text(dateStr, pageWidth - margin, 50, { align: "right" });
      doc.text(contractTypeLabel(result.contract_type), pageWidth - margin, 68, {
        align: "right",
      });

      y = 130;

      // Overall risk score
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 42, 67);
      doc.text("Overall Risk Score", margin, y);

      const score = result.overall_risk_score;
      const scoreColor: [number, number, number] =
        score > 70 ? [220, 38, 38] : score >= 40 ? [202, 138, 4] : [22, 163, 74];
      doc.setFontSize(30);
      doc.setTextColor(...scoreColor);
      doc.text(`${score}`, pageWidth - margin, y + 6, { align: "right" });
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("/ 100", pageWidth - margin, y + 22, { align: "right" });

      y += 24;

      // Score bar
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 8, 4, 4, "F");
      doc.setFillColor(...scoreColor);
      doc.roundedRect(margin, y, (contentWidth * score) / 100, 8, 4, 4, "F");
      y += 30;

      // Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 42, 67);
      doc.text("Summary", margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const summaryLines = doc.splitTextToSize(
        result.overall_summary || "No summary provided.",
        contentWidth,
      );
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 13 + 16;

      // Flags heading
      ensureSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 42, 67);
      doc.text(`Flagged Clauses (${result.flags.length})`, margin, y);
      y += 18;

      result.flags.forEach((flag, idx) => {
        ensureSpace(90);
        const color = SEVERITY_COLOR[flag.severity];

        // Card top border / label
        doc.setFillColor(...color);
        doc.roundedRect(margin, y, 4, 14, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...color);
        doc.text(
          `#${flag.id}  ${flag.severity.toUpperCase()}`,
          margin + 12,
          y + 11,
        );
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Suggested action: ${flag.suggestion}`,
          pageWidth - margin,
          y + 11,
          { align: "right" },
        );
        y += 24;

        // Clause text
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const clauseLines = doc.splitTextToSize(
          `"${flag.clause_text}"`,
          contentWidth - 12,
        );
        ensureSpace(clauseLines.length * 12 + 10);
        doc.text(clauseLines, margin + 12, y);
        y += clauseLines.length * 12 + 8;

        // Explanation
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        const explLines = doc.splitTextToSize(flag.explanation, contentWidth - 12);
        ensureSpace(explLines.length * 12 + 6);
        doc.text(explLines, margin + 12, y);
        y += explLines.length * 12 + 6;

        // Reason
        if (flag.reason_for_suggestion) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(120, 130, 150);
          const reasonLines = doc.splitTextToSize(
            `Why ${flag.suggestion}: ${flag.reason_for_suggestion}`,
            contentWidth - 12,
          );
          ensureSpace(reasonLines.length * 11 + 6);
          doc.text(reasonLines, margin + 12, y);
          y += reasonLines.length * 11 + 6;
        }

        // Divider
        if (idx < result.flags.length - 1) {
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.5);
          doc.line(margin, y + 4, pageWidth - margin, y + 4);
          y += 16;
        }
      });

      addFooters();

      const safeType = result.contract_type.replace(/[^a-z0-9]/gi, "-");
      doc.save(`RedFlag-Report-${safeType}-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Sorry, the PDF report could not be generated. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={generating}
      className="btn-primary w-full sm:w-auto"
    >
      {generating ? (
        <>
          <Loader2 size={17} className="animate-spin" />
          Generating report…
        </>
      ) : (
        <>
          <Download size={17} />
          Download PDF Report
        </>
      )}
    </button>
  );
}
