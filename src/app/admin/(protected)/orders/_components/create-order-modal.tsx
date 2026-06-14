"use client";

import { useState, type FormEvent } from "react";

import { Modal } from "@/shared/ui/modal";
import { orderService } from "@/shared/api/order-service";
import { getErrorMessage } from "@/shared/api/error";
import {
  ORDER_STATES,
  ORDER_STATE_LABELS,
  type OrderState,
} from "@/shared/domain/order";

const fieldClass =
  "w-full rounded-lg border border-paper-line bg-paper/40 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent";
const labelClass =
  "block font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase";

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateOrderModal({
  open,
  onClose,
  onCreated,
}: CreateOrderModalProps) {
  const [name, setName] = useState("");
  const [dateOfPurchase, setDateOfPurchase] = useState("");
  const [itemsInLot, setItemsInLot] = useState("1");
  const [state, setState] = useState<OrderState>("inUsa");
  const [ebayUrl, setEbayUrl] = useState("");
  const [shippingUrl, setShippingUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setDateOfPurchase("");
    setItemsInLot("1");
    setState("inUsa");
    setEbayUrl("");
    setShippingUrl("");
    setNote("");
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await orderService.create({
        name: name.trim(),
        dateOfPurchase: new Date(dateOfPurchase).toISOString(),
        itemsInLot: Number(itemsInLot),
        state,
        ...(ebayUrl.trim() ? { ebayUrl: ebayUrl.trim() } : {}),
        ...(shippingUrl.trim() ? { shippingUrl: shippingUrl.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
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
    <Modal open={open} onClose={onClose} title="Нове замовлення">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="order-name" className={labelClass}>
            Назва
          </label>
          <input
            id="order-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Напр. Dell Latitude лот ×5"
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="order-date" className={labelClass}>
              Дата купівлі
            </label>
            <input
              id="order-date"
              type="date"
              required
              value={dateOfPurchase}
              onChange={(e) => setDateOfPurchase(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="order-items" className={labelClass}>
              К-сть у лоті
            </label>
            <input
              id="order-items"
              type="number"
              min={1}
              required
              value={itemsInLot}
              onChange={(e) => setItemsInLot(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="order-state" className={labelClass}>
            Стан
          </label>
          <select
            id="order-state"
            value={state}
            onChange={(e) => setState(e.target.value as OrderState)}
            className={fieldClass}
          >
            {ORDER_STATES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="order-ebay" className={labelClass}>
              eBay URL
            </label>
            <input
              id="order-ebay"
              type="url"
              value={ebayUrl}
              onChange={(e) => setEbayUrl(e.target.value)}
              placeholder="https://ebay.com/…"
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="order-shipping" className={labelClass}>
              URL доставки
            </label>
            <input
              id="order-shipping"
              type="url"
              value={shippingUrl}
              onChange={(e) => setShippingUrl(e.target.value)}
              placeholder="https://…"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="order-note" className={labelClass}>
            Нотатка
          </label>
          <textarea
            id="order-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${fieldClass} resize-none`}
          />
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
