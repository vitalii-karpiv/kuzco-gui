"use client";

import { useState } from "react";

import { laptopService } from "@/shared/api/laptop-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass } from "@/shared/ui/form";
import {
  TECH_CHECK_KEYS,
  TECH_CHECK_LABELS,
  type Laptop,
  type TechCheck,
  type TechCheckKey,
} from "@/shared/domain/laptop";

/** Build a fully-populated TechCheck (server requires all 11 fields present). */
function fullTechCheck(partial?: TechCheck): TechCheck {
  return TECH_CHECK_KEYS.reduce((acc, key) => {
    acc[key] = partial?.[key] ?? false;
    return acc;
  }, {} as TechCheck);
}

interface TechCheckCardProps {
  laptop: Laptop;
  onChange: (laptop: Laptop) => void;
}

export function TechCheckCard({ laptop, onChange }: TechCheckCardProps) {
  const [error, setError] = useState<string | null>(null);
  const current = fullTechCheck(laptop.techCheck);
  const done = TECH_CHECK_KEYS.filter((key) => current[key]).length;

  async function toggle(key: TechCheckKey, value: boolean) {
    setError(null);
    const next = { ...current, [key]: value };
    try {
      const updated = await laptopService.update({
        id: laptop._id,
        techCheck: next,
      });
      onChange(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          Тех-перевірка
        </h2>
        <span className="font-mono text-xs text-ink-soft tabular-nums">
          {done}/{TECH_CHECK_KEYS.length}
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {TECH_CHECK_KEYS.map((key) => (
          <li key={key}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-paper">
              <input
                type="checkbox"
                checked={current[key]}
                onChange={(e) => void toggle(key, e.target.checked)}
                className="size-4 rounded border-paper-line accent-accent"
              />
              <span className="text-sm text-ink">{TECH_CHECK_LABELS[key]}</span>
            </label>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
