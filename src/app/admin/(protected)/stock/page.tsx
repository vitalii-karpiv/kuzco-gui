"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { stockService, type StockListFilter } from "@/shared/api/stock-service";
import { laptopService } from "@/shared/api/laptop-service";
import { getErrorMessage } from "@/shared/api/error";
import { formatMoney } from "@/shared/format";
import { Modal } from "@/shared/ui/modal";
import { StateTag } from "@/shared/ui/state-tag";
import {
  STOCK_STATE_COLORS,
  STOCK_STATE_LABELS,
  STOCK_TYPE_LABELS,
  type Stock,
} from "@/shared/domain/stock";
import {
  StockFilterBar,
  type StockFilterState,
  type StockSort,
} from "./_components/stock-filter-bar";
import { CreateStockModal } from "./_components/create-stock-modal";
import { EditStockModal } from "./_components/edit-stock-modal";

function buildFilter(
  filter: StockFilterState,
  sort: StockSort | null,
): StockListFilter {
  return {
    name: filter.name || undefined,
    type: filter.type,
    state: filter.state,
    ...(sort ? { sorters: { [sort.field]: sort.dir } } : {}),
  };
}

export default function StockPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [laptopLabels, setLaptopLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<StockFilterState>({ name: "" });
  const [sort, setSort] = useState<StockSort | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Stock | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Stock | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dto = useMemo(() => buildFilter(filter, sort), [filter, sort]);

  useEffect(() => {
    let active = true;
    stockService
      .list(dto)
      .then((list) => {
        if (active) setStocks(list);
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
  }, [dto, reloadKey]);

  // Resolve a label for every linked laptop in one batch request.
  const linkedIds = useMemo(
    () => [
      ...new Set(
        stocks.map((s) => s.laptopId).filter((id): id is string => !!id),
      ),
    ],
    [stocks],
  );
  const linkedKey = linkedIds.join(",");
  useEffect(() => {
    let active = true;
    if (linkedIds.length === 0) {
      Promise.resolve().then(() => {
        if (active) setLaptopLabels({});
      });
      return () => {
        active = false;
      };
    }
    laptopService
      .list({ idList: linkedIds })
      .then((list) => {
        if (!active) return;
        const map: Record<string, string> = {};
        for (const laptop of list) map[laptop._id] = laptop.code;
        setLaptopLabels(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedKey]);

  const handleFilterChange = useCallback((next: StockFilterState) => {
    setLoading(true);
    setError(null);
    setFilter(next);
  }, []);

  const handleSortChange = useCallback((next: StockSort | null) => {
    setLoading(true);
    setSort(next);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await stockService.remove(pendingDelete._id);
      setPendingDelete(null);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
              /admin/stock
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              Склад
            </h1>
            <p className="text-sm text-ink-soft">
              Запчастини й комплектація. Показано: {stocks.length}
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            <Plus className="size-4" strokeWidth={2.5} /> Нова позиція
          </button>
        </div>

        {/* Filters */}
        <StockFilterBar
          value={filter}
          onChange={handleFilterChange}
          sort={sort}
          onSortChange={handleSortChange}
          loading={loading}
          onRefresh={refresh}
        />

        {/* Content */}
        <div className="overflow-hidden rounded-2xl border border-paper-line bg-white">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={refresh}
                className="rounded-lg border border-paper-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-paper"
              >
                Спробувати ще раз
              </button>
            </div>
          ) : loading ? (
            <p className="px-6 py-16 text-center font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
              Завантаження…
            </p>
          ) : stocks.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-ink-soft">
              Позицій не знайдено.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
                  <th className="px-4 py-3 font-medium">Код</th>
                  <th className="px-4 py-3 font-medium">Назва</th>
                  <th className="px-4 py-3 font-medium">Тип</th>
                  <th className="px-4 py-3 text-right font-medium">Ціна</th>
                  <th className="px-4 py-3 font-medium">Стан</th>
                  <th className="px-4 py-3 font-medium">Ноутбук</th>
                  <th className="px-4 py-3 text-right font-medium">Дії</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr
                    key={stock._id}
                    onClick={() => setEditing(stock)}
                    className="cursor-pointer border-b border-paper-line/70 transition-colors last:border-0 hover:bg-paper/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                      {stock.code}
                    </td>
                    <td className="px-4 py-3 text-ink">{stock.name}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {STOCK_TYPE_LABELS[stock.type]}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {formatMoney(stock.price)}
                    </td>
                    <td className="px-4 py-3">
                      <StateTag
                        label={STOCK_STATE_LABELS[stock.state]}
                        color={STOCK_STATE_COLORS[stock.state]}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                      {stock.laptopId
                        ? (laptopLabels[stock.laptopId] ?? "…")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(stock);
                        }}
                        aria-label="Видалити позицію"
                        className="rounded-lg border border-paper-line p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateStockModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refresh}
      />

      <EditStockModal
        stock={editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Видалити позицію?"
      >
        <p className="text-sm text-ink-soft">
          Позицію{" "}
          <span className="font-medium text-ink">{pendingDelete?.name}</span>{" "}
          буде видалено. Цю дію не можна скасувати.
        </p>
        <div className="flex justify-end gap-3 pt-5">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className="rounded-lg border border-paper-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Видалення…" : "Видалити"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
