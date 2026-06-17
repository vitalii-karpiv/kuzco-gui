"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { laptopService } from "@/shared/api/laptop-service";
import { saleService } from "@/shared/api/sale-service";
import { getErrorMessage } from "@/shared/api/error";
import { useAuth } from "@/shared/auth/auth-context";
import { formatMoney } from "@/shared/format";
import {
  ACTIVE_LAPTOP_STATES,
  LAPTOP_STATE_COLORS,
  LAPTOP_STATE_LABELS,
  type Laptop,
} from "@/shared/domain/laptop";
import {
  SALE_STATE_COLORS,
  SALE_STATE_LABELS,
  type Sale,
} from "@/shared/domain/sale";
import { StateTag } from "@/shared/ui/state-tag";

interface MyItemsProps {
  reloadKey: number;
}

export function MyItems({ reloadKey }: MyItemsProps) {
  const { user } = useAuth();
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      laptopService.list({
        assignee: user.id,
        stateList: ACTIVE_LAPTOP_STATES,
      }),
      saleService.list({
        assignee: user.id,
        state: ["new", "toApprove", "delivering"],
      }),
    ])
      .then(([myLaptops, mySales]) => {
        if (!active) return;
        setLaptops(myLaptops);
        setSales(mySales);
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
  }, [user.id, reloadKey]);

  return (
    <section className="space-y-4">
      <h2 className="font-mono text-xs font-medium tracking-[0.12em] text-ink-soft uppercase">
        Мої задачі
      </h2>

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : loading ? (
        <p className="font-mono text-xs tracking-[0.1em] text-ink-soft uppercase">
          Завантаження…
        </p>
      ) : (
        <div className="space-y-4">
          {/* Laptops */}
          <div className="overflow-hidden rounded-2xl border border-paper-line bg-white">
            <div className="border-b border-paper-line px-4 py-2.5">
              <span className="font-mono text-[10px] tracking-[0.12em] text-ink-soft uppercase">
                Ноутбуки ({laptops.length})
              </span>
            </div>
            {laptops.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-soft">
                Немає активних ноутбуків
              </p>
            ) : (
              <ul className="divide-y divide-paper-line/60">
                {laptops.map((laptop) => (
                  <li key={laptop._id}>
                    <Link
                      href={`/admin/laptops/${laptop._id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-paper/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {laptop.name}
                        </p>
                        <p className="font-mono text-[10px] text-ink-soft">
                          {laptop.code}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {laptop.sellPrice != null && (
                          <span className="tabular-nums text-sm text-ink-soft">
                            {formatMoney(laptop.sellPrice)}
                          </span>
                        )}
                        <StateTag
                          label={LAPTOP_STATE_LABELS[laptop.state]}
                          color={LAPTOP_STATE_COLORS[laptop.state]}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sales */}
          <div className="overflow-hidden rounded-2xl border border-paper-line bg-white">
            <div className="border-b border-paper-line px-4 py-2.5">
              <span className="font-mono text-[10px] tracking-[0.12em] text-ink-soft uppercase">
                Продажі ({sales.length})
              </span>
            </div>
            {sales.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-soft">
                Немає активних продажів
              </p>
            ) : (
              <ul className="divide-y divide-paper-line/60">
                {sales.map((sale) => (
                  <li key={sale._id}>
                    <Link
                      href={`/admin/sales/${sale._id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-paper/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] text-ink-soft">
                          {sale.code}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {sale.price != null && (
                          <span className="tabular-nums text-sm text-ink-soft">
                            {formatMoney(sale.price)}
                          </span>
                        )}
                        <StateTag
                          label={SALE_STATE_LABELS[sale.state]}
                          color={SALE_STATE_COLORS[sale.state]}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
