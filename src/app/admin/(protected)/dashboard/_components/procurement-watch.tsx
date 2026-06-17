"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { orderService } from "@/shared/api/order-service";
import { getErrorMessage } from "@/shared/api/error";
import { useUsers } from "@/shared/users/users-context";
import {
  ORDER_STATES,
  ORDER_STATE_COLORS,
  ORDER_STATE_LABELS,
  type Order,
  type OrderState,
} from "@/shared/domain/order";
import { StateTag } from "@/shared/ui/state-tag";

/** States that are considered "in progress" for procurement. */
const ACTIVE_ORDER_STATES: OrderState[] = ORDER_STATES.filter(
  (s) => s !== "sold",
);

interface CounterpartyGroup {
  counterparty: string;
  stateCounts: Partial<Record<OrderState, number>>;
  orders: Order[];
}

interface ProcurementWatchProps {
  reloadKey: number;
}

export function ProcurementWatch({ reloadKey }: ProcurementWatchProps) {
  const { nameOf } = useUsers();
  const [groups, setGroups] = useState<CounterpartyGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    orderService
      .list()
      .then((orders) => {
        if (!active) return;

        // Keep only in-progress orders.
        const active_orders = orders.filter((o) =>
          ACTIVE_ORDER_STATES.includes(o.state),
        );

        // Group by counterparty (undefined → "no-counterparty" bucket).
        const map = new Map<string, Order[]>();
        for (const order of active_orders) {
          const key = order.counterparty ?? "__none__";
          const existing = map.get(key);
          if (existing) {
            existing.push(order);
          } else {
            map.set(key, [order]);
          }
        }

        const result: CounterpartyGroup[] = [];
        for (const [key, orderList] of map.entries()) {
          const stateCounts: Partial<Record<OrderState, number>> = {};
          for (const order of orderList) {
            stateCounts[order.state] = (stateCounts[order.state] ?? 0) + 1;
          }
          result.push({ counterparty: key, stateCounts, orders: orderList });
        }

        // Sort: groups with counterparty first, then none.
        result.sort((a, b) => {
          if (a.counterparty === "__none__") return 1;
          if (b.counterparty === "__none__") return -1;
          return nameOf(a.counterparty).localeCompare(nameOf(b.counterparty), "uk");
        });

        setGroups(result);
        setError(null);
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
  // nameOf is stable (memoized in context), but we don't need it as a dependency
  // since it's only used for the final sort — a refresh key change reloads anyway.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  return (
    <section className="space-y-4">
      <h2 className="font-mono text-xs font-medium tracking-[0.12em] text-ink-soft uppercase">
        Закупівлі
      </h2>

      <div className="overflow-hidden rounded-2xl border border-paper-line bg-white">
        {error ? (
          <p className="px-4 py-6 text-center text-xs text-red-600">{error}</p>
        ) : loading ? (
          <p className="px-4 py-8 text-center font-mono text-xs tracking-[0.1em] text-ink-soft uppercase">
            Завантаження…
          </p>
        ) : !groups || groups.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            Немає активних замовлень
          </p>
        ) : (
          <div className="divide-y divide-paper-line">
            {groups.map((group) => (
              <CounterpartyRow
                key={group.counterparty}
                group={group}
                name={
                  group.counterparty === "__none__"
                    ? "Без контрагента"
                    : nameOf(group.counterparty)
                }
                counterpartyId={
                  group.counterparty === "__none__" ? "" : group.counterparty
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CounterpartyRow({
  group,
  name,
  counterpartyId,
}: {
  group: CounterpartyGroup;
  name: string;
  counterpartyId: string;
}) {
  const total = group.orders.length;

  const ordersHref = counterpartyId
    ? `/admin/orders?counterparty=${counterpartyId}`
    : "/admin/orders";

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={ordersHref}
          className="text-sm font-medium text-ink transition-colors hover:text-accent"
        >
          {name}
        </Link>
        <span className="font-mono text-xs tabular-nums text-ink-soft">
          {total} {total === 1 ? "замовлення" : "замовлень"}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {ORDER_STATES.filter(
          (s) => s !== "sold" && (group.stateCounts[s] ?? 0) > 0,
        ).map((state) => (
          <Link
            key={state}
            href={
              counterpartyId
                ? `/admin/orders?state=${state}&counterparty=${counterpartyId}`
                : `/admin/orders?state=${state}`
            }
            className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
          >
            <StateTag
              label={`${ORDER_STATE_LABELS[state]} · ${group.stateCounts[state]}`}
              color={ORDER_STATE_COLORS[state]}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
