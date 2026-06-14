"use client";

import { useState, type FormEvent } from "react";
import { Plus, ShoppingCart, X } from "lucide-react";

import { laptopService } from "@/shared/api/laptop-service";
import { stockService } from "@/shared/api/stock-service";
import { getErrorMessage } from "@/shared/api/error";
import { Modal } from "@/shared/ui/modal";
import { cardClass, fieldClass, labelClass } from "@/shared/ui/form";
import {
  STOCK_TYPES,
  STOCK_TYPE_LABELS,
  type StockType,
} from "@/shared/domain/stock";
import type { Laptop } from "@/shared/domain/laptop";

interface ToBuyCardProps {
  laptop: Laptop;
  onChange: (laptop: Laptop) => void;
}

export function ToBuyCard({ laptop, onChange }: ToBuyCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState("");
  const [buying, setBuying] = useState<string | null>(null);
  const toBuy = laptop.toBuy ?? [];

  async function saveToBuy(next: string[]) {
    setError(null);
    try {
      const updated = await laptopService.update({ id: laptop._id, toBuy: next });
      onChange(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function addItem() {
    const value = adding.trim();
    if (!value) return;
    setAdding("");
    void saveToBuy([...toBuy, value]);
  }

  return (
    <section className={cardClass}>
      <h2 className="mb-4 font-display text-lg font-extrabold tracking-tight text-ink">
        Потрібно купити
      </h2>

      <div className="mb-3 flex items-center gap-2">
        <input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="Додати позицію…"
          className={fieldClass}
        />
        <button
          type="button"
          onClick={addItem}
          aria-label="Додати"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-paper-line p-2 text-ink-soft transition-colors hover:text-ink"
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </button>
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {toBuy.length === 0 ? (
        <p className="text-sm text-ink-soft">Список порожній.</p>
      ) : (
        <ul className="space-y-2">
          {toBuy.map((item, index) => (
            <li
              key={index}
              className="flex items-center justify-between gap-2 rounded-lg bg-paper/50 px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm text-ink">{item}</span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBuying(item)}
                  aria-label="Купити"
                  className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-accent-dim hover:text-accent"
                >
                  <ShoppingCart className="size-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => void saveToBuy(toBuy.filter((_, i) => i !== index))}
                  aria-label="Видалити"
                  className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <BuyModal
        item={buying}
        laptopId={laptop._id}
        onClose={() => setBuying(null)}
        onBought={(boughtItem) =>
          void saveToBuy(toBuy.filter((i) => i !== boughtItem))
        }
      />
    </section>
  );
}

function BuyModal({
  item,
  laptopId,
  onClose,
  onBought,
}: {
  item: string | null;
  laptopId: string;
  onClose: () => void;
  onBought: (item: string) => void;
}) {
  const [price, setPrice] = useState("");
  const [type, setType] = useState<StockType>("ram");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;
    setSubmitting(true);
    setError(null);
    try {
      await stockService.create({
        name: item,
        price: Number(price) || 0,
        type,
        laptopId,
      });
      onBought(item);
      setPrice("");
      setType("ram");
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={item !== null} onClose={onClose} title={item ?? ""}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="buy-price" className={labelClass}>
              Ціна
            </label>
            <input
              id="buy-price"
              type="number"
              min={0}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="buy-type" className={labelClass}>
              Тип
            </label>
            <select
              id="buy-type"
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
            {submitting ? "Купівля…" : "Купити"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
