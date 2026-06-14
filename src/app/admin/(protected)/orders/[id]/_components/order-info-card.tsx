"use client";

import { useEffect, useState } from "react";

import { orderService } from "@/shared/api/order-service";
import { financeService } from "@/shared/api/finance-service";
import { getErrorMessage } from "@/shared/api/error";
import { useUsers } from "@/shared/users/users-context";
import { userFullName } from "@/shared/domain/user";
import { formatMoney } from "@/shared/format";
import type { Order } from "@/shared/domain/order";

const fieldClass =
  "w-full rounded-lg border border-paper-line bg-paper/40 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent";
const labelClass =
  "block font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase";

/** ISO date string → `yyyy-mm-dd` for a native date input (empty when invalid). */
function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

interface OrderInfoCardProps {
  order: Order;
  onChange: (order: Order) => void;
}

export function OrderInfoCard({ order, onChange }: OrderInfoCardProps) {
  const { users } = useUsers();
  const [error, setError] = useState<string | null>(null);
  const [cogs, setCogs] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    financeService
      .getOrderCostPrice(order._id)
      .then((value) => {
        if (active) setCogs(value);
      })
      .catch(() => {
        if (active) setCogs(null);
      });
    return () => {
      active = false;
    };
  }, [order._id, order.itemsInLot]);

  async function save(patch: Partial<Order>) {
    setError(null);
    try {
      const updated = await orderService.update({ id: order._id, ...patch });
      onChange(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const costPerLaptop =
    cogs != null && order.itemsInLot > 0 ? cogs / order.itemsInLot : null;

  return (
    <section className="rounded-2xl border border-paper-line bg-white p-5">
      <h2 className="mb-4 font-display text-lg font-extrabold tracking-tight text-ink">
        Інформація
      </h2>

      {/* COGS summary */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-paper/60 px-3 py-2.5">
          <p className={labelClass}>Собівартість лоту</p>
          <p className="mt-0.5 text-sm font-semibold text-ink tabular-nums">
            {cogs == null ? "—" : formatMoney(cogs)}
          </p>
        </div>
        <div className="rounded-lg bg-paper/60 px-3 py-2.5">
          <p className={labelClass}>Собівартість / ноутбук</p>
          <p className="mt-0.5 text-sm font-semibold text-ink tabular-nums">
            {costPerLaptop == null ? "—" : formatMoney(costPerLaptop)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="info-items" className={labelClass}>
              К-сть у лоті
            </label>
            <input
              id="info-items"
              type="number"
              min={1}
              defaultValue={order.itemsInLot}
              onBlur={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next) && next !== order.itemsInLot) {
                  void save({ itemsInLot: next });
                }
              }}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="info-date" className={labelClass}>
              Дата купівлі
            </label>
            <input
              id="info-date"
              type="date"
              defaultValue={toDateInputValue(order.dateOfPurchase)}
              onBlur={(e) => {
                const value = e.target.value;
                if (!value) return;
                const iso = new Date(value).toISOString();
                if (iso !== order.dateOfPurchase) {
                  void save({ dateOfPurchase: iso });
                }
              }}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="info-ebay" className={labelClass}>
            eBay URL
          </label>
          <input
            id="info-ebay"
            type="url"
            defaultValue={order.ebayUrl ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (order.ebayUrl ?? "")) {
                void save({ ebayUrl: e.target.value });
              }
            }}
            placeholder="https://ebay.com/…"
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="info-shipping" className={labelClass}>
            URL доставки
          </label>
          <input
            id="info-shipping"
            type="url"
            defaultValue={order.shippingUrl ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (order.shippingUrl ?? "")) {
                void save({ shippingUrl: e.target.value });
              }
            }}
            placeholder="https://…"
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="info-counterparty" className={labelClass}>
            Контрагент
          </label>
          <select
            id="info-counterparty"
            value={order.counterparty ?? ""}
            onChange={(e) => void save({ counterparty: e.target.value })}
            className={fieldClass}
          >
            <option value="">— не призначено —</option>
            {/* Keep the current value selectable even if it's not in the list. */}
            {order.counterparty &&
              !users.some((u) => u._id === order.counterparty) && (
                <option value={order.counterparty}>{order.counterparty}</option>
              )}
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {userFullName(user)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="info-note" className={labelClass}>
            Нотатка
          </label>
          <textarea
            id="info-note"
            rows={3}
            defaultValue={order.note ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (order.note ?? "")) {
                void save({ note: e.target.value });
              }
            }}
            className={`${fieldClass} resize-none`}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
