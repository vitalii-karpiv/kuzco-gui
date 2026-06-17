"use client";

import { RefreshCw } from "lucide-react";

import type { FinanceDateRange } from "./date-range";

interface FinanceFilterBarProps {
  value: FinanceDateRange;
  onChange: (next: FinanceDateRange) => void;
  loading: boolean;
  onRefresh: () => void;
}

const controlClass =
  "rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";

/** Single shared date-range filter that drives every finance section. */
export function FinanceFilterBar({
  value,
  onChange,
  loading,
  onRefresh,
}: FinanceFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase">
          від
        </span>
        <input
          type="date"
          value={value.from}
          max={value.to || undefined}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className={controlClass}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase">
          до
        </span>
        <input
          type="date"
          value={value.to}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className={controlClass}
        />
      </label>

      <button
        type="button"
        onClick={onRefresh}
        aria-label="Оновити"
        className="ml-auto inline-flex items-center justify-center rounded-lg border border-paper-line bg-white p-2 text-ink-soft transition-colors hover:text-ink"
      >
        <RefreshCw
          className={`size-4 ${loading ? "animate-spin" : ""}`}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}
