"use client";

import { useState, type FormEvent } from "react";

import { Modal } from "@/shared/ui/modal";
import { financeService } from "@/shared/api/finance-service";
import { getErrorMessage } from "@/shared/api/error";
import { fieldClass, labelClass } from "@/shared/ui/form";
import { useUsers } from "@/shared/users/users-context";
import {
  EXPENSE_TYPES,
  EXPENSE_TYPE_LABELS,
  type ExpenseType,
} from "@/shared/domain/expense";
import type { Order } from "@/shared/domain/order";
import { userFullName } from "@/shared/domain/user";

interface ExpenseCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  orders: Order[];
}

/** Records a new expense. UAH input is converted to the server's negative kopiykas. */
export function ExpenseCreateModal({
  open,
  onClose,
  onCreated,
  orders,
}: ExpenseCreateModalProps) {
  const { users } = useUsers();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<ExpenseType | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [orderId, setOrderId] = useState("");
  const [cardOwner, setCardOwner] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setAmount("");
    setType("");
    setDate("");
    setTime("");
    setOrderId("");
    setCardOwner("");
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const dateTime = new Date(`${date}T${time || "00:00"}`);
      await financeService.createExpense({
        amount: Math.round(parseFloat(amount) * 100) * -1,
        time: Math.floor(dateTime.getTime() / 1000),
        deleted: false,
        ...(type ? { type } : {}),
        ...(orderId ? { orderId } : {}),
        ...(cardOwner ? { cardOwner } : {}),
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Нова витрата">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="expense-amount" className={labelClass}>
              Сума, ₴
            </label>
            <input
              id="expense-amount"
              type="number"
              step="0.01"
              min={0}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="expense-type" className={labelClass}>
              Тип
            </label>
            <select
              id="expense-type"
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
            <label htmlFor="expense-date" className={labelClass}>
              Дата
            </label>
            <input
              id="expense-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="expense-time" className={labelClass}>
              Час
            </label>
            <input
              id="expense-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="expense-order" className={labelClass}>
            Замовлення
          </label>
          <select
            id="expense-order"
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
          <label htmlFor="expense-owner" className={labelClass}>
            Власник картки
          </label>
          <select
            id="expense-owner"
            value={cardOwner}
            onChange={(e) => setCardOwner(e.target.value)}
            className={fieldClass}
          >
            <option value="">—</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {userFullName(user)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-paper-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Створення…" : "Створити"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
