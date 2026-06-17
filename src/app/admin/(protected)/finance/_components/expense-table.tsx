"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";

import { financeService } from "@/shared/api/finance-service";
import { orderService } from "@/shared/api/order-service";
import { getErrorMessage } from "@/shared/api/error";
import { formatExpenseAmount, formatTimestamp } from "@/shared/format";
import { useUsers } from "@/shared/users/users-context";
import { EXPENSE_TYPE_LABELS, type Expense } from "@/shared/domain/expense";
import type { Order } from "@/shared/domain/order";
import { rangeToSeconds, type FinanceDateRange } from "./date-range";
import { ExpenseCreateModal } from "./expense-create-modal";
import { ExpenseDetailModal } from "./expense-detail-modal";

interface ExpenseTableProps {
  range: FinanceDateRange;
  reloadKey: number;
  onMutate: () => void;
}

export function ExpenseTable({ range, reloadKey, onMutate }: ExpenseTableProps) {
  const { nameOf } = useUsers();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);

  // Orders are needed to render the linked-order column + pickers.
  useEffect(() => {
    let active = true;
    orderService
      .list()
      .then((list) => {
        if (active) setOrders(list);
      })
      .catch(() => {
        // Non-fatal: order codes degrade to ids.
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Set state only from async callbacks (never synchronously in the effect
  // body) per react-hooks/set-state-in-effect.
  useEffect(() => {
    let active = true;
    const { from, to } = rangeToSeconds(range);
    financeService
      .listExpenses({ timeFrom: from, timeTo: to, deleted: false })
      .then((list) => {
        if (!active) return;
        setExpenses(list.filter((expense) => !expense.deleted));
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

  const orderMap = useMemo(
    () => new Map(orders.map((order) => [order._id, order])),
    [orders],
  );

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const now = Math.floor(Date.now() / 1000);
      await financeService.syncExpenses(now - 86400, now);
      onMutate();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-paper-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
            Витрати
          </h2>
          {!loading && !error && expenses.length > 0 && (
            <span className="font-mono text-xs text-ink-soft tabular-nums">
              {formatExpenseAmount(total)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg border border-paper-line px-3 py-1.5 text-sm text-ink-soft transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`size-3.5 ${syncing ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
            Синхронізувати
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Додати витрату
          </button>
        </div>
      </div>

      {error ? (
        <p className="px-5 pb-6 text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="px-5 pb-6 font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
          Завантаження…
        </p>
      ) : expenses.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-ink-soft">
          За обраний період витрат немає.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
              <th className="px-5 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium">Опис</th>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Замовлення</th>
              <th className="px-4 py-3 font-medium">Власник картки</th>
              <th className="px-5 py-3 text-right font-medium">Сума</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr
                key={expense._id}
                onClick={() => setSelected(expense)}
                className="cursor-pointer border-b border-paper-line/70 transition-colors last:border-0 hover:bg-paper/50"
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
                  {formatTimestamp(expense.time * 1000)}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {expense.orderId
                    ? (orderMap.get(expense.orderId)?.code ?? "—")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {expense.cardOwner ? nameOf(expense.cardOwner) : "—"}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-ink">
                  {formatExpenseAmount(expense.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ExpenseCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onMutate}
        orders={orders}
      />
      <ExpenseDetailModal
        expense={selected}
        orders={orders}
        onClose={() => setSelected(null)}
        onChanged={onMutate}
      />
    </section>
  );
}
