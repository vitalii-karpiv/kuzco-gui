"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ImageDown } from "lucide-react";

import { laptopGroupService } from "@/shared/api/laptop-group-service";
import { imageService } from "@/shared/api/image-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass, cardTitleClass } from "@/shared/ui/form";
import { StateTag } from "@/shared/ui/state-tag";
import { formatMoney } from "@/shared/format";
import {
  LAPTOP_CONDITION_LABELS,
  LAPTOP_STATE_COLORS,
  LAPTOP_STATE_LABELS,
  type Laptop,
} from "@/shared/domain/laptop";
import {
  BATTERY_CONDITION_COLORS,
  BATTERY_CONDITION_LABELS,
  type LaptopGroup,
  type LaptopVariant,
} from "@/shared/domain/laptop-group";

interface VariantsTableProps {
  group: LaptopGroup;
  laptops: Laptop[];
  onChange: (group: LaptopGroup) => void;
  /** Notify the parent that group images changed (linked from a laptop). */
  onImagesLinked: () => void;
}

export function VariantsTable({
  group,
  laptops,
  onChange,
  onImagesLinked,
}: VariantsTableProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const variants = group.variants ?? [];
  if (variants.length === 0) return null;

  function startEdit(index: number, price?: number) {
    setEditingIndex(index);
    setPriceDraft(price != null ? String(price) : "");
  }

  async function savePrice(index: number) {
    const raw = priceDraft.trim();
    const price = raw === "" ? undefined : Number(raw);
    if (price != null && !Number.isFinite(price)) return;
    if (price === (variants[index]?.price ?? undefined)) {
      setEditingIndex(null);
      return;
    }
    setSavingIndex(index);
    setError(null);
    try {
      const next: LaptopVariant[] = variants.map((variant, i) =>
        i === index ? { ...variant, price } : variant,
      );
      onChange(await laptopGroupService.update({ id: group._id, variants: next }));
      setEditingIndex(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingIndex(null);
    }
  }

  async function linkImages(laptopId: string) {
    setLinkingId(laptopId);
    setError(null);
    try {
      await imageService.linkGroup(laptopId, group._id);
      onImagesLinked();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLinkingId(null);
    }
  }

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Варіанти ({variants.length})</h2>

      {error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
              <th className="px-3 py-2 font-medium" />
              <th className="px-3 py-2 font-medium">RAM</th>
              <th className="px-3 py-2 font-medium">SSD</th>
              <th className="px-3 py-2 font-medium">Сенсор</th>
              <th className="px-3 py-2 font-medium">Батарея</th>
              <th className="px-3 py-2 font-medium">Стан</th>
              <th className="px-3 py-2 text-right font-medium">Ноутбуки</th>
              <th className="px-3 py-2 text-right font-medium">Ціна</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant, index) => {
              const isOpen = expanded[index] ?? false;
              const itemIds = variant.itemList ?? [];
              const variantLaptops = laptops.filter((l) => itemIds.includes(l._id));
              const isEditing = editingIndex === index;
              return (
                <Fragment key={`v-${index}`}>
                  <tr className="border-b border-paper-line/70 last:border-0">
                    <td className="px-3 py-2 align-top">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [index]: !isOpen }))
                        }
                        disabled={itemIds.length === 0}
                        aria-label="Розгорнути"
                        className="text-ink-soft transition-colors hover:text-ink disabled:opacity-30"
                      >
                        {isOpen ? (
                          <ChevronDown className="size-4" strokeWidth={2} />
                        ) : (
                          <ChevronRight className="size-4" strokeWidth={2} />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2 align-top text-ink">
                      {variant.ram ? `${variant.ram} ГБ` : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-ink">
                      {variant.ssd ? `${variant.ssd} ГБ` : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-ink-soft">
                      {variant.touch ? "Так" : "Ні"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {variant.battery ? (
                        <StateTag
                          label={BATTERY_CONDITION_LABELS[variant.battery]}
                          color={BATTERY_CONDITION_COLORS[variant.battery]}
                        />
                      ) : (
                        <span className="text-ink-soft">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-ink">
                      {variant.condition
                        ? LAPTOP_CONDITION_LABELS[variant.condition]
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-right tabular-nums text-ink">
                      {itemIds.length}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min={0}
                            value={priceDraft}
                            autoFocus
                            onChange={(e) => setPriceDraft(e.target.value)}
                            className="w-28 rounded-lg border border-paper-line bg-white px-2 py-1 text-right text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                          />
                          <button
                            type="button"
                            onClick={() => void savePrice(index)}
                            disabled={savingIndex === index}
                            className="rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
                          >
                            Зберегти
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            disabled={savingIndex === index}
                            className="rounded-lg border border-paper-line px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-paper disabled:opacity-50"
                          >
                            Скасувати
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="tabular-nums text-ink">
                            {variant.price != null ? formatMoney(variant.price) : "—"}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEdit(index, variant.price)}
                            disabled={editingIndex !== null}
                            className="text-xs text-ink-soft underline transition-colors hover:text-ink disabled:opacity-40"
                          >
                            Змінити
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {isOpen && variantLaptops.length > 0 && (
                    <tr className="border-b border-paper-line/70">
                      <td colSpan={8} className="bg-paper/40 px-3 py-3">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="font-mono text-[10px] tracking-[0.1em] text-ink-soft uppercase">
                              <th className="px-2 py-1.5 font-medium">Код</th>
                              <th className="px-2 py-1.5 font-medium">Назва</th>
                              <th className="px-2 py-1.5 font-medium">Стан</th>
                              <th className="px-2 py-1.5 text-right font-medium">
                                Собівартість
                              </th>
                              <th className="px-2 py-1.5 text-right font-medium">
                                Ліміт
                              </th>
                              <th className="px-2 py-1.5 text-right font-medium">
                                Продаж
                              </th>
                              <th className="px-2 py-1.5" />
                            </tr>
                          </thead>
                          <tbody>
                            {variantLaptops.map((laptop) => (
                              <tr key={laptop._id} className="text-ink">
                                <td className="px-2 py-1.5 font-mono text-ink-soft">
                                  <Link
                                    href={`/admin/laptops/${laptop._id}`}
                                    className="underline transition-colors hover:text-ink"
                                  >
                                    {laptop.code}
                                  </Link>
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-2">
                                    {laptop.imageUrl && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={laptop.imageUrl}
                                        alt=""
                                        className="size-7 shrink-0 rounded object-cover"
                                      />
                                    )}
                                    <Link
                                      href={`/admin/laptops/${laptop._id}`}
                                      className="transition-colors hover:text-accent"
                                    >
                                      {laptop.name}
                                    </Link>
                                  </div>
                                </td>
                                <td className="px-2 py-1.5">
                                  <StateTag
                                    label={LAPTOP_STATE_LABELS[laptop.state]}
                                    color={LAPTOP_STATE_COLORS[laptop.state]}
                                  />
                                </td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-ink-soft">
                                  {formatMoney(laptop.costPrice)}
                                </td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-ink-soft">
                                  {formatMoney(laptop.limitPrice)}
                                </td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-ink">
                                  {formatMoney(laptop.sellPrice)}
                                </td>
                                <td className="px-2 py-1.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => void linkImages(laptop._id)}
                                    disabled={linkingId === laptop._id}
                                    title="Прив’язати фото ноутбука до групи"
                                    aria-label="Прив’язати фото до групи"
                                    className="rounded p-1 text-ink-soft transition-colors hover:text-accent disabled:opacity-40"
                                  >
                                    <ImageDown className="size-4" strokeWidth={2} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
