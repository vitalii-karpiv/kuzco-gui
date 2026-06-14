"use client";

import { useEffect, useState } from "react";

import { financeService } from "@/shared/api/finance-service";
import { getErrorMessage } from "@/shared/api/error";
import { formatMoney, formatTimestamp } from "@/shared/format";
import { EXPENSE_TYPE_LABELS, type Expense } from "@/shared/domain/expense";

/**
 * Read-only view of expenses linked to the order. Creating, editing, and
 * linking expenses lives in the Finance module (requirements §FIN-1).
 */
export function OrderExpensesTable({ orderId }: { orderId: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `loading` starts true; set state only from async callbacks (never
  // synchronously in the effect body) per react-hooks/set-state-in-effect.
  useEffect(() => {
    let active = true;
    financeService
      .listExpenses({ orderId })
      .then((list) => {
        if (active) setExpenses(list.filter((expense) => !expense.deleted));
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
  }, [orderId]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-paper-line bg-white">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          Витрати
        </h2>
        {!loading && !error && expenses.length > 0 && (
          <span className="font-mono text-xs text-ink-soft tabular-nums">
            {formatMoney(total)}
          </span>
        )}
      </div>

      {error ? (
        <p className="px-5 pb-6 text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="px-5 pb-6 font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
          Завантаження…
        </p>
      ) : expenses.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-ink-soft">
          До цього замовлення не прив&apos;язано витрат.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
              <th className="px-5 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium">Опис</th>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-5 py-3 text-right font-medium">Сума</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr
                key={expense._id}
                className="border-b border-paper-line/70 last:border-0"
              >
                <td className="px-5 py-3 text-ink">
                  {expense.type
                    ? (EXPENSE_TYPE_LABELS[expense.type] ?? expense.type)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {expense.description || "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {formatTimestamp(expense.time)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-ink">
                  {formatMoney(expense.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
