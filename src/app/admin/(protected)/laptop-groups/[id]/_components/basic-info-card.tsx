"use client";

import { useState } from "react";

import { laptopGroupService } from "@/shared/api/laptop-group-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass, cardTitleClass, fieldClass, labelClass } from "@/shared/ui/form";
import {
  PANEL_TYPE_LABELS,
  REFRESH_RATE_LABELS,
  RESOLUTION_LABELS,
} from "@/shared/domain/laptop";
import type { LaptopGroup } from "@/shared/domain/laptop-group";

interface BasicInfoCardProps {
  group: LaptopGroup;
  onChange: (group: LaptopGroup) => void;
}

export function BasicInfoCard({ group, onChange }: BasicInfoCardProps) {
  const [error, setError] = useState<string | null>(null);

  async function save(patch: {
    title?: string;
    groupDescription?: string;
    note?: string;
  }) {
    setError(null);
    try {
      onChange(await laptopGroupService.update({ id: group._id, ...patch }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const display: string[] = [];
  if (group.screenSize) display.push(`${group.screenSize}"`);
  if (group.resolution)
    display.push(RESOLUTION_LABELS[group.resolution] ?? group.resolution);
  if (group.panelType)
    display.push(
      PANEL_TYPE_LABELS[group.panelType as never] ?? group.panelType.toUpperCase(),
    );
  if (group.refreshRate)
    display.push(REFRESH_RATE_LABELS[group.refreshRate] ?? group.refreshRate);

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Основна інформація</h2>

      <div className="space-y-4">
        <Field label="Назва">
          <input
            defaultValue={group.title ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (group.title ?? ""))
                void save({ title: e.target.value });
            }}
            className={fieldClass}
          />
        </Field>

        <Field label="Опис">
          <textarea
            rows={3}
            defaultValue={group.groupDescription ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (group.groupDescription ?? ""))
                void save({ groupDescription: e.target.value });
            }}
            className={`${fieldClass} resize-none`}
          />
        </Field>

        <Field label="Нотатка">
          <textarea
            rows={2}
            defaultValue={group.note ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (group.note ?? ""))
                void save({ note: e.target.value });
            }}
            className={`${fieldClass} resize-none`}
          />
        </Field>

        {/* Read-only identifying specs (shared by every laptop in the group). */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-paper-line pt-4">
          <Spec label="Процесор" value={group.processor} />
          <Spec
            label="Відеокарта"
            value={
              group.videocard
                ? `${group.videocard}${group.discrete === undefined ? "" : group.discrete ? " · дискретна" : " · інтегрована"}`
                : undefined
            }
          />
          <Spec label="Трансформер" value={group.isTransformer ? "Так" : "Ні"} />
          <Spec label="Екран" value={display.length ? display.join(" ") : undefined} />
        </dl>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}

function Spec({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-0.5">
      <dt className={labelClass}>{label}</dt>
      <dd className="text-sm text-ink">{value && value.trim() ? value : "—"}</dd>
    </div>
  );
}
