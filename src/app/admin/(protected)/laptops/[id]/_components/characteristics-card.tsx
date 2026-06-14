"use client";

import { useState } from "react";

import { laptopService } from "@/shared/api/laptop-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass, cardTitleClass, fieldClass, labelClass } from "@/shared/ui/form";
import {
  LAPTOP_CONDITIONS,
  LAPTOP_CONDITION_LABELS,
  PANEL_TYPES,
  PANEL_TYPE_LABELS,
  REFRESH_RATES,
  REFRESH_RATE_LABELS,
  RESOLUTIONS,
  RESOLUTION_LABELS,
  type Characteristics,
  type Laptop,
  type LaptopCondition,
} from "@/shared/domain/laptop";

interface CharacteristicsCardProps {
  laptop: Laptop;
  onChange: (laptop: Laptop) => void;
}

export function CharacteristicsCard({ laptop, onChange }: CharacteristicsCardProps) {
  const [error, setError] = useState<string | null>(null);
  const c = laptop.characteristics ?? {};

  async function save(patch: {
    serviceTag?: string;
    note?: string;
    characteristics?: Characteristics;
  }) {
    setError(null);
    try {
      const updated = await laptopService.update({ id: laptop._id, ...patch });
      onChange(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  /** Merge a characteristics change onto the current object and save. */
  function saveChar(patch: Partial<Characteristics>) {
    void save({ characteristics: { ...c, ...patch } });
  }

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Характеристики</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Сервісний тег">
            <input
              defaultValue={laptop.serviceTag ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (laptop.serviceTag ?? ""))
                  void save({ serviceTag: e.target.value });
              }}
              className={fieldClass}
            />
          </Field>
          <Field label="Стан корпусу">
            <select
              value={c.condition ?? ""}
              onChange={(e) =>
                saveChar({ condition: (e.target.value || undefined) as LaptopCondition | undefined })
              }
              className={fieldClass}
            >
              <option value="">—</option>
              {LAPTOP_CONDITIONS.map((value) => (
                <option key={value} value={value}>
                  {LAPTOP_CONDITION_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Процесор">
          <input
            defaultValue={c.processor ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (c.processor ?? ""))
                saveChar({ processor: e.target.value });
            }}
            className={fieldClass}
          />
        </Field>

        <div className="grid grid-cols-[1fr_auto] items-end gap-4">
          <Field label="Відеокарта">
            <input
              defaultValue={c.videocard ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (c.videocard ?? ""))
                  saveChar({ videocard: e.target.value });
              }}
              className={fieldClass}
            />
          </Field>
          <Check
            label="Дискретна"
            checked={c.discrete ?? false}
            onChange={(discrete) => saveChar({ discrete })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="RAM, ГБ">
            <input
              type="number"
              min={0}
              defaultValue={c.ram ?? ""}
              onBlur={(e) => saveChar({ ram: numberOrUndefined(e.target.value) })}
              className={fieldClass}
            />
          </Field>
          <Field label="SSD, ГБ">
            <input
              type="number"
              min={0}
              defaultValue={c.ssd ?? ""}
              onBlur={(e) => saveChar({ ssd: numberOrUndefined(e.target.value) })}
              className={fieldClass}
            />
          </Field>
          <Field label="Батарея, %">
            <input
              type="number"
              min={0}
              max={100}
              defaultValue={c.battery ?? ""}
              onBlur={(e) => saveChar({ battery: numberOrUndefined(e.target.value) })}
              className={fieldClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label='Екран, "'>
            <input
              type="number"
              min={0}
              step="0.1"
              defaultValue={c.screenSize ?? ""}
              onBlur={(e) => saveChar({ screenSize: numberOrUndefined(e.target.value) })}
              className={fieldClass}
            />
          </Field>
          <Field label="Матриця">
            <select
              value={c.panelType ?? ""}
              onChange={(e) => saveChar({ panelType: e.target.value || undefined })}
              className={fieldClass}
            >
              <option value="">—</option>
              {PANEL_TYPES.map((value) => (
                <option key={value} value={value}>
                  {PANEL_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Роздільна здатність">
            <select
              value={c.resolution ?? ""}
              onChange={(e) => saveChar({ resolution: e.target.value || undefined })}
              className={fieldClass}
            >
              <option value="">—</option>
              {RESOLUTIONS.map((value) => (
                <option key={value} value={value}>
                  {RESOLUTION_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Частота">
            <select
              value={c.refreshRate ?? ""}
              onChange={(e) => saveChar({ refreshRate: e.target.value || undefined })}
              className={fieldClass}
            >
              <option value="">—</option>
              {REFRESH_RATES.map((value) => (
                <option key={value} value={value}>
                  {REFRESH_RATE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Порти (через кому)">
          <input
            defaultValue={(c.ports ?? []).join(", ")}
            onBlur={(e) => {
              const ports = e.target.value
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean);
              saveChar({ ports });
            }}
            placeholder="USB-A, HDMI, Type-C…"
            className={fieldClass}
          />
        </Field>

        <div className="flex flex-wrap gap-6">
          <Check
            label="Сенсор"
            checked={c.touch ?? false}
            onChange={(touch) => saveChar({ touch })}
          />
          <Check
            label="Підсвітка"
            checked={c.keyLight ?? false}
            onChange={(keyLight) => saveChar({ keyLight })}
          />
          <Check
            label="Трансформер"
            checked={c.isTransformer ?? false}
            onChange={(isTransformer) => saveChar({ isTransformer })}
          />
        </div>

        <Field label="Нотатка">
          <textarea
            rows={3}
            defaultValue={laptop.note ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (laptop.note ?? ""))
                void save({ note: e.target.value });
            }}
            className={`${fieldClass} resize-none`}
          />
        </Field>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function numberOrUndefined(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-ink-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-paper-line accent-accent"
      />
      {label}
    </label>
  );
}
