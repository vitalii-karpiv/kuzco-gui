"use client";

import { useEffect, useState } from "react";

import { laptopService } from "@/shared/api/laptop-service";
import { financeService } from "@/shared/api/finance-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass, cardTitleClass, fieldClass, labelClass } from "@/shared/ui/form";
import { formatMoney } from "@/shared/format";
import type { Laptop } from "@/shared/domain/laptop";

type PriceField = "costPrice" | "limitPrice" | "sellPrice";

interface FinanceCardProps {
  laptop: Laptop;
  onChange: (laptop: Laptop) => void;
}

export function FinanceCard({ laptop, onChange }: FinanceCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [cogs, setCogs] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    financeService
      .getLaptopCostPrice(laptop._id)
      .then((value) => {
        if (active) setCogs(value);
      })
      .catch(() => {
        if (active) setCogs(null);
      });
    return () => {
      active = false;
    };
  }, [laptop._id]);

  async function save(field: PriceField, raw: string) {
    const value = raw.trim() === "" ? undefined : Number(raw);
    if (value !== undefined && !Number.isFinite(value)) return;
    if (value === laptop[field]) return;
    setError(null);
    try {
      const updated = await laptopService.update({ id: laptop._id, [field]: value });
      onChange(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const priceRow = (field: PriceField, label: string) => (
    <div className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      <input
        type="number"
        min={0}
        defaultValue={laptop[field] ?? ""}
        onBlur={(e) => void save(field, e.target.value)}
        className={fieldClass}
      />
    </div>
  );

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Фінанси</h2>

      <div className="mb-5 rounded-lg bg-paper/60 px-3 py-2.5">
        <p className={labelClass}>Собівартість (COGS)</p>
        <p className="mt-0.5 text-sm font-semibold text-ink tabular-nums">
          {cogs == null ? "—" : formatMoney(cogs)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {priceRow("costPrice", "Собівартість")}
        {priceRow("limitPrice", "Ліміт")}
        {priceRow("sellPrice", "Продаж")}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
