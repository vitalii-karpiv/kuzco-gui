"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { laptopGroupService } from "@/shared/api/laptop-group-service";
import { getErrorMessage } from "@/shared/api/error";
import {
  PANEL_TYPE_LABELS,
  REFRESH_RATE_LABELS,
  RESOLUTION_LABELS,
} from "@/shared/domain/laptop";
import {
  LAPTOP_GROUP_STATE_COLORS,
  LAPTOP_GROUP_STATE_LABELS,
  MARKETPLACE_LABELS,
  laptopCountOf,
  type LaptopGroup,
  type MarketplaceCode,
} from "@/shared/domain/laptop-group";
import { StateTag } from "@/shared/ui/state-tag";
import {
  GroupFilterBar,
  type GroupFilterState,
} from "./_components/group-filter-bar";

/** Build a muted "Intel · RTX · 14\" · Full HD · IPS · 144 Гц" spec sub-line. */
function specSummary(group: LaptopGroup): string {
  const parts: string[] = [];
  if (group.processor) parts.push(group.processor);
  if (group.videocard) parts.push(group.videocard);
  const display: string[] = [];
  if (group.screenSize) display.push(`${group.screenSize}"`);
  if (group.resolution)
    display.push(RESOLUTION_LABELS[group.resolution] ?? group.resolution);
  if (group.panelType)
    display.push(
      PANEL_TYPE_LABELS[group.panelType as never] ?? group.panelType.toUpperCase(),
    );
  if (group.refreshRate)
    display.push(REFRESH_RATE_LABELS[group.refreshRate] ?? group.refreshRate);
  if (display.length) parts.push(display.join(" "));
  return parts.join(" · ");
}

function buildFilter(filter: GroupFilterState) {
  return {
    groupName: filter.groupName.trim() || undefined,
    state: filter.stateList.length ? filter.stateList : undefined,
    isInstagramPublished: filter.isInstagramPublished,
  };
}

export default function LaptopGroupsPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<LaptopGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const [filter, setFilter] = useState<GroupFilterState>({
    groupName: "",
    stateList: [],
  });

  const dto = useMemo(() => buildFilter(filter), [filter]);

  // Re-fetch on filter/reload change. State is set only from async callbacks
  // (never synchronously in the effect body — react-hooks/set-state-in-effect).
  useEffect(() => {
    let active = true;
    laptopGroupService
      .list(dto)
      .then((list) => {
        if (active) setGroups(list);
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
  }, [dto, reloadKey]);

  // Loading is toggled from event handlers (allowed) so the spinner shows on
  // filter/refresh without tripping react-hooks/set-state-in-effect.
  const handleFilterChange = useCallback((next: GroupFilterState) => {
    setLoading(true);
    setError(null);
    setFilter(next);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  async function handleToggleMarketplace(
    group: LaptopGroup,
    code: MarketplaceCode,
  ) {
    const key = `${group._id}-${code}`;
    setTogglingKey(key);
    setError(null);
    try {
      const updated = await laptopGroupService.toggleMarketplacePublished(
        group._id,
        code,
      );
      setGroups((prev) => prev.map((g) => (g._id === group._id ? updated : g)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingKey(null);
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
              /admin/laptop-groups
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              Групи
            </h1>
            <p className="text-sm text-ink-soft">
              Каталог і публікація. Показано: {groups.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <GroupFilterBar
          value={filter}
          onChange={handleFilterChange}
          loading={loading}
          onRefresh={refresh}
        />

        {/* Content */}
        <div className="overflow-hidden rounded-2xl border border-paper-line bg-white">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={refresh}
                className="rounded-lg border border-paper-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-paper"
              >
                Спробувати ще раз
              </button>
            </div>
          ) : loading ? (
            <p className="px-6 py-16 text-center font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
              Завантаження…
            </p>
          ) : groups.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-ink-soft">
              Груп не знайдено.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
                  <th className="px-4 py-3 font-medium">Назва</th>
                  <th className="px-4 py-3 font-medium">Стан</th>
                  <th className="px-4 py-3 font-medium">Маркетплейси</th>
                  <th className="px-4 py-3 text-right font-medium">Ноутбуки</th>
                  <th className="px-4 py-3 font-medium">Нотатка</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const summary = specSummary(group);
                  return (
                    <tr
                      key={group._id}
                      onClick={() =>
                        router.push(`/admin/laptop-groups/${group._id}`)
                      }
                      className="cursor-pointer border-b border-paper-line/70 transition-colors last:border-0 hover:bg-paper/50"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-2.5">
                          {group.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={group.imageUrl}
                              alt=""
                              className="size-9 shrink-0 rounded-md object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="font-medium text-ink">
                              {group.title ?? group.groupName ?? "—"}
                            </span>
                            {summary && (
                              <span className="block text-xs text-ink-soft">
                                {summary}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StateTag
                          label={LAPTOP_GROUP_STATE_LABELS[group.state]}
                          color={LAPTOP_GROUP_STATE_COLORS[group.state]}
                        />
                      </td>
                      <td
                        className="px-4 py-3 align-top"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {group.marketplaces && group.marketplaces.length > 0 ? (
                          <div className="space-y-1.5">
                            {group.marketplaces.map((marketplace) => {
                              const key = `${group._id}-${marketplace.code}`;
                              const busy = togglingKey === key;
                              return (
                                <label
                                  key={marketplace.code}
                                  className="flex items-center gap-2 text-xs text-ink-soft"
                                >
                                  <input
                                    type="checkbox"
                                    checked={marketplace.published}
                                    disabled={busy}
                                    onChange={() =>
                                      void handleToggleMarketplace(
                                        group,
                                        marketplace.code,
                                      )
                                    }
                                    className="size-4 rounded border-paper-line accent-accent disabled:opacity-50"
                                  />
                                  {MARKETPLACE_LABELS[marketplace.code] ??
                                    marketplace.code}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-right tabular-nums text-ink">
                        {laptopCountOf(group)}
                      </td>
                      <td className="px-4 py-3 align-top text-ink-soft">
                        {group.note ? (
                          <span className="line-clamp-2 max-w-xs whitespace-pre-line">
                            {group.note}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
