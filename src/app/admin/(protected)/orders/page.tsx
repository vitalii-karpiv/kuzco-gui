"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { orderService } from "@/shared/api/order-service";
import { getErrorMessage } from "@/shared/api/error";
import { formatDate } from "@/shared/format";
import { StateTag } from "@/shared/ui/state-tag";
import { Modal } from "@/shared/ui/modal";
import {
  ORDER_STATES,
  ORDER_STATE_COLORS,
  ORDER_STATE_LABELS,
  type Order,
  type OrderState,
} from "@/shared/domain/order";
import { CreateOrderModal } from "./_components/create-order-modal";

type StateFilter = OrderState | "all";

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>(() => {
    const raw = searchParams.get("state") ?? "";
    return ORDER_STATES.includes(raw as OrderState) ? (raw as OrderState) : "all";
  });
  const [counterpartyFilter] = useState<string>(
    () => searchParams.get("counterparty") ?? "",
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await orderService.list());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch — set state only from async callbacks (never synchronously
  // in the effect body) to satisfy react-hooks/set-state-in-effect.
  useEffect(() => {
    let active = true;
    orderService
      .list()
      .then((list) => {
        if (active) setOrders(list);
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
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders
      .filter((o) => (stateFilter === "all" ? true : o.state === stateFilter))
      .filter((o) =>
        counterpartyFilter ? o.counterparty === counterpartyFilter : true,
      )
      .filter((o) =>
        query
          ? o.name.toLowerCase().includes(query) ||
            o.code.toLowerCase().includes(query)
          : true,
      )
      .slice()
      .sort(
        (a, b) =>
          new Date(b.dateOfPurchase).getTime() -
          new Date(a.dateOfPurchase).getTime(),
      );
  }, [orders, search, stateFilter, counterpartyFilter]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await orderService.remove(pendingDelete._id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
              /admin/orders
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              Замовлення
            </h1>
            <p className="text-sm text-ink-soft">
              Закупівлі та доставки. Усього: {orders.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Нове замовлення
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за назвою або кодом…"
              className="w-full rounded-lg border border-paper-line bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value as StateFilter)}
            className="rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="all">Всі стани</option>
            {ORDER_STATES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATE_LABELS[value]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            aria-label="Оновити"
            className="inline-flex items-center justify-center rounded-lg border border-paper-line bg-white p-2 text-ink-soft transition-colors hover:text-ink"
          >
            <RefreshCw
              className={`size-4 ${loading ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-hidden rounded-2xl border border-paper-line bg-white">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg border border-paper-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-paper"
              >
                Спробувати ще раз
              </button>
            </div>
          ) : loading ? (
            <p className="px-6 py-16 text-center font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
              Завантаження…
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-ink-soft">
              {orders.length === 0
                ? "Замовлень ще немає."
                : "Замовлень не знайдено."}
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
                  <th className="px-4 py-3 font-medium">Код</th>
                  <th className="px-4 py-3 font-medium">Назва</th>
                  <th className="px-4 py-3 font-medium">Стан</th>
                  <th className="px-4 py-3 font-medium">Дата купівлі</th>
                  <th className="px-4 py-3 text-right font-medium">
                    К-сть у лоті
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Дії</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => router.push(`/admin/orders/${order._id}`)}
                    className="cursor-pointer border-b border-paper-line/70 transition-colors last:border-0 hover:bg-paper/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                      {order.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {order.name}
                    </td>
                    <td className="px-4 py-3">
                      <StateTag
                        label={ORDER_STATE_LABELS[order.state]}
                        color={ORDER_STATE_COLORS[order.state]}
                      />
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {formatDate(order.dateOfPurchase)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink">
                      {order.itemsInLot}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(order);
                          }}
                          aria-label={`Видалити ${order.code}`}
                          className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateOrderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void load()}
      />

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Видалити замовлення?"
      >
        <p className="text-sm text-ink-soft">
          Замовлення{" "}
          <span className="font-medium text-ink">{pendingDelete?.name}</span>{" "}
          буде видалено разом із пов&apos;язаними ноутбуками. Цю дію не можна
          скасувати.
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
