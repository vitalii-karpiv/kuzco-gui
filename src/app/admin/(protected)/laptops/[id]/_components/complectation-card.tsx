"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import { stockService } from "@/shared/api/stock-service";
import { getErrorMessage } from "@/shared/api/error";
import { Modal } from "@/shared/ui/modal";
import { cardClass, fieldClass, labelClass } from "@/shared/ui/form";
import { formatMoney } from "@/shared/format";
import {
  STOCK_TYPES,
  STOCK_TYPE_LABELS,
  type Stock,
  type StockType,
} from "@/shared/domain/stock";

export function ComplectationCard({ laptopId }: { laptopId: string }) {
  const [items, setItems] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    let active = true;
    stockService
      .list({ laptopId })
      .then((list) => {
        if (active) setItems(list);
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
  }, [laptopId]);

  async function reload() {
    setItems(await stockService.list({ laptopId }));
  }

  async function unlink(stock: Stock) {
    setError(null);
    try {
      await stockService.setLaptop(stock._id, null);
      await reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          Комплектація
        </h2>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="Додати запчастину"
          className="inline-flex items-center justify-center rounded-lg border border-paper-line p-1.5 text-ink-soft transition-colors hover:text-ink"
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </button>
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
          Завантаження…
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-soft">Запчастин не прив&apos;язано.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item._id}
              className="flex items-center justify-between gap-2 rounded-lg bg-paper/50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{item.name}</p>
                <p className="font-mono text-[11px] text-ink-soft">
                  {STOCK_TYPE_LABELS[item.type] ?? item.type} ·{" "}
                  {formatMoney(item.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void unlink(item)}
                aria-label="Відв'язати"
                className="shrink-0 rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AddStockModal
        open={addOpen}
        laptopId={laptopId}
        onClose={() => setAddOpen(false)}
        onAdded={() => void reload()}
      />
    </section>
  );
}

function AddStockModal({
  open,
  laptopId,
  onClose,
  onAdded,
}: {
  open: boolean;
  laptopId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [type, setType] = useState<StockType>("ram");
  const [free, setFree] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set state only from async callbacks (loading starts true) to satisfy
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!open) return;
    let active = true;
    stockService
      .list({ type, state: "free" })
      .then((list) => {
        if (active) setFree(list);
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
  }, [open, type]);

  async function pick(stock: Stock) {
    setError(null);
    try {
      await stockService.setLaptop(stock._id, laptopId);
      onAdded();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Додати запчастину">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="add-stock-type" className={labelClass}>
            Тип
          </label>
          <select
            id="add-stock-type"
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

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
            Завантаження…
          </p>
        ) : free.length === 0 ? (
          <p className="text-sm text-ink-soft">Немає вільних запчастин цього типу.</p>
        ) : (
          <ul className="max-h-72 space-y-1.5 overflow-y-auto">
            {free.map((stock) => (
              <li key={stock._id}>
                <button
                  type="button"
                  onClick={() => void pick(stock)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-paper-line px-3 py-2 text-left transition-colors hover:border-accent hover:bg-paper"
                >
                  <span className="truncate text-sm text-ink">{stock.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-ink-soft">
                    {formatMoney(stock.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
