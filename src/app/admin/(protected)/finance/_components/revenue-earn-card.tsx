"use client";

import { useEffect, useState } from "react";

import { financeService } from "@/shared/api/finance-service";
import { getErrorMessage } from "@/shared/api/error";
import { formatMoney } from "@/shared/format";
import { cardClass, cardTitleClass } from "@/shared/ui/form";
import { rangeToIso, type FinanceDateRange } from "./date-range";

interface RevenueEarnCardProps {
  range: FinanceDateRange;
  reloadKey: number;
}

/** Period P&L summary: revenue from done sales and net earnings (revenue - COGS). */
export function RevenueEarnCard({ range, reloadKey }: RevenueEarnCardProps) {
  const [revenue, setRevenue] = useState<number | null>(null);
  const [earn, setEarn] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set state only from async callbacks (never synchronously in the effect
  // body) per react-hooks/set-state-in-effect.
  useEffect(() => {
    let active = true;
    const { from, to } = rangeToIso(range);
    financeService
      .getRevenueAndEarnings(from, to)
      .then((result) => {
        if (!active) return;
        setRevenue(result.revenue);
        setEarn(result.earn);
        setError(null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range, reloadKey]);

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Дохід та прибуток</h2>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Stat
            label="Дохід"
            value={loading ? "…" : formatMoney(revenue)}
          />
          <Stat
            label="Прибуток"
            value={loading ? "…" : formatMoney(earn)}
            positive={(earn ?? 0) >= 0}
          />
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-paper-line bg-paper/40 px-4 py-3">
      <p className="font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-2xl font-extrabold tracking-tight tabular-nums ${
          positive === false ? "text-red-600" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
