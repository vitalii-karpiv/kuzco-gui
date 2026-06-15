"use client";

import { ArrowDown, ArrowUp, RefreshCw } from "lucide-react";

import {
  SALE_SOURCES,
  SALE_SOURCE_LABELS,
  type SaleSource,
  type SaleState,
} from "@/shared/domain/sale";
import { SaleStateMultiSelect } from "./sale-state-multi-select";

export interface SaleFilterState {
  stateList: SaleState[];
  source?: SaleSource;
  dateFrom: string;
  dateTo: string;
  /** Date sort direction; -1 = newest first (default). */
  dateSort: 1 | -1;
}

interface SaleFilterBarProps {
  value: SaleFilterState;
  onChange: (next: SaleFilterState) => void;
  loading: boolean;
  onRefresh: () => void;
}

const controlClass =
  "rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";

export function SaleFilterBar({
  value,
  onChange,
  loading,
  onRefresh,
}: SaleFilterBarProps) {
  function patch(next: Partial<SaleFilterState>) {
    onChange({ ...value, ...next });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SaleStateMultiSelect
        value={value.stateList}
        onChange={(stateList) => patch({ stateList })}
      />
      <select
        value={value.source ?? ""}
        onChange={(e) =>
          patch({ source: (e.target.value || undefined) as SaleSource | undefined })
        }
        className={controlClass}
      >
        <option value="">Джерело: усі</option>
        {SALE_SOURCES.map((source) => (
          <option key={source} value={source}>
            {SALE_SOURCE_LABELS[source]}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase">від</span>
        <input
          type="date"
          value={value.dateFrom}
          onChange={(e) => patch({ dateFrom: e.target.value })}
          className={controlClass}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase">до</span>
        <input
          type="date"
          value={value.dateTo}
          onChange={(e) => patch({ dateTo: e.target.value })}
          className={controlClass}
        />
      </label>

      <button
        type="button"
        onClick={() => patch({ dateSort: value.dateSort === -1 ? 1 : -1 })}
        className="inline-flex items-center gap-1 rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        Дата
        {value.dateSort === -1 ? (
          <ArrowDown className="size-3.5" strokeWidth={2.5} />
        ) : (
          <ArrowUp className="size-3.5" strokeWidth={2.5} />
        )}
      </button>

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
