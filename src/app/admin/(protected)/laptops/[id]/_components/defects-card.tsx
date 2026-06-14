"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { laptopService } from "@/shared/api/laptop-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass, fieldClass } from "@/shared/ui/form";
import type { Laptop } from "@/shared/domain/laptop";

interface DefectsCardProps {
  laptop: Laptop;
  onChange: (laptop: Laptop) => void;
}

export function DefectsCard({ laptop, onChange }: DefectsCardProps) {
  const [error, setError] = useState<string | null>(null);
  const defects = laptop.defects ?? [];

  async function saveDefects(next: string[]) {
    setError(null);
    try {
      const updated = await laptopService.update({ id: laptop._id, defects: next });
      onChange(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function updateAt(index: number, value: string) {
    const next = defects.slice();
    next[index] = value;
    void saveDefects(next);
  }

  function removeAt(index: number) {
    void saveDefects(defects.filter((_, i) => i !== index));
  }

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          Дефекти
        </h2>
        <button
          type="button"
          onClick={() => void saveDefects([...defects, ""])}
          aria-label="Додати дефект"
          className="inline-flex items-center justify-center rounded-lg border border-paper-line p-1.5 text-ink-soft transition-colors hover:text-ink"
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </button>
      </div>

      {defects.length === 0 ? (
        <p className="text-sm text-ink-soft">Дефектів не зафіксовано.</p>
      ) : (
        <ul className="space-y-2">
          {defects.map((defect, index) => (
            <li key={index} className="flex items-center gap-2">
              <input
                defaultValue={defect}
                onBlur={(e) => {
                  if (e.target.value !== defect) updateAt(index, e.target.value);
                }}
                placeholder="Опис дефекту…"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="Видалити"
                className="shrink-0 rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
