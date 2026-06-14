"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { laptopService } from "@/shared/api/laptop-service";
import { getErrorMessage } from "@/shared/api/error";
import { StateTag } from "@/shared/ui/state-tag";
import { formatMoney } from "@/shared/format";
import {
  LAPTOP_STATE_COLORS,
  LAPTOP_STATE_LABELS,
  type Laptop,
} from "@/shared/domain/laptop";

export function OrderLaptopsTable({ orderId }: { orderId: string }) {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `loading` starts true; set state only from async callbacks (never
  // synchronously in the effect body) per react-hooks/set-state-in-effect.
  useEffect(() => {
    let active = true;
    laptopService
      .list({ orderId })
      .then((list) => {
        if (active) setLaptops(list);
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
  }, [orderId]);

  return (
    <section className="overflow-hidden rounded-2xl border border-paper-line bg-white">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          Ноутбуки
        </h2>
        {!loading && !error && (
          <span className="font-mono text-xs text-ink-soft">
            {laptops.length}
          </span>
        )}
      </div>

      {error ? (
        <p className="px-5 pb-6 text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="px-5 pb-6 font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
          Завантаження…
        </p>
      ) : laptops.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-ink-soft">
          До цього замовлення не прив&apos;язано ноутбуків.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
              <th className="px-5 py-3 font-medium">Код</th>
              <th className="px-4 py-3 font-medium">Назва</th>
              <th className="px-4 py-3 font-medium">Стан</th>
              <th className="px-4 py-3 text-right font-medium">Собівартість</th>
              <th className="px-4 py-3 text-right font-medium">Ліміт</th>
              <th className="px-5 py-3 text-right font-medium">Ціна продажу</th>
            </tr>
          </thead>
          <tbody>
            {laptops.map((laptop) => (
              <tr
                key={laptop._id}
                className="border-b border-paper-line/70 transition-colors last:border-0 hover:bg-paper/50"
              >
                <td className="px-5 py-3 font-mono text-xs text-ink-soft">
                  <Link
                    href={`/admin/laptops/${laptop._id}`}
                    className="hover:text-accent hover:underline"
                  >
                    {laptop.code}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium text-ink">{laptop.name}</td>
                <td className="px-4 py-3">
                  <StateTag
                    label={LAPTOP_STATE_LABELS[laptop.state] ?? laptop.state}
                    color={LAPTOP_STATE_COLORS[laptop.state] ?? "#64748b"}
                  />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                  {formatMoney(laptop.costPrice)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                  {formatMoney(laptop.limitPrice)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-ink">
                  {formatMoney(laptop.sellPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
