"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, FileText } from "lucide-react";
import { CONTRACT_TYPES } from "@/lib/types";

interface ContractTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ContractTypeSelector({
  value,
  onChange,
}: ContractTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = CONTRACT_TYPES.find((t) => t.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full" ref={containerRef}>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-200">
        Contract type
        <span className="text-brand-400">*</span>
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white/5 px-4 py-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
            open
              ? "border-brand-400 ring-2 ring-brand-500/30"
              : "border-white/10 hover:border-white/20"
          }`}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-brand-400">
              <FileText className="h-4.5 w-4.5" size={18} />
            </span>
            <span className="flex flex-col">
              <span
                className={`text-sm font-medium ${
                  selected ? "text-white" : "text-zinc-500"
                }`}
              >
                {selected ? selected.label : "Select a contract type…"}
              </span>
              {selected && (
                <span className="text-xs text-zinc-500">{selected.description}</span>
              )}
            </span>
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              role="listbox"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-white/10 bg-ink-800/95 p-1.5 shadow-elevated backdrop-blur-xl"
            >
              {CONTRACT_TYPES.map((type) => {
                const active = type.value === value;
                return (
                  <li key={type.value} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(type.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 ${
                        active
                          ? "bg-brand-500/15 text-brand-300"
                          : "text-zinc-200 hover:bg-white/5"
                      }`}
                    >
                      <span className="flex flex-col">
                        <span className="text-sm font-medium">{type.label}</span>
                        <span
                          className={`text-xs ${
                            active ? "text-brand-300/80" : "text-zinc-500"
                          }`}
                        >
                          {type.description}
                        </span>
                      </span>
                      {active && (
                        <Check size={16} className="mt-0.5 shrink-0 text-brand-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
