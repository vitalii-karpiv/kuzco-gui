"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Trash2 } from "lucide-react";

import { laptopService } from "@/shared/api/laptop-service";
import { saleService } from "@/shared/api/sale-service";
import { laptopGroupService } from "@/shared/api/laptop-group-service";
import { getErrorMessage } from "@/shared/api/error";
import { useUsers } from "@/shared/users/users-context";
import { userFullName } from "@/shared/domain/user";
import { Modal } from "@/shared/ui/modal";
import { StateTag } from "@/shared/ui/state-tag";
import {
  LAPTOP_STATES,
  LAPTOP_STATE_LABELS,
  type Laptop,
  type LaptopState,
} from "@/shared/domain/laptop";
import {
  LAPTOP_GROUP_STATE_COLORS,
  LAPTOP_GROUP_STATE_LABELS,
  type LaptopGroup,
} from "@/shared/domain/laptop-group";
import {
  SALE_STATE_COLORS,
  SALE_STATE_LABELS,
  type Sale,
} from "@/shared/domain/sale";
import { CharacteristicsCard } from "./_components/characteristics-card";
import { TechCheckCard } from "./_components/tech-check-card";
import { FinanceCard } from "./_components/finance-card";
import { DefectsCard } from "./_components/defects-card";
import { ImageManager } from "./_components/image-manager";
import { ComplectationCard } from "./_components/complectation-card";
import { ToBuyCard } from "./_components/to-buy-card";
import { CreateSaleModal } from "./_components/create-sale-modal";

export default function LaptopDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { users, nameOf } = useUsers();

  const [laptop, setLaptop] = useState<Laptop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingState, setSavingState] = useState(false);
  const [savingAssignee, setSavingAssignee] = useState(false);

  const [sale, setSale] = useState<Sale | null>(null);
  const [group, setGroup] = useState<LaptopGroup | null>(null);
  const [groupBusy, setGroupBusy] = useState(false);

  const [createSaleOpen, setCreateSaleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    laptopService
      .get(id)
      .then((data) => setLaptop(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    laptopService
      .get(id)
      .then((data) => {
        if (active) setLaptop(data);
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
  }, [id]);

  useEffect(() => {
    if (laptop) document.title = laptop.code;
  }, [laptop]);

  // Cross-links: the laptop's sale (if any) and its group (if assigned).
  const laptopId = laptop?._id;
  const groupId = laptop?.laptopGroupId;
  useEffect(() => {
    if (!laptopId) return;
    let active = true;
    saleService
      .listByLaptop(laptopId)
      .then((list) => {
        if (active) setSale(list[0] ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [laptopId]);

  useEffect(() => {
    let active = true;
    if (!groupId) {
      // Clear in a microtask so we never setState synchronously in the effect.
      Promise.resolve().then(() => {
        if (active) setGroup(null);
      });
      return () => {
        active = false;
      };
    }
    laptopGroupService
      .get(groupId)
      .then((g) => {
        if (active) setGroup(g);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [groupId]);

  async function handleSetState(state: LaptopState) {
    if (!laptop || state === laptop.state) return;
    setSavingState(true);
    setError(null);
    try {
      setLaptop(await laptopService.setState(laptop._id, state));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingState(false);
    }
  }

  async function handleSetAssignee(assignee: string) {
    if (!laptop) return;
    setSavingAssignee(true);
    setError(null);
    try {
      setLaptop(await laptopService.update({ id: laptop._id, assignee }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingAssignee(false);
    }
  }

  async function handleAddToGroup() {
    if (!laptop) return;
    setGroupBusy(true);
    setError(null);
    try {
      const g = await laptopGroupService.addLaptop(laptop._id);
      setGroup(g);
      setLaptop(await laptopService.get(laptop._id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGroupBusy(false);
    }
  }

  async function handleRemoveFromGroup() {
    if (!laptop || !laptop.laptopGroupId) return;
    setGroupBusy(true);
    setError(null);
    try {
      await laptopGroupService.removeLaptop(laptop.laptopGroupId, laptop._id);
      setGroup(null);
      setLaptop(await laptopService.get(laptop._id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGroupBusy(false);
    }
  }

  async function handleDelete() {
    if (!laptop) return;
    setDeleting(true);
    try {
      await laptopService.remove(laptop._id);
      router.push("/admin/laptops");
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <Link
          href="/admin/laptops"
          className="inline-flex items-center gap-1.5 font-mono text-xs tracking-[0.1em] text-ink-soft uppercase transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2.5} />
          Ноутбуки
        </Link>

        {error && !laptop ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-paper-line bg-white px-6 py-16 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={load}
              className="rounded-lg border border-paper-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-paper"
            >
              Спробувати ще раз
            </button>
          </div>
        ) : loading || !laptop ? (
          <p className="px-6 py-16 text-center font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
            Завантаження…
          </p>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
                    {laptop.code}
                    {laptop.serviceTag ? ` · #${laptop.serviceTag}` : ""}
                  </p>
                  <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
                    {laptop.name}
                  </h1>
                  {/* Cross-links */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Link
                      href={`/admin/orders/${laptop.orderId}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-paper-line bg-white px-2.5 py-0.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
                    >
                      <Package className="size-3" strokeWidth={2} />
                      Замовлення
                    </Link>
                    {group ? (
                      <span className="inline-flex items-center gap-1.5">
                        <StateTag
                          label={`Група: ${group.title ?? group.groupName ?? group.groupIdentifier ?? ""}`}
                          color={LAPTOP_GROUP_STATE_COLORS[group.state]}
                        />
                        <span className="font-mono text-[10px] text-ink-soft">
                          {LAPTOP_GROUP_STATE_LABELS[group.state]}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleRemoveFromGroup()}
                          disabled={groupBusy}
                          className="text-xs text-ink-soft underline transition-colors hover:text-red-600 disabled:opacity-50"
                        >
                          прибрати
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleAddToGroup()}
                        disabled={groupBusy}
                        className="rounded-full border border-paper-line bg-white px-2.5 py-0.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
                      >
                        + до групи
                      </button>
                    )}
                    {sale && (
                      <span className="inline-flex items-center gap-1.5">
                        <StateTag
                          label={`Продаж ${sale.code}`}
                          color={SALE_STATE_COLORS[sale.state]}
                        />
                        <span className="font-mono text-[10px] text-ink-soft">
                          {SALE_STATE_LABELS[sale.state]}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">
                      Виконавець
                    </span>
                    <select
                      value={laptop.assignee ?? ""}
                      disabled={savingAssignee}
                      onChange={(e) => void handleSetAssignee(e.target.value)}
                      className="rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                    >
                      <option value="">— не призначено —</option>
                      {laptop.assignee &&
                        !users.some((u) => u._id === laptop.assignee) && (
                          <option value={laptop.assignee}>
                            {nameOf(laptop.assignee)}
                          </option>
                        )}
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {userFullName(user)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">
                      Стан
                    </span>
                    <select
                      value={laptop.state}
                      disabled={savingState}
                      onChange={(e) =>
                        void handleSetState(e.target.value as LaptopState)
                      }
                      className="rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                    >
                      {LAPTOP_STATES.map((value) => (
                        <option key={value} value={value}>
                          {LAPTOP_STATE_LABELS[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreateSaleOpen(true)}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
                  >
                    Продати
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Видалити ноутбук"
                    className="rounded-lg border border-paper-line p-2 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" strokeWidth={2} />
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Sections */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <CharacteristicsCard laptop={laptop} onChange={setLaptop} />
                <ImageManager laptop={laptop} onChange={setLaptop} />
                <ComplectationCard laptopId={laptop._id} />
              </div>
              <div className="space-y-6">
                <TechCheckCard laptop={laptop} onChange={setLaptop} />
                <FinanceCard laptop={laptop} onChange={setLaptop} />
                <DefectsCard laptop={laptop} onChange={setLaptop} />
                <ToBuyCard laptop={laptop} onChange={setLaptop} />
              </div>
            </div>

            <CreateSaleModal
              open={createSaleOpen}
              laptop={laptop}
              onClose={() => setCreateSaleOpen(false)}
              onCreated={(created) => {
                setSale(created);
                load();
              }}
            />

            <Modal
              open={confirmDelete}
              onClose={() => setConfirmDelete(false)}
              title="Видалити ноутбук?"
            >
              <p className="text-sm text-ink-soft">
                Ноутбук{" "}
                <span className="font-medium text-ink">{laptop.name}</span> буде
                видалено. Цю дію не можна скасувати.
              </p>
              <div className="flex justify-end gap-3 pt-5">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-paper-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Видалення…" : "Видалити"}
                </button>
              </div>
            </Modal>
          </>
        )}
      </div>
    </main>
  );
}
