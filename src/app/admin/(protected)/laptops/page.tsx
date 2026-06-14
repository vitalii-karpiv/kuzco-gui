"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Trash2 } from "lucide-react";

import { laptopService } from "@/shared/api/laptop-service";
import { getErrorMessage } from "@/shared/api/error";
import { useUsers } from "@/shared/users/users-context";
import { formatMoney } from "@/shared/format";
import { exportLaptopsToExcel } from "@/shared/export/laptop-export";
import {
  ACTIVE_LAPTOP_STATES,
  LAPTOP_STATES,
  LAPTOP_STATE_COLORS,
  LAPTOP_STATE_LABELS,
  type Laptop,
  type LaptopState,
} from "@/shared/domain/laptop";
import { Modal } from "@/shared/ui/modal";
import {
  LaptopFilterBar,
  type LaptopFilterState,
  type LaptopSort,
} from "./_components/laptop-filter-bar";
import { CreateLaptopModal } from "./_components/create-laptop-modal";

/** Translate the UI filter state into the server list DTO. */
function buildFilter(filter: LaptopFilterState, sort: LaptopSort | null) {
  return {
    stateList: filter.stateList.length ? filter.stateList : undefined,
    name: filter.name.trim() || undefined,
    ram: filter.ram,
    ssd: filter.ssd,
    screenSize: filter.screenSize,
    panelType: filter.panelType,
    touch: filter.touch,
    discrete: filter.discrete,
    keyLight: filter.keyLight,
    inGroup: filter.inGroup,
    sorters: sort ? { [sort.field]: sort.dir } : undefined,
  };
}

export default function LaptopsPage() {
  const router = useRouter();
  const { nameOf } = useUsers();

  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [filter, setFilter] = useState<LaptopFilterState>({
    stateList: ACTIVE_LAPTOP_STATES,
    name: "",
  });
  const [sort, setSort] = useState<LaptopSort | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Laptop | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingStateId, setSavingStateId] = useState<string | null>(null);

  const dto = useMemo(() => buildFilter(filter, sort), [filter, sort]);

  // Re-fetch whenever the filter, sort, or manual reload key changes. State is
  // set only from async callbacks (never synchronously in the effect body).
  useEffect(() => {
    let active = true;
    laptopService
      .list(dto)
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
  }, [dto, reloadKey]);

  // Loading is toggled from event handlers (allowed) so the spinner shows on
  // filter/sort/refresh without tripping react-hooks/set-state-in-effect.
  const handleFilterChange = useCallback((next: LaptopFilterState) => {
    setLoading(true);
    setError(null);
    setFilter(next);
  }, []);

  const handleSortChange = useCallback((next: LaptopSort | null) => {
    setLoading(true);
    setSort(next);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  async function handleSetState(laptop: Laptop, state: LaptopState) {
    if (state === laptop.state) return;
    setSavingStateId(laptop._id);
    setError(null);
    try {
      const updated = await laptopService.setState(laptop._id, state);
      setLaptops((prev) =>
        prev.map((l) => (l._id === laptop._id ? { ...l, state: updated.state } : l)),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingStateId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await laptopService.remove(pendingDelete._id);
      setPendingDelete(null);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
              /admin/laptops
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              Ноутбуки
            </h1>
            <p className="text-sm text-ink-soft">
              Інвентар. Показано: {laptops.length}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => exportLaptopsToExcel(laptops)}
              disabled={laptops.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-paper-line bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="size-4" strokeWidth={2} />
              Експорт в Excel
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Новий ноутбук
            </button>
          </div>
        </div>

        {/* Filters */}
        <LaptopFilterBar
          value={filter}
          onChange={handleFilterChange}
          sort={sort}
          onSortChange={handleSortChange}
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
          ) : laptops.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-ink-soft">
              Ноутбуків не знайдено.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
                  <th className="px-4 py-3 font-medium">Код</th>
                  <th className="px-4 py-3 font-medium">Назва</th>
                  <th className="px-4 py-3 font-medium">Стан</th>
                  <th className="px-4 py-3 font-medium">Виконавець</th>
                  <th className="px-4 py-3 text-right font-medium">Ціни</th>
                  <th className="px-4 py-3 font-medium">Група</th>
                  <th className="px-4 py-3 text-right font-medium">Дії</th>
                </tr>
              </thead>
              <tbody>
                {laptops.map((laptop) => (
                  <tr
                    key={laptop._id}
                    onClick={() => router.push(`/admin/laptops/${laptop._id}`)}
                    className="cursor-pointer border-b border-paper-line/70 transition-colors last:border-0 hover:bg-paper/50"
                  >
                    <td className="px-4 py-3 align-top">
                      <span className="font-mono text-xs text-ink-soft">
                        {laptop.code}
                      </span>
                      {laptop.serviceTag && (
                        <span className="block font-mono text-[10px] text-ink-soft/70">
                          #{laptop.serviceTag}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2.5">
                        {laptop.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={laptop.imageUrl}
                            alt=""
                            className="size-9 shrink-0 rounded-md object-cover"
                          />
                        )}
                        <span className="font-medium text-ink">{laptop.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={laptop.state}
                        disabled={savingStateId === laptop._id}
                        onChange={(e) =>
                          void handleSetState(laptop, e.target.value as LaptopState)
                        }
                        style={{ color: LAPTOP_STATE_COLORS[laptop.state] }}
                        className="rounded-lg border border-paper-line bg-white px-2 py-1 text-xs font-medium outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
                      >
                        {LAPTOP_STATES.map((state) => (
                          <option key={state} value={state} className="text-ink">
                            {LAPTOP_STATE_LABELS[state]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top text-ink-soft">
                      {nameOf(laptop.assignee)}
                    </td>
                    <td className="px-4 py-3 align-top text-right text-xs tabular-nums">
                      <span className="block text-ink-soft">
                        {formatMoney(laptop.costPrice)}
                      </span>
                      <span className="block text-ink-soft">
                        {formatMoney(laptop.limitPrice)}
                      </span>
                      <span className="block font-medium text-ink">
                        {formatMoney(laptop.sellPrice)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {laptop.laptopGroupId ? (
                        <span className="inline-flex rounded-full bg-accent-dim px-2 py-0.5 text-xs font-medium text-accent">
                          У групі
                        </span>
                      ) : (
                        <span className="text-ink-soft">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(laptop);
                          }}
                          aria-label={`Видалити ${laptop.code}`}
                          className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateLaptopModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refresh}
      />

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Видалити ноутбук?"
      >
        <p className="text-sm text-ink-soft">
          Ноутбук{" "}
          <span className="font-medium text-ink">{pendingDelete?.name}</span> буде
          видалено. Цю дію не можна скасувати.
        </p>
        <div className="flex justify-end gap-3 pt-5">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className="rounded-lg border border-paper-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Видалення…" : "Видалити"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
