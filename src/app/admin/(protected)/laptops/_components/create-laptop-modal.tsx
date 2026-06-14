"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Modal } from "@/shared/ui/modal";
import { laptopService } from "@/shared/api/laptop-service";
import { orderService } from "@/shared/api/order-service";
import { getErrorMessage } from "@/shared/api/error";
import { useUsers } from "@/shared/users/users-context";
import { userFullName } from "@/shared/domain/user";
import type { Order } from "@/shared/domain/order";

const fieldClass =
  "w-full rounded-lg border border-paper-line bg-paper/40 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent";
const labelClass =
  "block font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase";

interface CreateLaptopModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateLaptopModal({
  open,
  onClose,
  onCreated,
}: CreateLaptopModalProps) {
  const { users } = useUsers();
  const [name, setName] = useState("");
  const [orderId, setOrderId] = useState("");
  const [serviceTag, setServiceTag] = useState("");
  const [assignee, setAssignee] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load the order list once the modal opens (a laptop must belong to an order).
  useEffect(() => {
    if (!open) return;
    let active = true;
    orderService
      .list()
      .then((list) => {
        if (active) setOrders(list);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [open]);

  function reset() {
    setName("");
    setOrderId("");
    setServiceTag("");
    setAssignee("");
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await laptopService.create({
        orderId,
        name: name.trim(),
        ...(serviceTag.trim() ? { serviceTag: serviceTag.trim() } : {}),
        ...(assignee ? { assignee } : {}),
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
    <Modal open={open} onClose={onClose} title="Новий ноутбук">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="laptop-name" className={labelClass}>
            Назва
          </label>
          <input
            id="laptop-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Напр. Dell Latitude 5420"
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="laptop-order" className={labelClass}>
            Замовлення
          </label>
          <select
            id="laptop-order"
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className={fieldClass}
          >
            <option value="" disabled>
              Оберіть замовлення…
            </option>
            {orders.map((order) => (
              <option key={order._id} value={order._id}>
                {order.code} — {order.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="laptop-tag" className={labelClass}>
              Сервісний тег
            </label>
            <input
              id="laptop-tag"
              value={serviceTag}
              onChange={(e) => setServiceTag(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="laptop-assignee" className={labelClass}>
              Виконавець
            </label>
            <select
              id="laptop-assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={fieldClass}
            >
              <option value="">— не призначено —</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {userFullName(user)}
                </option>
              ))}
            </select>
          </div>
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
