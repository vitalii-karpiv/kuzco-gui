"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { cardClass } from "@/shared/ui/form";
import { StateTag } from "@/shared/ui/state-tag";
import {
  LAPTOP_STATE_COLORS,
  LAPTOP_STATE_LABELS,
  type Laptop,
} from "@/shared/domain/laptop";

interface SaleLaptopCardProps {
  laptop: Laptop | null;
}

export function SaleLaptopCard({ laptop }: SaleLaptopCardProps) {
  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          Ноутбук
        </h2>
        {laptop && (
          <Link
            href={`/admin/laptops/${laptop._id}`}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase transition-colors hover:text-ink"
          >
            Відкрити
            <ExternalLink className="size-3.5" strokeWidth={2} />
          </Link>
        )}
      </div>

      {!laptop ? (
        <p className="text-sm text-ink-soft">Ноутбук не знайдено.</p>
      ) : (
        <div className="flex items-start gap-3">
          {laptop.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={laptop.imageUrl}
              alt=""
              className="size-14 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 space-y-2">
            <p className="font-medium text-ink">{laptop.name}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-mono text-xs text-ink-soft">{laptop.code}</span>
              {laptop.serviceTag && (
                <span className="font-mono text-xs text-ink-soft">
                  #{laptop.serviceTag}
                </span>
              )}
              <StateTag
                label={LAPTOP_STATE_LABELS[laptop.state]}
                color={LAPTOP_STATE_COLORS[laptop.state]}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
