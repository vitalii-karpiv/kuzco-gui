"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { orderService } from "@/shared/api/order-service";
import { getErrorMessage } from "@/shared/api/error";
import {
  ORDER_STATES,
  ORDER_STATE_LABELS,
  type Order,
  type OrderState,
} from "@/shared/domain/order";
import { OrderInfoCard } from "./_components/order-info-card";
import { OrderStateTimeline } from "./_components/order-state-timeline";
import { OrderLaptopsTable } from "./_components/order-laptops-table";
import { OrderExpensesTable } from "./_components/order-expenses-table";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingState, setSavingState] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    orderService
      .get(id)
      .then((data) => setOrder(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    orderService
      .get(id)
      .then((data) => {
        if (active) setOrder(data);
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
  }, [id]);

  useEffect(() => {
    if (order) document.title = order.code;
  }, [order]);

  async function handleSetState(state: OrderState) {
    if (!order || state === order.state) return;
    setSavingState(true);
    setError(null);
    try {
      const updated = await orderService.setState(order._id, state);
      setOrder(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingState(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 font-mono text-xs tracking-[0.1em] text-ink-soft uppercase transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2.5} />
          Замовлення
        </Link>

        {error && !order ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-paper-line bg-white px-6 py-16 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={load}
              className="rounded-lg border border-paper-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-paper"
            >
              Спробувати ще раз
            </button>
          </div>
        ) : loading || !order ? (
          <p className="px-6 py-16 text-center font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
            Завантаження…
          </p>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
                  {order.code}
                </p>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
                  {order.name}
                </h1>
              </div>
              <label className="flex items-center gap-2">
                <span className="font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">
                  Стан
                </span>
                <select
                  value={order.state}
                  disabled={savingState}
                  onChange={(e) =>
                    void handleSetState(e.target.value as OrderState)
                  }
                  className="rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ORDER_STATES.map((value) => (
                    <option key={value} value={value}>
                      {ORDER_STATE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Inline error for state changes (order still loaded) */}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {/* Info + timeline */}
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <OrderInfoCard order={order} onChange={setOrder} />
              <OrderStateTimeline order={order} />
            </div>

            {/* Related laptops */}
            <OrderLaptopsTable orderId={order._id} />

            {/* Linked expenses */}
            <OrderExpensesTable orderId={order._id} />
          </>
        )}
      </div>
    </main>
  );
}
