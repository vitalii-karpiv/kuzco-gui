"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saleService } from "@/shared/api/sale-service";
import { laptopService } from "@/shared/api/laptop-service";
import { cardClass, cardTitleClass } from "@/shared/ui/form";
import { StateTag } from "@/shared/ui/state-tag";
import { formatDate, formatMoney } from "@/shared/format";
import type { Laptop } from "@/shared/domain/laptop";
import {
  SALE_STATE_COLORS,
  SALE_STATE_LABELS,
  type Sale,
} from "@/shared/domain/sale";

interface CustomerSalesTableProps {
  customerId: string;
  /** The current sale, excluded from the list. */
  currentSaleId: string;
}

export function CustomerSalesTable({
  customerId,
  currentSaleId,
}: CustomerSalesTableProps) {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [laptopMap, setLaptopMap] = useState<Record<string, Laptop>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    saleService
      .list({ customerId })
      .then(async (list) => {
        const others = list.filter((s) => s._id !== currentSaleId);
        if (!active) return;
        setSales(others);
        const ids = Array.from(new Set(others.map((s) => s.laptopId)));
        if (ids.length > 0) {
          const laptops = await laptopService.list({ idList: ids });
          if (active) setLaptopMap(Object.fromEntries(laptops.map((l) => [l._id, l])));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [customerId, currentSaleId]);

  if (!loaded || sales.length === 0) return null;

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Інші продажі клієнта ({sales.length})</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
              <th className="px-3 py-2 font-medium">Код</th>
              <th className="px-3 py-2 font-medium">Ноутбук</th>
              <th className="px-3 py-2 text-right font-medium">Ціна</th>
              <th className="px-3 py-2 font-medium">Дата</th>
              <th className="px-3 py-2 font-medium">Стан</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr
                key={sale._id}
                onClick={() => router.push(`/admin/sales/${sale._id}`)}
                className="cursor-pointer border-b border-paper-line/70 transition-colors last:border-0 hover:bg-paper/50"
              >
                <td className="px-3 py-2 font-mono text-xs text-ink-soft">
                  {sale.code}
                </td>
                <td className="px-3 py-2 text-ink">
                  {laptopMap[sale.laptopId]?.name ?? "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">
                  {formatMoney(sale.price)}
                </td>
                <td className="px-3 py-2 text-ink-soft">{formatDate(sale.date)}</td>
                <td className="px-3 py-2">
                  <StateTag
                    label={SALE_STATE_LABELS[sale.state]}
                    color={SALE_STATE_COLORS[sale.state]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
