"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { financeService } from "@/shared/api/finance-service";
import { saleService } from "@/shared/api/sale-service";
import { getErrorMessage } from "@/shared/api/error";
import { formatMoney } from "@/shared/format";
import {
  defaultFinanceRange,
  rangeToIso,
  type FinanceDateRange,
} from "@/shared/date-range";

interface KpiStripProps {
  reloadKey: number;
}

export function KpiStrip({ reloadKey }: KpiStripProps) {
  const [range, setRange] = useState<FinanceDateRange>(defaultFinanceRange);

  const [revenue, setRevenue] = useState<number | null>(null);
  const [earn, setEarn] = useState<number | null>(null);
  const [openSales, setOpenSales] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const { from, to } = rangeToIso(range);

    Promise.all([
      financeService.getRevenueAndEarnings(from, to),
      saleService.list({ state: ["new", "toApprove", "delivering"] }),
    ])
      .then(([kpi, sales]) => {
        if (!active) return;
        setRevenue(kpi.revenue);
        setEarn(kpi.earn);
        setOpenSales(sales.length);
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
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-mono text-xs font-medium tracking-[0.12em] text-ink-soft uppercase">
          Показники за період
        </h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="font-mono tracking-[0.08em] uppercase">від</span>
            <input
              type="date"
              value={range.from}
              onChange={(e) => {
                setLoading(true);
                setRange((r) => ({ ...r, from: e.target.value }));
              }}
              className="rounded-md border border-paper-line bg-white px-2 py-1 text-xs text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="font-mono tracking-[0.08em] uppercase">до</span>
            <input
              type="date"
              value={range.to}
              onChange={(e) => {
                setLoading(true);
                setRange((r) => ({ ...r, to: e.target.value }));
              }}
              className="rounded-md border border-paper-line bg-white px-2 py-1 text-xs text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </label>
        </div>
        {loading && (
          <RefreshCw className="size-3.5 animate-spin text-ink-soft" strokeWidth={2} />
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard
            label="Дохід"
            value={revenue !== null ? formatMoney(revenue) : null}
            loading={loading}
          />
          <KpiCard
            label="Прибуток"
            value={earn !== null ? formatMoney(earn) : null}
            loading={loading}
            negative={earn !== null && earn < 0}
          />
          <KpiCard
            label="Відкриті продажі"
            value={openSales !== null ? String(openSales) : null}
            loading={loading}
            linkHref="/admin/sales?state=new&state=toApprove&state=delivering"
          />
        </div>
      )}
    </section>
  );
}

interface KpiCardProps {
  label: string;
  value: string | null;
  loading: boolean;
  negative?: boolean;
  linkHref?: string;
}

function KpiCard({ label, value, loading, negative, linkHref }: KpiCardProps) {
  const valueClass = negative ? "text-red-600" : "text-ink";
  const inner = (
    <div className="rounded-2xl border border-paper-line bg-white px-5 py-4">
      <p className="font-mono text-[10px] tracking-[0.12em] text-ink-soft uppercase">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-2xl font-extrabold tabular-nums ${loading ? "text-paper-line" : valueClass}`}
      >
        {loading ? "—" : (value ?? "—")}
      </p>
    </div>
  );

  if (linkHref) {
    return (
      <a href={linkHref} className="block transition-opacity hover:opacity-80">
        {inner}
      </a>
    );
  }
  return inner;
}
