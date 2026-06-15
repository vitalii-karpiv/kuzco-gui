"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { saleService } from "@/shared/api/sale-service";
import { laptopService } from "@/shared/api/laptop-service";
import { customerService } from "@/shared/api/customer-service";
import { getErrorMessage } from "@/shared/api/error";
import { useUsers } from "@/shared/users/users-context";
import { userFullName } from "@/shared/domain/user";
import { Modal } from "@/shared/ui/modal";
import type { Laptop } from "@/shared/domain/laptop";
import type { Customer } from "@/shared/domain/customer";
import {
  SALE_STATES,
  SALE_STATE_COLORS,
  SALE_STATE_LABELS,
  type Sale,
  type SaleState,
} from "@/shared/domain/sale";
import { SaleInfoCard } from "./_components/sale-info-card";
import { SaleFinanceCard } from "./_components/sale-finance-card";
import { CustomerCard } from "./_components/customer-card";
import { SaleLaptopCard } from "./_components/sale-laptop-card";
import { CustomerSalesTable } from "./_components/customer-sales-table";

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { users, nameOf } = useUsers();

  const [sale, setSale] = useState<Sale | null>(null);
  const [laptop, setLaptop] = useState<Laptop | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingState, setSavingState] = useState(false);
  const [savingAssignee, setSavingAssignee] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    saleService
      .get(id)
      .then((data) => setSale(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    saleService
      .get(id)
      .then((data) => {
        if (active) setSale(data);
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
    if (sale) document.title = sale.code;
  }, [sale]);

  // Linked laptop.
  const laptopId = sale?.laptopId;
  useEffect(() => {
    if (!laptopId) return;
    let active = true;
    laptopService
      .get(laptopId)
      .then((data) => {
        if (active) setLaptop(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [laptopId]);

  // Linked customer (if any).
  const customerId = sale?.customerId;
  useEffect(() => {
    let active = true;
    if (!customerId) {
      Promise.resolve().then(() => {
        if (active) setCustomer(null);
      });
      return () => {
        active = false;
      };
    }
    customerService
      .get(customerId)
      .then((data) => {
        if (active) setCustomer(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [customerId]);

  async function handleSetState(state: SaleState) {
    if (!sale || state === sale.state) return;
    setSavingState(true);
    setError(null);
    try {
      setSale(await saleService.setState(sale._id, state));
      // The laptop state changes server-side — refresh it.
      if (sale.laptopId) {
        laptopService.get(sale.laptopId).then(setLaptop).catch(() => {});
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingState(false);
    }
  }

  async function handleSetAssignee(assignee: string) {
    if (!sale) return;
    setSavingAssignee(true);
    setError(null);
    try {
      setSale(await saleService.setAssignee(sale._id, assignee));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingAssignee(false);
    }
  }

  async function handleDelete() {
    if (!sale) return;
    setDeleting(true);
    try {
      await saleService.remove(sale._id);
      router.push("/admin/sales");
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <Link
          href="/admin/sales"
          className="inline-flex items-center gap-1.5 font-mono text-xs tracking-[0.1em] text-ink-soft uppercase transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2.5} />
          Продажі
        </Link>

        {error && !sale ? (
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
        ) : loading || !sale ? (
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
                    {sale.code}
                  </p>
                  <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
                    {laptop?.name ?? "Продаж"}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">
                      Виконавець
                    </span>
                    <select
                      value={sale.assignee ?? ""}
                      disabled={savingAssignee}
                      onChange={(e) => void handleSetAssignee(e.target.value)}
                      className="rounded-lg border border-paper-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                    >
                      <option value="">— не призначено —</option>
                      {sale.assignee &&
                        !users.some((u) => u._id === sale.assignee) && (
                          <option value={sale.assignee}>
                            {nameOf(sale.assignee)}
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
                      value={sale.state}
                      disabled={savingState}
                      onChange={(e) =>
                        void handleSetState(e.target.value as SaleState)
                      }
                      style={{ color: SALE_STATE_COLORS[sale.state] }}
                      className="rounded-lg border border-paper-line bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                    >
                      {SALE_STATES.map((value) => (
                        <option key={value} value={value} className="text-ink">
                          {SALE_STATE_LABELS[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Видалити продаж"
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
                <SaleInfoCard sale={sale} onChange={setSale} />
                <SaleLaptopCard laptop={laptop} />
              </div>
              <div className="space-y-6">
                <SaleFinanceCard sale={sale} />
                <CustomerCard customer={customer} onChange={setCustomer} />
              </div>
            </div>

            {sale.customerId && (
              <CustomerSalesTable
                customerId={sale.customerId}
                currentSaleId={sale._id}
              />
            )}

            <Modal
              open={confirmDelete}
              onClose={() => setConfirmDelete(false)}
              title="Видалити продаж?"
            >
              <p className="text-sm text-ink-soft">
                Продаж{" "}
                <span className="font-medium text-ink">{sale.code}</span> буде
                видалено, а ноутбук повернеться у продаж. Цю дію не можна скасувати.
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
