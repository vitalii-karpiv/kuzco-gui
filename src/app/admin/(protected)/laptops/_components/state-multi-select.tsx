"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { StateTag } from "@/shared/ui/state-tag";
import {
  LAPTOP_STATES,
  LAPTOP_STATE_COLORS,
  LAPTOP_STATE_LABELS,
  type LaptopState,
} from "@/shared/domain/laptop";

interface StateMultiSelectProps {
  value: LaptopState[];
  onChange: (next: LaptopState[]) => void;
}

/** Compact checkbox-popover multi-select for laptop states (no UI-kit dep). */
export function StateMultiSelect({ value, onChange }: StateMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function toggle(state: LaptopState) {
    onChange(
      value.includes(state)
        ? value.filter((s) => s !== state)
        : [...value, state],
    );
  }

  const label =
    value.length === 0
      ? "Усі стани"
      : value.length === LAPTOP_STATES.length
        ? "Усі стани"
        : `Стани: ${value.length}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors hover:border-ink/20 focus:border-accent focus:ring-1 focus:ring-accent"
      >
        {label}
        <ChevronDown className="size-3.5 text-ink-soft" strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-60 rounded-lg border border-paper-line bg-white p-1 shadow-xl">
          <div className="flex items-center justify-between px-2 py-1.5">
            <button
              type="button"
              onClick={() => onChange([...LAPTOP_STATES])}
              className="font-mono text-[10px] tracking-[0.1em] text-ink-soft uppercase hover:text-ink"
            >
              Усі
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="font-mono text-[10px] tracking-[0.1em] text-ink-soft uppercase hover:text-ink"
            >
              Очистити
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {LAPTOP_STATES.map((state) => {
              const checked = value.includes(state);
              return (
                <li key={state}>
                  <button
                    type="button"
                    onClick={() => toggle(state)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-paper"
                  >
                    <span
                      data-checked={checked}
                      className="grid size-4 shrink-0 place-items-center rounded border border-paper-line data-[checked=true]:border-accent data-[checked=true]:bg-accent"
                    >
                      {checked && (
                        <Check className="size-3 text-white" strokeWidth={3} />
                      )}
                    </span>
                    <StateTag
                      label={LAPTOP_STATE_LABELS[state]}
                      color={LAPTOP_STATE_COLORS[state]}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
