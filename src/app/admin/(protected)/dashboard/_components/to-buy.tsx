"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { laptopService } from "@/shared/api/laptop-service";
import { getErrorMessage } from "@/shared/api/error";
import { type Laptop } from "@/shared/domain/laptop";

interface ToBuyProps {
  reloadKey: number;
}

export function ToBuy({ reloadKey }: ToBuyProps) {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    laptopService
      .list({ toBuy: true })
      .then((list) => {
        if (!active) return;
        setLaptops(list);
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
  }, [reloadKey]);

  return (
    <section className="space-y-4">
      <h2 className="font-mono text-xs font-medium tracking-[0.12em] text-ink-soft uppercase">
        Потрібно купити
      </h2>

      <div className="overflow-hidden rounded-2xl border border-paper-line bg-white">
        <div className="border-b border-paper-line px-4 py-2.5">
          <span className="font-mono text-[10px] tracking-[0.12em] text-ink-soft uppercase">
            Ноутбуки з запчастинами ({loading ? "…" : laptops.length})
          </span>
        </div>

        {error ? (
          <p className="px-4 py-6 text-center text-xs text-red-600">{error}</p>
        ) : loading ? (
          <p className="px-4 py-8 text-center font-mono text-xs tracking-[0.1em] text-ink-soft uppercase">
            Завантаження…
          </p>
        ) : laptops.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            Нічого купувати
          </p>
        ) : (
          <ul className="divide-y divide-paper-line/60">
            {laptops.map((laptop) => (
              <li key={laptop._id}>
                <Link
                  href={`/admin/laptops/${laptop._id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper/50"
                >
                  <ShoppingCart
                    className="size-4 shrink-0 text-ink-soft"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {laptop.name}
                    </p>
                    <p className="font-mono text-[10px] text-ink-soft">
                      {laptop.code}
                      {laptop.toBuy && laptop.toBuy.length > 0 && (
                        <span className="ml-2 text-amber">
                          {laptop.toBuy.length} поз.
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
