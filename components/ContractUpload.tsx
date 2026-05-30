"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileType2,
  Trash2,
  Type,
  Upload,
  UploadCloud,
} from "lucide-react";
import { MAX_CONTRACT_CHARS } from "@/lib/types";

type Tab = "upload" | "paste";

interface ContractUploadProps {
  text: string;
  file: File | null;
  onTextChange: (text: string) => void;
  onFileChange: (file: File | null) => void;
}

const ACCEPTED = ".pdf,.docx,.txt";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContractUpload({
  text,
  file,
  onTextChange,
  onFileChange,
}: ContractUploadProps) {
  const [tab, setTab] = useState<Tab>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFileChange(files[0]);
      onTextChange("");
    },
    [onFileChange, onTextChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className="w-full">
      {/* Tab switcher */}
      <div className="mb-4 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        <TabButton
          active={tab === "upload"}
          onClick={() => setTab("upload")}
          icon={<Upload size={15} />}
          label="Upload File"
        />
        <TabButton
          active={tab === "paste"}
          onClick={() => setTab("paste")}
          icon={<Type size={15} />}
          label="Paste Text"
        />
      </div>

      {tab === "upload" ? (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {file ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                  <FileType2 size={20} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatBytes(file.size)} · Ready to analyze
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onFileChange(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                aria-label="Remove file"
              >
                <Trash2 size={17} />
              </button>
            </motion.div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200 ${
                isDragging
                  ? "scale-[1.01] border-brand-400 bg-brand-500/10"
                  : "border-white/15 bg-white/[0.02] hover:border-brand-400/50 hover:bg-brand-500/[0.06]"
              }`}
            >
              <span
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-200 ${
                  isDragging
                    ? "bg-brand-500/20 text-brand-300"
                    : "bg-white/5 text-zinc-400 group-hover:text-brand-400"
                }`}
              >
                <UploadCloud size={26} />
              </span>
              <p className="text-sm font-semibold text-zinc-200">
                {isDragging
                  ? "Drop your contract here"
                  : "Drag & drop your contract, or click to browse"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                PDF, DOCX, or TXT · Processed privately, never stored
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => {
                onTextChange(e.target.value.slice(0, MAX_CONTRACT_CHARS));
                if (file) onFileChange(null);
              }}
              placeholder="Paste your contract text here…&#10;&#10;Example: This Agreement is entered into as of the Effective Date by and between…"
              className="min-h-[220px] w-full resize-y rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-zinc-100 transition-all duration-200 placeholder:text-zinc-600 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-ink-800/80 px-2 py-1 text-xs font-medium text-zinc-500 backdrop-blur">
              <FileText size={12} />
              {text.length.toLocaleString()} / {MAX_CONTRACT_CHARS.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
        active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {active && (
        <motion.span
          layoutId="upload-tab"
          className="absolute inset-0 rounded-lg bg-white/10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}
