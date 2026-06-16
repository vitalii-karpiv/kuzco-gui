"use client";

import { useState, type FormEvent } from "react";

import { Modal } from "@/shared/ui/modal";
import { stockService } from "@/shared/api/stock-service";
import { getErrorMessage } from "@/shared/api/error";
import {
  STOCK_TYPES,
  STOCK_TYPE_LABELS,
  type StockType,
} from "@/shared/domain/stock";
import { LaptopPicker } from "./laptop-picker";

const fieldClass =
  "w-full rounded-lg border border-paper-line bg-paper/40 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent";
const labelClass =
  "block font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase";

interface CreateStockModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateStockModal({
  open,
  onClose,
  onCreated,
}: CreateStockModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<StockType | "">("");
  const [quantity, setQuantity] = useState("1");
  const [laptopId, setLaptopId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setPrice("");
    setType("");
    setQuantity("1");
    setLaptopId(null);
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!type) return;
    setSubmitting(true);
    setError(null);
    try {
      await stockService.create({
        name: name.trim(),
        price: Number(price),
        type,
        quantity: Math.max(1, Number(quantity) || 1),
        ...(laptopId ? { laptopId } : {}),
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
    <Modal open={open} onClose={onClose} title="Нова позиція">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="stock-name" className={labelClass}>
            Назва
          </label>
          <input
            id="stock-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Напр. Samsung 8GB DDR4"
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="stock-type" className={labelClass}>
              Тип
            </label>
            <select
              id="stock-type"
              required
              value={type}
              onChange={(e) => setType(e.target.value as StockType)}
              className={fieldClass}
            >
              <option value="" disabled>
                Оберіть тип…
              </option>
              {STOCK_TYPES.map((value) => (
                <option key={value} value={value}>
                  {STOCK_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="stock-price" className={labelClass}>
              Ціна, ₴
            </label>
            <input
              id="stock-price"
              type="number"
              min={0}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="stock-quantity" className={labelClass}>
            Кількість
          </label>
          <input
            id="stock-quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <span className={labelClass}>Ноутбук (необов&apos;язково)</span>
          <LaptopPicker value={laptopId} onChange={setLaptopId} />
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
