"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";

import type { LaptopGroupState } from "@/shared/domain/laptop-group";
import { GroupStateMultiSelect } from "./group-state-multi-select";

export interface GroupFilterState {
  groupName: string;
  stateList: LaptopGroupState[];
  /** Instagram published filter — undefined = all. */
  isInstagramPublished?: boolean;
}

interface GroupFilterBarProps {
  value: GroupFilterState;
  onChange: (next: GroupFilterState) => void;
  loading: boolean;
  onRefresh: () => void;
}

const controlClass =
  "rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";

/** Map the tri-state <select> value to the boolean|undefined filter. */
function publishedFromValue(raw: string): boolean | undefined {
  if (raw === "yes") return true;
  if (raw === "no") return false;
  return undefined;
}

function valueFromPublished(value?: boolean): string {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

export function GroupFilterBar({
  value,
  onChange,
  loading,
  onRefresh,
}: GroupFilterBarProps) {
  // Local name text, debounced before it reaches the parent (one fetch per pause).
  const [nameText, setNameText] = useState(value.groupName);

  useEffect(() => {
    const id = setTimeout(() => {
      if (nameText !== value.groupName) onChange({ ...value, groupName: nameText });
    }, 300);
    return () => clearTimeout(id);
    // Re-arm only when the typed text changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameText]);

  function patch(next: Partial<GroupFilterState>) {
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
      <GroupStateMultiSelect
        value={value.stateList}
        onChange={(stateList) => patch({ stateList })}
      />
      <select
        value={valueFromPublished(value.isInstagramPublished)}
        onChange={(e) =>
          patch({ isInstagramPublished: publishedFromValue(e.target.value) })
        }
        className={controlClass}
      >
        <option value="">Instagram: усі</option>
        <option value="yes">Опубліковано</option>
        <option value="no">Не опубліковано</option>
      </select>
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
