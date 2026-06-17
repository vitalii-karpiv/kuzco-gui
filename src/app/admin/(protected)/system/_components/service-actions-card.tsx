"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { financeService } from "@/shared/api/finance-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass, cardTitleClass, fieldClass, labelClass } from "@/shared/ui/form";

interface ActionState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

const idle: ActionState = { loading: false, success: false, error: null };

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoToUnix(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

/** Maintenance sync actions reusing the finance-service. */
export function ServiceActionsCard() {
  const [balanceState, setBalanceState] = useState<ActionState>(idle);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [expenseFrom, setExpenseFrom] = useState(
    thirtyDaysAgo.toISOString().slice(0, 10),
  );
  const [expenseTo, setExpenseTo] = useState(todayIso());
  const [expenseState, setExpenseState] = useState<ActionState>(idle);

  async function syncBalances() {
    setBalanceState({ loading: true, success: false, error: null });
    try {
      await financeService.syncBalances();
      setBalanceState({ loading: false, success: true, error: null });
    } catch (err) {
      setBalanceState({
        loading: false,
        success: false,
        error: getErrorMessage(err),
      });
    }
  }

  async function syncExpenses() {
    setExpenseState({ loading: true, success: false, error: null });
    try {
      await financeService.syncExpenses(
        isoToUnix(expenseFrom),
        isoToUnix(expenseTo),
      );
      setExpenseState({ loading: false, success: true, error: null });
    } catch (err) {
      setExpenseState({
        loading: false,
        success: false,
        error: getErrorMessage(err),
      });
    }
  }

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Обслуговування</h2>

      <div className="space-y-6">
        {/* Balance sync */}
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Синхронізувати баланси</p>
          <p className="mb-3 text-xs text-ink-soft">
            Оновлює залишки на рахунках з Monobank.
          </p>
          {balanceState.error && (
            <p className="mb-2 text-xs text-red-600">{balanceState.error}</p>
          )}
          {balanceState.success && (
            <p className="mb-2 text-xs text-emerald-600">Баланси синхронізовано.</p>
          )}
          <button
            type="button"
            onClick={syncBalances}
            disabled={balanceState.loading}
            className="inline-flex items-center gap-2 rounded-lg border border-paper-line px-4 py-2 text-sm text-ink-soft transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`size-3.5 ${balanceState.loading ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
            {balanceState.loading ? "Синхронізація…" : "Синхронізувати баланси"}
          </button>
        </div>

        <hr className="border-paper-line" />

        {/* Expense sync */}
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Синхронізувати витрати</p>
          <p className="mb-3 text-xs text-ink-soft">
            Підтягує транзакції з банку за вказаний діапазон дат.
          </p>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="expense-from">
                Від
              </label>
              <input
                id="expense-from"
                type="date"
                value={expenseFrom}
                onChange={(e) => setExpenseFrom(e.target.value)}
                max={expenseTo}
                className={`mt-1 ${fieldClass}`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="expense-to">
                До
              </label>
              <input
                id="expense-to"
                type="date"
                value={expenseTo}
                onChange={(e) => setExpenseTo(e.target.value)}
                min={expenseFrom}
                max={todayIso()}
                className={`mt-1 ${fieldClass}`}
              />
            </div>
          </div>
          {expenseState.error && (
            <p className="mb-2 text-xs text-red-600">{expenseState.error}</p>
          )}
          {expenseState.success && (
            <p className="mb-2 text-xs text-emerald-600">Витрати синхронізовано.</p>
          )}
          <button
            type="button"
            onClick={syncExpenses}
            disabled={expenseState.loading || !expenseFrom || !expenseTo}
            className="inline-flex items-center gap-2 rounded-lg border border-paper-line px-4 py-2 text-sm text-ink-soft transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`size-3.5 ${expenseState.loading ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
            {expenseState.loading ? "Синхронізація…" : "Синхронізувати витрати"}
          </button>
        </div>
      </div>
    </section>
  );
}
