"use client";

import { useState, type FormEvent } from "react";

import { Modal } from "@/shared/ui/modal";
import { StateTag } from "@/shared/ui/state-tag";
import { stockService } from "@/shared/api/stock-service";
import { getErrorMessage } from "@/shared/api/error";
import {
  STOCK_STATE_COLORS,
  STOCK_STATE_LABELS,
  STOCK_TYPES,
  STOCK_TYPE_LABELS,
  type Stock,
  type StockType,
} from "@/shared/domain/stock";
import { LaptopPicker } from "./laptop-picker";

const fieldClass =
  "w-full rounded-lg border border-paper-line bg-paper/40 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent";
const labelClass =
  "block font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase";

interface EditStockModalProps {
  /** The item being edited, or `null` when the modal is closed. */
  stock: Stock | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditStockModal({
  stock,
  onClose,
  onSaved,
}: EditStockModalProps) {
  return (
    <Modal open={stock !== null} onClose={onClose} title="Редагувати позицію">
      {/* Remount per item so the form seeds cleanly from props (no effect). */}
      {stock && (
        <EditStockForm
          key={stock._id}
          stock={stock}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

function EditStockForm({
  stock,
  onClose,
  onSaved,
}: {
  stock: Stock;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(stock.name);
  const [price, setPrice] = useState(String(stock.price));
  const [type, setType] = useState<StockType>(stock.type);
  const [laptopId, setLaptopId] = useState<string | null>(
    stock.laptopId ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await stockService.update({
        id: stock._id,
        name: name.trim(),
        price: Number(price),
        type,
        laptopId: laptopId ?? null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs tracking-[0.1em] text-ink-soft">
          {stock.code}
        </span>
        <StateTag
          label={STOCK_STATE_LABELS[stock.state]}
          color={STOCK_STATE_COLORS[stock.state]}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-stock-name" className={labelClass}>
          Назва
        </label>
        <input
          id="edit-stock-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="edit-stock-type" className={labelClass}>
            Тип
          </label>
          <select
            id="edit-stock-type"
            required
            value={type}
            onChange={(e) => setType(e.target.value as StockType)}
            className={fieldClass}
          >
            {STOCK_TYPES.map((value) => (
              <option key={value} value={value}>
                {STOCK_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="edit-stock-price" className={labelClass}>
            Ціна, ₴
          </label>
          <input
            id="edit-stock-price"
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
        <span className={labelClass}>Ноутбук</span>
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
          {submitting ? "Збереження…" : "Зберегти"}
        </button>
      </div>
    </form>
  );
}
