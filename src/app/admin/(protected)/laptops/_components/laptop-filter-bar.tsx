"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, RefreshCw, Search } from "lucide-react";

import {
  PANEL_TYPES,
  PANEL_TYPE_LABELS,
  type LaptopState,
  type PanelType,
} from "@/shared/domain/laptop";
import { StateMultiSelect } from "./state-multi-select";

export interface LaptopFilterState {
  stateList: LaptopState[];
  name: string;
  ram?: number;
  ssd?: number;
  screenSize?: number;
  panelType?: PanelType;
  touch?: boolean;
  discrete?: boolean;
  keyLight?: boolean;
  inGroup?: boolean;
}

export type SortField = "sellPrice" | "limitPrice";
export interface LaptopSort {
  field: SortField;
  dir: 1 | -1;
}

interface LaptopFilterBarProps {
  value: LaptopFilterState;
  onChange: (next: LaptopFilterState) => void;
  sort: LaptopSort | null;
  onSortChange: (next: LaptopSort | null) => void;
  loading: boolean;
  onRefresh: () => void;
}

const controlClass =
  "rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";

/** Parse a numeric input to a number, or undefined when blank/invalid. */
function toNumber(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Cycle a sort field: off → desc → asc → off. */
function nextSort(current: LaptopSort | null, field: SortField): LaptopSort | null {
  if (!current || current.field !== field) return { field, dir: -1 };
  if (current.dir === -1) return { field, dir: 1 };
  return null;
}

export function LaptopFilterBar({
  value,
  onChange,
  sort,
  onSortChange,
  loading,
  onRefresh,
}: LaptopFilterBarProps) {
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

  function patch(next: Partial<LaptopFilterState>) {
    onChange({ ...value, ...next });
  }

  function checkbox(
    key: "touch" | "discrete" | "keyLight" | "inGroup",
    label: string,
  ) {
    return (
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={value[key] ?? false}
          onChange={(e) => patch({ [key]: e.target.checked || undefined })}
          className="size-4 rounded border-paper-line accent-accent"
        />
        {label}
      </label>
    );
  }

  function sortButton(field: SortField, label: string) {
    const active = sort?.field === field;
    return (
      <button
        type="button"
        onClick={() => onSortChange(nextSort(sort, field))}
        data-active={active}
        className="inline-flex items-center gap-1 rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink-soft transition-colors hover:text-ink data-[active=true]:border-accent data-[active=true]:text-accent"
      >
        {label}
        {active &&
          (sort.dir === -1 ? (
            <ArrowDown className="size-3.5" strokeWidth={2.5} />
          ) : (
            <ArrowUp className="size-3.5" strokeWidth={2.5} />
          ))}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Primary row: search + state + refresh */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={nameText}
            onChange={(e) => setNameText(e.target.value)}
            placeholder="Пошук за назвою або сервісним тегом…"
            className="w-full rounded-lg border border-paper-line bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <StateMultiSelect
          value={value.stateList}
          onChange={(stateList) => patch({ stateList })}
        />
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

      {/* Secondary row: specs + flags + sort */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          min={0}
          value={value.ram ?? ""}
          onChange={(e) => patch({ ram: toNumber(e.target.value) })}
          placeholder="RAM, ГБ"
          className={`${controlClass} w-28`}
        />
        <input
          type="number"
          min={0}
          value={value.ssd ?? ""}
          onChange={(e) => patch({ ssd: toNumber(e.target.value) })}
          placeholder="SSD, ГБ"
          className={`${controlClass} w-28`}
        />
        <input
          type="number"
          min={0}
          step="0.1"
          value={value.screenSize ?? ""}
          onChange={(e) => patch({ screenSize: toNumber(e.target.value) })}
          placeholder='Екран, "'
          className={`${controlClass} w-28`}
        />
        <select
          value={value.panelType ?? ""}
          onChange={(e) =>
            patch({ panelType: (e.target.value || undefined) as PanelType | undefined })
          }
          className={controlClass}
        >
          <option value="">Матриця</option>
          {PANEL_TYPES.map((type) => (
            <option key={type} value={type}>
              {PANEL_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-4 px-1">
          {checkbox("touch", "Сенсор")}
          {checkbox("discrete", "Дискретна")}
          {checkbox("keyLight", "Підсвітка")}
          {checkbox("inGroup", "У групі")}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.1em] text-ink-soft uppercase">
            Сорт.
          </span>
          {sortButton("sellPrice", "Ціна продажу")}
          {sortButton("limitPrice", "Ліміт")}
        </div>
      </div>
    </div>
  );
}
