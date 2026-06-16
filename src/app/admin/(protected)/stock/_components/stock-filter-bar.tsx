"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, RefreshCw, Search } from "lucide-react";

import {
  STOCK_STATES,
  STOCK_STATE_LABELS,
  STOCK_TYPES,
  STOCK_TYPE_LABELS,
  type StockState,
  type StockType,
} from "@/shared/domain/stock";

export interface StockFilterState {
  name: string;
  type?: StockType;
  state?: StockState;
}

export type SortField = "price";
export interface StockSort {
  field: SortField;
  dir: 1 | -1;
}

interface StockFilterBarProps {
  value: StockFilterState;
  onChange: (next: StockFilterState) => void;
  sort: StockSort | null;
  onSortChange: (next: StockSort | null) => void;
  loading: boolean;
  onRefresh: () => void;
}

const controlClass =
  "rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";

/** Cycle a sort field: off → desc → asc → off. */
function nextSort(
  current: StockSort | null,
  field: SortField,
): StockSort | null {
  if (!current || current.field !== field) return { field, dir: -1 };
  if (current.dir === -1) return { field, dir: 1 };
  return null;
}

export function StockFilterBar({
  value,
  onChange,
  sort,
  onSortChange,
  loading,
  onRefresh,
}: StockFilterBarProps) {
  // Local name text, debounced before it reaches the parent (one fetch per pause).
  const [nameText, setNameText] = useState(value.name);

  useEffect(() => {
    const id = setTimeout(() => {
      if (nameText !== value.name) onChange({ ...value, name: nameText });
    }, 300);
    return () => clearTimeout(id);
    // Re-arm only when the typed text changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameText]);

  function patch(next: Partial<StockFilterState>) {
    onChange({ ...value, ...next });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
        <input
          value={nameText}
          onChange={(e) => setNameText(e.target.value)}
          placeholder="Пошук за назвою…"
          className="w-full rounded-lg border border-paper-line bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      <select
        value={value.type ?? ""}
        onChange={(e) =>
          patch({
            type: (e.target.value || undefined) as StockType | undefined,
          })
        }
        className={controlClass}
      >
        <option value="">Усі типи</option>
        {STOCK_TYPES.map((type) => (
          <option key={type} value={type}>
            {STOCK_TYPE_LABELS[type]}
          </option>
        ))}
      </select>

      <select
        value={value.state ?? ""}
        onChange={(e) =>
          patch({
            state: (e.target.value || undefined) as StockState | undefined,
          })
        }
        className={controlClass}
      >
        <option value="">Усі стани</option>
        {STOCK_STATES.map((state) => (
          <option key={state} value={state}>
            {STOCK_STATE_LABELS[state]}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onSortChange(nextSort(sort, "price"))}
        data-active={sort?.field === "price"}
        className="inline-flex items-center gap-1 rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink-soft transition-colors hover:text-ink data-[active=true]:border-accent data-[active=true]:text-accent"
      >
        Ціна
        {sort?.field === "price" &&
          (sort.dir === -1 ? (
            <ArrowDown className="size-3.5" strokeWidth={2.5} />
          ) : (
            <ArrowUp className="size-3.5" strokeWidth={2.5} />
          ))}
      </button>

      <button
        type="button"
        onClick={onRefresh}
        aria-label="Оновити"
        className="inline-flex items-center justify-center rounded-lg border border-paper-line bg-white p-2 text-ink-soft transition-colors hover:text-ink"
      >
        <RefreshCw
          className={`size-4 ${loading ? "animate-spin" : ""}`}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}
