"use client";

import { useState } from "react";

import { saleService } from "@/shared/api/sale-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass, cardTitleClass, fieldClass, labelClass } from "@/shared/ui/form";
import { StateTag } from "@/shared/ui/state-tag";
import { formatDate } from "@/shared/format";
import {
  DELIVERY_TYPES,
  DELIVERY_TYPE_LABELS,
  SALE_SOURCES,
  SALE_SOURCE_LABELS,
  SALE_STATE_COLORS,
  SALE_STATE_LABELS,
  type DeliveryType,
  type Sale,
  type SaleSource,
} from "@/shared/domain/sale";

interface SaleInfoCardProps {
  sale: Sale;
  onChange: (sale: Sale) => void;
}

export function SaleInfoCard({ sale, onChange }: SaleInfoCardProps) {
  const [error, setError] = useState<string | null>(null);

  async function save(patch: {
    price?: number;
    source?: SaleSource;
    deliveryType?: DeliveryType;
    ttn?: string;
    note?: string;
  }) {
    setError(null);
    try {
      onChange(await saleService.update({ id: sale._id, ...patch }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Інформація про продаж</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ціна">
            <input
              type="number"
              min={0}
              defaultValue={sale.price ?? ""}
              onBlur={(e) => {
                const value = e.target.value.trim() === "" ? undefined : Number(e.target.value);
                if (value !== undefined && !Number.isFinite(value)) return;
                if (value !== sale.price) void save({ price: value });
              }}
              className={fieldClass}
            />
          </Field>
          <div className="space-y-1.5">
            <span className={labelClass}>Стан</span>
            <div className="pt-1.5">
              <StateTag
                label={SALE_STATE_LABELS[sale.state]}
                color={SALE_STATE_COLORS[sale.state]}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Джерело">
            <select
              value={sale.source ?? ""}
              onChange={(e) =>
                void save({ source: (e.target.value || undefined) as SaleSource | undefined })
              }
              className={fieldClass}
            >
              <option value="">—</option>
              {SALE_SOURCES.map((value) => (
                <option key={value} value={value}>
                  {SALE_SOURCE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Доставка">
            <select
              value={sale.deliveryType ?? ""}
              onChange={(e) =>
                void save({
                  deliveryType: (e.target.value || undefined) as DeliveryType | undefined,
                })
              }
              className={fieldClass}
            >
              <option value="">—</option>
              {DELIVERY_TYPES.map((value) => (
                <option key={value} value={value}>
                  {DELIVERY_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="ТТН">
            <input
              defaultValue={sale.ttn ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (sale.ttn ?? "")) void save({ ttn: e.target.value });
              }}
              className={fieldClass}
            />
          </Field>
          <div className="space-y-1.5">
            <span className={labelClass}>Дата</span>
            <p className="pt-2 text-sm text-ink">{formatDate(sale.date)}</p>
          </div>
        </div>

        <Field label="Нотатка">
          <textarea
            rows={2}
            defaultValue={sale.note ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (sale.note ?? "")) void save({ note: e.target.value });
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}
