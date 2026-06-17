"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { laptopService } from "@/shared/api/laptop-service";
import { saleService } from "@/shared/api/sale-service";
import { getErrorMessage } from "@/shared/api/error";
import {
  LAPTOP_STATE_COLORS,
  LAPTOP_STATE_LABELS,
  type LaptopState,
} from "@/shared/domain/laptop";
import {
  SALE_STATE_COLORS,
  SALE_STATE_LABELS,
} from "@/shared/domain/sale";

/** Laptop states that need actionable attention (excludes done/selling/delivering). */
const QUEUE_STATES: LaptopState[] = [
  "toService",
  "toTest",
  "toPhotoSession",
  "toPublish",
  "waitingForApproval",
  "waitingForDelivery",
];

interface QueueCard {
  label: string;
  count: number;
  color: string;
  href: string;
}

interface LifecycleQueuesProps {
  reloadKey: number;
}

export function LifecycleQueues({ reloadKey }: LifecycleQueuesProps) {
  const [cards, setCards] = useState<QueueCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      laptopService.list({ stateList: QUEUE_STATES }),
      saleService.list({ state: ["toApprove"] }),
    ])
      .then(([laptops, pendingSales]) => {
        if (!active) return;

        // Group laptops by state.
        const counts: Partial<Record<LaptopState, number>> = {};
        for (const laptop of laptops) {
          counts[laptop.state] = (counts[laptop.state] ?? 0) + 1;
        }

        const laptopCards: QueueCard[] = QUEUE_STATES.map((state) => ({
          label: LAPTOP_STATE_LABELS[state],
          count: counts[state] ?? 0,
          color: LAPTOP_STATE_COLORS[state],
          href: `/admin/laptops?state=${state}`,
        }));

        const saleCard: QueueCard = {
          label: SALE_STATE_LABELS["toApprove"],
          count: pendingSales.length,
          color: SALE_STATE_COLORS["toApprove"],
          href: `/admin/sales?state=toApprove`,
        };

        setCards([...laptopCards, saleCard]);
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
    <section className="space-y-3">
      <h2 className="font-mono text-xs font-medium tracking-[0.12em] text-ink-soft uppercase">
        Робочі черги
      </h2>

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {(cards ?? QUEUE_STATES.map((s) => ({ label: LAPTOP_STATE_LABELS[s], count: 0, color: LAPTOP_STATE_COLORS[s], href: "#" }))).map(
            (card) => (
              <QueueCard key={card.label} card={card} loading={loading} />
            ),
          )}
        </div>
      )}
    </section>
  );
}

function QueueCard({ card, loading }: { card: QueueCard; loading: boolean }) {
  return (
    <Link
      href={card.href}
      className="group relative overflow-hidden rounded-2xl border border-paper-line bg-white p-4 transition-colors hover:border-ink/15"
    >
      <span
        className="absolute top-0 left-0 h-full w-[3px] transition-opacity opacity-0 group-hover:opacity-100"
        style={{ backgroundColor: card.color }}
      />
      <div className="flex items-start justify-between gap-1">
        <p
          className="text-xs font-medium leading-snug text-ink"
          style={{ color: card.color }}
        >
          {card.label}
        </p>
        <ArrowRight
          className="mt-0.5 size-3.5 shrink-0 text-ink-soft/40 transition-colors group-hover:text-ink-soft"
          strokeWidth={2}
        />
      </div>
      <p
        className={`mt-3 font-display text-3xl font-extrabold tabular-nums ${loading ? "text-paper-line" : "text-ink"}`}
      >
        {loading ? "—" : card.count}
      </p>
    </Link>
  );
}
