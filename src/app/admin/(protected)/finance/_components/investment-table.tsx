"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { financeService } from "@/shared/api/finance-service";
import { getErrorMessage } from "@/shared/api/error";
import { formatDate, formatMoney } from "@/shared/format";
import { useUsers } from "@/shared/users/users-context";
import type { Investment } from "@/shared/domain/investment";
import { rangeToIso, type FinanceDateRange } from "./date-range";
import { InvestmentCreateModal } from "./investment-create-modal";

interface InvestmentTableProps {
  range: FinanceDateRange;
  reloadKey: number;
  onMutate: () => void;
}

export function InvestmentTable({
  range,
  reloadKey,
  onMutate,
}: InvestmentTableProps) {
  const { nameOf } = useUsers();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Set state only from async callbacks (never synchronously in the effect
  // body) per react-hooks/set-state-in-effect.
  useEffect(() => {
    let active = true;
    const { from, to } = rangeToIso(range);
    financeService
      .listInvestments({ dateFrom: from, dateTo: to })
      .then((list) => {
        if (!active) return;
        setInvestments(list);
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

  const total = investments.reduce(
    (sum, investment) => sum + investment.amount,
    0,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-paper-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          Інвестиції
        </h2>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white transition-all hover:brightness-110"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          Додати інвестицію
        </button>
      </div>

      {error ? (
        <p className="px-5 pb-6 text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="px-5 pb-6 font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
          Завантаження…
        </p>
      ) : investments.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-ink-soft">
          За обраний період інвестицій немає.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
              <th className="px-5 py-3 font-medium">Інвестор</th>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-5 py-3 text-right font-medium">Сума</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((investment) => (
              <tr
                key={investment._id}
                className="border-b border-paper-line/70 last:border-0"
              >
                <td className="px-5 py-3 text-ink">
                  {nameOf(investment.userId)}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {formatDate(investment.date)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-ink">
                  {formatMoney(investment.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-paper-line font-medium">
              <td className="px-5 py-3 text-ink-soft" colSpan={2}>
                Усього: {investments.length}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-ink">
                {formatMoney(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}

      <InvestmentCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onMutate}
      />
    </section>
  );
}
