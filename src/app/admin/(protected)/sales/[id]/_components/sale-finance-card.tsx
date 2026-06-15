"use client";

import { useEffect, useState } from "react";

import { financeService } from "@/shared/api/finance-service";
import { cardClass, cardTitleClass, labelClass } from "@/shared/ui/form";
import { formatMoney } from "@/shared/format";
import type { Sale } from "@/shared/domain/sale";

interface SaleFinanceCardProps {
  sale: Sale;
}

/** Profitability color thresholds (percent): <10 red, 10–30 amber, >30 green. */
function profitColor(percent: number): string {
  if (percent < 10) return "#dc2626";
  if (percent <= 30) return "#d97706";
  return "#16a34a";
}

export function SaleFinanceCard({ sale }: SaleFinanceCardProps) {
  const [cogs, setCogs] = useState<number | null>(null);

  const laptopId = sale.laptopId;
  useEffect(() => {
    let active = true;
    financeService
      .getLaptopCostPrice(laptopId)
      .then((value) => {
        if (active) setCogs(value);
      })
      .catch(() => {
        if (active) setCogs(null);
      });
    return () => {
      active = false;
    };
  }, [laptopId]);

  const price = sale.price;
  const profit = price != null && cogs != null ? price - cogs : null;
  const profitability =
    profit != null && cogs != null && cogs !== 0 ? (profit / cogs) * 100 : null;

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Фінанси</h2>

      <dl className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <dt className={labelClass}>Ціна продажу</dt>
          <dd className="text-sm font-semibold text-ink tabular-nums">
            {formatMoney(price)}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className={labelClass}>Собівартість</dt>
          <dd className="text-sm text-ink-soft tabular-nums">
            {cogs == null ? "—" : formatMoney(cogs)}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className={labelClass}>Рентабельність</dt>
          <dd className="text-sm font-semibold tabular-nums">
            {profitability == null ? (
              <span className="text-ink-soft">—</span>
            ) : (
              <span style={{ color: profitColor(profitability) }}>
                {profitability.toFixed(1)}%
              </span>
            )}
          </dd>
        </div>
      </dl>

      {profit != null && (
        <p className="mt-4 rounded-lg bg-paper/60 px-3 py-2.5 text-sm text-ink-soft">
          Прибуток:{" "}
          <span className="font-semibold text-ink tabular-nums">
            {formatMoney(profit)}
          </span>
        </p>
      )}
    </section>
  );
}
