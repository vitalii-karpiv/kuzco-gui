"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { saleService } from "@/shared/api/sale-service";
import { laptopService } from "@/shared/api/laptop-service";
import { getErrorMessage } from "@/shared/api/error";
import { useUsers } from "@/shared/users/users-context";
import { formatDate, formatMoney } from "@/shared/format";
import type { Laptop } from "@/shared/domain/laptop";
import {
  SALE_SOURCE_LABELS,
  SALE_STATE_COLORS,
  SALE_STATE_LABELS,
  type Sale,
} from "@/shared/domain/sale";
import { Modal } from "@/shared/ui/modal";
import { StateTag } from "@/shared/ui/state-tag";
import {
  SaleFilterBar,
  type SaleFilterState,
} from "./_components/sale-filter-bar";
import { RegisterSaleModal } from "./_components/register-sale-modal";

/** Translate the UI filter state into the server list DTO. */
function buildFilter(filter: SaleFilterState) {
  return {
    state: filter.stateList.length ? filter.stateList : undefined,
    source: filter.source,
    dateRange:
      filter.dateFrom && filter.dateTo
        ? { from: filter.dateFrom, to: filter.dateTo }
        : undefined,
    sorters: { date: filter.dateSort },
  };
}

export default function SalesPage() {
  const router = useRouter();
  const { nameOf } = useUsers();

  const [sales, setSales] = useState<Sale[]>([]);
  const [laptopMap, setLaptopMap] = useState<Record<string, Laptop>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [filter, setFilter] = useState<SaleFilterState>({
    stateList: [],
    dateFrom: "",
    dateTo: "",
    dateSort: -1,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dto = useMemo(() => buildFilter(filter), [filter]);

  // Re-fetch on filter/reload change. State is set only from async callbacks
  // (never synchronously in the effect body — react-hooks/set-state-in-effect).
  useEffect(() => {
    let active = true;
    saleService
      .list(dto)
      .then(async (list) => {
        if (!active) return;
        setSales(list);
        // Enrich with laptop names/codes for the table.
        const ids = Array.from(new Set(list.map((s) => s.laptopId)));
        if (ids.length === 0) {
          setLaptopMap({});
          return;
        }
        const laptops = await laptopService.list({ idList: ids });
        if (!active) return;
        setLaptopMap(Object.fromEntries(laptops.map((l) => [l._id, l])));
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

  // Loading is toggled from event handlers (allowed) so the spinner shows on
  // filter/refresh without tripping react-hooks/set-state-in-effect.
  const handleFilterChange = useCallback((next: SaleFilterState) => {
    setLoading(true);
    setError(null);
    setFilter(next);
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
      await saleService.remove(pendingDelete._id);
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
              /admin/sales
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              Продажі
            </h1>
            <p className="text-sm text-ink-soft">Показано: {sales.length}</p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Зареєструвати продаж
          </button>
        </div>

        {/* Filters */}
        <SaleFilterBar
          value={filter}
          onChange={handleFilterChange}
          loading={loading}
          onRefresh={refresh}
        />

        {/* Content */}
        <div className="overflow-hidden rounded-2xl border border-paper-line bg-white">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
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
          ) : sales.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-ink-soft">
              Продажів не знайдено.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
                  <th className="px-4 py-3 font-medium">Код</th>
                  <th className="px-4 py-3 font-medium">Ноутбук</th>
                  <th className="px-4 py-3 text-right font-medium">Ціна</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Джерело</th>
                  <th className="px-4 py-3 font-medium">Виконавець</th>
                  <th className="px-4 py-3 font-medium">Стан</th>
                  <th className="px-4 py-3 text-right font-medium">Дії</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const laptop = laptopMap[sale.laptopId];
                  return (
                    <tr
                      key={sale._id}
                      onClick={() => router.push(`/admin/sales/${sale._id}`)}
                      className="cursor-pointer border-b border-paper-line/70 transition-colors last:border-0 hover:bg-paper/50"
                    >
                      <td className="px-4 py-3 align-top font-mono text-xs text-ink-soft">
                        {sale.code}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2.5">
                          {laptop?.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={laptop.imageUrl}
                              alt=""
                              className="size-9 shrink-0 rounded-md object-cover"
                            />
                          )}
                          <span className="font-medium text-ink">
                            {laptop?.name ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-right tabular-nums text-ink">
                        {formatMoney(sale.price)}
                      </td>
                      <td className="px-4 py-3 align-top text-ink-soft">
                        {formatDate(sale.date)}
                      </td>
                      <td className="px-4 py-3 align-top text-ink-soft">
                        {sale.source ? SALE_SOURCE_LABELS[sale.source] : "—"}
                      </td>
                      <td className="px-4 py-3 align-top text-ink-soft">
                        {nameOf(sale.assignee)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StateTag
                          label={SALE_STATE_LABELS[sale.state]}
                          color={SALE_STATE_COLORS[sale.state]}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingDelete(sale);
                            }}
                            aria-label={`Видалити ${sale.code}`}
                            className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-4" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <RegisterSaleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refresh}
      />

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Видалити продаж?"
      >
        <p className="text-sm text-ink-soft">
          Продаж{" "}
          <span className="font-medium text-ink">{pendingDelete?.code}</span> буде
          видалено, а ноутбук повернеться у продаж. Цю дію не можна скасувати.
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
