"use client";

import { useState, type FormEvent } from "react";

import { Modal } from "@/shared/ui/modal";
import { financeService } from "@/shared/api/finance-service";
import { getErrorMessage } from "@/shared/api/error";
import { fieldClass, labelClass } from "@/shared/ui/form";
import { useUsers } from "@/shared/users/users-context";
import { userFullName } from "@/shared/domain/user";

interface InvestmentCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function InvestmentCreateModal({
  open,
  onClose,
  onCreated,
}: InvestmentCreateModalProps) {
  const { users } = useUsers();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setAmount("");
    setDate("");
    setUserId("");
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await financeService.createInvestment({
        userId,
        date: new Date(date).toISOString(),
        amount: Number(amount),
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
    <Modal open={open} onClose={onClose} title="Нова інвестиція">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="investment-amount" className={labelClass}>
              Сума, ₴
            </label>
            <input
              id="investment-amount"
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
            <label htmlFor="investment-date" className={labelClass}>
              Дата
            </label>
            <input
              id="investment-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="investment-user" className={labelClass}>
            Інвестор
          </label>
          <select
            id="investment-user"
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={fieldClass}
          >
            <option value="">— Оберіть інвестора</option>
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
