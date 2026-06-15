"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { laptopGroupService } from "@/shared/api/laptop-group-service";
import { laptopService } from "@/shared/api/laptop-service";
import { getErrorMessage } from "@/shared/api/error";
import { Modal } from "@/shared/ui/modal";
import type { Laptop } from "@/shared/domain/laptop";
import {
  LAPTOP_GROUP_STATES,
  LAPTOP_GROUP_STATE_COLORS,
  LAPTOP_GROUP_STATE_LABELS,
  laptopIdsOf,
  type LaptopGroup,
  type LaptopGroupState,
} from "@/shared/domain/laptop-group";
import { BasicInfoCard } from "./_components/basic-info-card";
import { GroupImageManager } from "./_components/group-image-manager";
import { MarketplaceBlock } from "./_components/marketplace-block";
import { VariantsTable } from "./_components/variants-table";

export default function LaptopGroupDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [group, setGroup] = useState<LaptopGroup | null>(null);
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingState, setSavingState] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    laptopGroupService
      .get(id)
      .then((data) => setGroup(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    laptopGroupService
      .get(id)
      .then((data) => {
        if (active) setGroup(data);
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
    if (group) document.title = group.title ?? group.groupName ?? "Група";
  }, [group]);

  // Load member laptops (variants + legacy list) for the variants' expanded rows.
  const idKey = group ? laptopIdsOf(group).join(",") : "";
  useEffect(() => {
    const idList = idKey ? idKey.split(",") : [];
    if (idList.length === 0) {
      Promise.resolve().then(() => setLaptops([]));
      return;
    }
    let active = true;
    laptopService
      .list({ idList })
      .then((list) => {
        if (active) setLaptops(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [idKey]);

  async function handleSetState(state: LaptopGroupState) {
    if (!group || state === group.state) return;
    setSavingState(true);
    setError(null);
    try {
      setGroup(await laptopGroupService.setState(group._id, state));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingState(false);
    }
  }

  async function handleDelete() {
    if (!group) return;
    setDeleting(true);
    try {
      await laptopGroupService.remove(group._id);
      router.push("/admin/laptop-groups");
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <Link
          href="/admin/laptop-groups"
          className="inline-flex items-center gap-1.5 font-mono text-xs tracking-[0.1em] text-ink-soft uppercase transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2.5} />
          Групи
        </Link>

        {error && !group ? (
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
        ) : loading || !group ? (
          <p className="px-6 py-16 text-center font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
            Завантаження…
          </p>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  {group.groupIdentifier && (
                    <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
                      {group.groupIdentifier}
                    </p>
                  )}
                  <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
                    {group.groupName ?? group.title ?? "Група"}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">
                      Стан
                    </span>
                    <select
                      value={group.state}
                      disabled={savingState}
                      onChange={(e) =>
                        void handleSetState(e.target.value as LaptopGroupState)
                      }
                      style={{ color: LAPTOP_GROUP_STATE_COLORS[group.state] }}
                      className="rounded-lg border border-paper-line bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                    >
                      {LAPTOP_GROUP_STATES.map((value) => (
                        <option key={value} value={value} className="text-ink">
                          {LAPTOP_GROUP_STATE_LABELS[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Видалити групу"
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
                <BasicInfoCard group={group} onChange={setGroup} />
                <GroupImageManager
                  group={group}
                  onChange={setGroup}
                  refreshKey={imageRefreshKey}
                />
              </div>
              <div className="space-y-6">
                <MarketplaceBlock group={group} onChange={setGroup} />
              </div>
            </div>

            <VariantsTable
              group={group}
              laptops={laptops}
              onChange={setGroup}
              onImagesLinked={() => setImageRefreshKey((k) => k + 1)}
            />

            <Modal
              open={confirmDelete}
              onClose={() => setConfirmDelete(false)}
              title="Видалити групу?"
            >
              <p className="text-sm text-ink-soft">
                Групу{" "}
                <span className="font-medium text-ink">
                  {group.title ?? group.groupName}
                </span>{" "}
                буде видалено. Цю дію не можна скасувати.
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
