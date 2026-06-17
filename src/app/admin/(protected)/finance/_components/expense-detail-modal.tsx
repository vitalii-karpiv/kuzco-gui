"use client";

import { useState, type FormEvent } from "react";
import { Trash2, SplitSquareHorizontal } from "lucide-react";

import { Modal } from "@/shared/ui/modal";
import { financeService } from "@/shared/api/finance-service";
import { getErrorMessage } from "@/shared/api/error";
import { fieldClass, labelClass } from "@/shared/ui/form";
import {
  EXPENSE_TYPES,
  EXPENSE_TYPE_LABELS,
  type Expense,
  type ExpenseType,
} from "@/shared/domain/expense";
import type { Order } from "@/shared/domain/order";

interface ExpenseDetailModalProps {
  /** The expense being viewed, or `null` when the modal is closed. */
  expense: Expense | null;
  orders: Order[];
  onClose: () => void;
  onChanged: () => void;
}

export function ExpenseDetailModal({
  expense,
  orders,
  onClose,
  onChanged,
}: ExpenseDetailModalProps) {
  return (
    <Modal open={expense !== null} onClose={onClose} title="Витрата">
      {/* Remount per item so the form seeds cleanly from props (no effect). */}
      {expense && (
        <ExpenseDetailForm
          key={expense._id}
          expense={expense}
          orders={orders}
          onClose={onClose}
          onChanged={onChanged}
        />
      )}
    </Modal>
  );
}

/** UAH amount for a stored negative-kopiyka value. */
function toUah(kopiykas: number): number {
  return (kopiykas / 100) * -1;
}

/** Negative-kopiyka value for a UAH input. */
function toKopiykas(uah: number): number {
  return Math.round(uah * 100) * -1;
}

function inputDate(seconds: number): string {
  const d = new Date(seconds * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function inputTime(seconds: number): string {
  const d = new Date(seconds * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function ExpenseDetailForm({
  expense,
  orders,
  onClose,
  onChanged,
}: {
  expense: Expense;
  orders: Order[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const originalUah = toUah(expense.amount);

  const [amount, setAmount] = useState(String(originalUah));
  const [type, setType] = useState<ExpenseType | "">(expense.type ?? "");
  const [date, setDate] = useState(inputDate(expense.time));
  const [time, setTime] = useState(inputTime(expense.time));
  const [orderId, setOrderId] = useState(expense.orderId ?? "");
  const [description, setDescription] = useState(expense.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [splitOpen, setSplitOpen] = useState(false);
  const [parts, setParts] = useState<string[]>([]);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const dateTime = new Date(`${date}T${time || "00:00"}`);
      await financeService.updateExpense({
        id: expense._id,
        amount: toKopiykas(parseFloat(amount)),
        time: Math.floor(dateTime.getTime() / 1000),
        ...(type ? { type } : {}),
        ...(orderId ? { orderId } : {}),
        description: description.trim(),
      });
      onChanged();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("Видалити цю витрату?")) return;
    setSubmitting(true);
    setError(null);
    try {
      await financeService.deleteExpense(expense._id);
      onChanged();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  function setPartsCount(count: number) {
    const safe = Math.max(2, count);
    const each = (originalUah / safe).toFixed(2);
    setParts(Array.from({ length: safe }, () => each));
  }

  function openSplit() {
    setSplitOpen(true);
    setPartsCount(2);
  }

  const partsSum = parts.reduce((sum, part) => sum + (parseFloat(part) || 0), 0);
  const splitValid =
    parts.length >= 2 && Math.abs(partsSum - originalUah) < 0.01;

  async function onSplit() {
    if (!splitValid) return;
    setSubmitting(true);
    setError(null);
    try {
      // Keep the original record as the first part, then add the rest. Times
      // must be unique, so each new part is offset by one second.
      await financeService.updateExpense({
        id: expense._id,
        amount: toKopiykas(parseFloat(parts[0])),
      });
      for (let i = 1; i < parts.length; i += 1) {
        await financeService.createExpense({
          amount: toKopiykas(parseFloat(parts[i])),
          time: expense.time + i,
          deleted: false,
          ...(expense.type ? { type: expense.type } : {}),
          ...(expense.orderId ? { orderId: expense.orderId } : {}),
          ...(expense.cardOwner ? { cardOwner: expense.cardOwner } : {}),
          ...(expense.description ? { description: expense.description } : {}),
        });
      }
      onChanged();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSave}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="detail-amount" className={labelClass}>
            Сума, ₴
          </label>
          <input
            id="detail-amount"
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="detail-type" className={labelClass}>
            Тип
          </label>
          <select
            id="detail-type"
            value={type}
            onChange={(e) => setType(e.target.value as ExpenseType | "")}
            className={fieldClass}
          >
            <option value="">—</option>
            {EXPENSE_TYPES.map((value) => (
              <option key={value} value={value}>
                {EXPENSE_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="detail-date" className={labelClass}>
            Дата
          </label>
          <input
            id="detail-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="detail-time" className={labelClass}>
            Час
          </label>
          <input
            id="detail-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="detail-order" className={labelClass}>
          Замовлення
        </label>
        <select
          id="detail-order"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className={fieldClass}
        >
          <option value="">— Без замовлення</option>
          {orders.map((order) => (
            <option key={order._id} value={order._id}>
              {order.code} — {order.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="detail-description" className={labelClass}>
          Опис
        </label>
        <textarea
          id="detail-description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${fieldClass} resize-none`}
        />
      </div>

      {splitOpen && (
        <div className="space-y-3 rounded-xl border border-paper-line bg-paper/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className={labelClass}>Розділити на частини</span>
            <input
              type="number"
              min={2}
              value={parts.length}
              onChange={(e) => setPartsCount(Number(e.target.value))}
              className={`${fieldClass} w-20`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {parts.map((part, index) => (
              <input
                key={index}
                type="number"
                step="0.01"
                value={part}
                onChange={(e) =>
                  setParts((prev) =>
                    prev.map((p, i) => (i === index ? e.target.value : p)),
                  )
                }
                className={fieldClass}
              />
            ))}
          </div>
          <p
            className={`text-xs ${splitValid ? "text-ink-soft" : "text-red-600"}`}
          >
            Сума частин: {partsSum.toFixed(2)} ₴ / {originalUah.toFixed(2)} ₴
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSplitOpen(false)}
              className="rounded-lg border border-paper-line px-3 py-1.5 text-sm text-ink transition-colors hover:bg-paper"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={onSplit}
              disabled={!splitValid || submitting}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Розділити
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg border border-paper-line px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="size-4" strokeWidth={2} />
            Видалити
          </button>
          {!splitOpen && (
            <button
              type="button"
              onClick={openSplit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg border border-paper-line px-3 py-2 text-sm text-ink-soft transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SplitSquareHorizontal className="size-4" strokeWidth={2} />
              Розділити
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-paper-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
          >
            Закрити
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Збереження…" : "Зберегти"}
          </button>
        </div>
      </div>
    </form>
  );
}
