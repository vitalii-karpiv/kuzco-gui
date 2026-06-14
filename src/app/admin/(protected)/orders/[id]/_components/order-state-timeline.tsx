"use client";

import { StateTag } from "@/shared/ui/state-tag";
import { formatDate } from "@/shared/format";
import {
  ORDER_STATE_COLORS,
  ORDER_STATE_LABELS,
  type Order,
  type OrderState,
} from "@/shared/domain/order";

/** Resolve label/color for a history state, tolerating unknown values. */
function tagFor(state: string) {
  const known = state as OrderState;
  return {
    label: ORDER_STATE_LABELS[known] ?? state,
    color: ORDER_STATE_COLORS[known] ?? "#64748b",
  };
}

export function OrderStateTimeline({ order }: { order: Order }) {
  const history = order.stateHistory ?? [];

  return (
    <section className="rounded-2xl border border-paper-line bg-white p-5">
      <h2 className="mb-4 font-display text-lg font-extrabold tracking-tight text-ink">
        Історія станів
      </h2>

      {history.length === 0 ? (
        <p className="text-sm text-ink-soft">Історія станів порожня.</p>
      ) : (
        <ol className="space-y-4">
          {history
            .slice()
            .reverse()
            .map((item, index) => {
              const tag = tagFor(item.state);
              return (
                <li
                  key={`${item.timestamp}-${index}`}
                  className="flex items-start gap-3"
                >
                  <span className="mt-1.5 flex flex-col items-center">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {index < history.length - 1 && (
                      <span className="mt-1 h-6 w-px bg-paper-line" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <StateTag label={tag.label} color={tag.color} />
                    <p className="mt-1 text-xs text-ink-soft">
                      {formatDate(item.timestamp)}
                      {item.initiator ? ` · ${item.initiator}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
        </ol>
      )}
    </section>
  );
}
