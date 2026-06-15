"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

import { laptopGroupService } from "@/shared/api/laptop-group-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass, cardTitleClass } from "@/shared/ui/form";
import {
  MARKETPLACE_LABELS,
  type LaptopGroup,
  type MarketplaceCode,
} from "@/shared/domain/laptop-group";

interface MarketplaceBlockProps {
  group: LaptopGroup;
  onChange: (group: LaptopGroup) => void;
}

export function MarketplaceBlock({ group, onChange }: MarketplaceBlockProps) {
  const [editing, setEditing] = useState<MarketplaceCode | null>(null);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<MarketplaceCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const marketplaces = group.marketplaces ?? [];

  async function toggle(code: MarketplaceCode) {
    setBusy(code);
    setError(null);
    try {
      onChange(await laptopGroupService.toggleMarketplacePublished(group._id, code));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function generate(code: MarketplaceCode) {
    setBusy(code);
    setError(null);
    try {
      onChange(
        await laptopGroupService.generateMarketplaceDescription(group._id, code),
      );
      setExpanded((prev) => ({ ...prev, [code]: true }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  function startEdit(code: MarketplaceCode, description?: string) {
    setEditing(code);
    setDraft(description ?? "");
    setExpanded((prev) => ({ ...prev, [code]: true }));
  }

  async function saveDescription(code: MarketplaceCode) {
    const current = marketplaces.find((m) => m.code === code);
    if (!current) return;
    if (draft === (current.description ?? "")) {
      setEditing(null);
      return;
    }
    setBusy(code);
    setError(null);
    try {
      const next = marketplaces.map((m) =>
        m.code === code ? { ...m, description: draft } : m,
      );
      onChange(
        await laptopGroupService.update({ id: group._id, marketplaces: next }),
      );
      setEditing(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Маркетплейс</h2>

      {error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {marketplaces.length === 0 ? (
        <p className="text-sm text-ink-soft">Маркетплейси ще не налаштовані.</p>
      ) : (
        <div className="space-y-4">
          {marketplaces.map((marketplace) => {
            const code = marketplace.code;
            const isEditing = editing === code;
            const isBusy = busy === code;
            const isOpen = expanded[code] ?? false;
            return (
              <div
                key={code}
                data-published={marketplace.published}
                className="rounded-xl border border-paper-line p-4 data-[published=true]:border-green-200 data-[published=true]:bg-green-50/50"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={marketplace.published}
                      disabled={isBusy}
                      onChange={() => void toggle(code)}
                      className="size-4 rounded border-paper-line accent-accent disabled:opacity-50"
                    />
                    {MARKETPLACE_LABELS[code] ?? code}
                    <span
                      className={`font-mono text-[10px] tracking-[0.08em] uppercase ${marketplace.published ? "text-green-600" : "text-ink-soft"}`}
                    >
                      {marketplace.published ? "опубліковано" : "не опубліковано"}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => void generate(code)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`size-3.5 ${isBusy ? "animate-spin" : ""}`}
                      strokeWidth={2.5}
                    />
                    Згенерувати опис
                  </button>
                </div>

                {/* Description */}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [code]: !isOpen }))
                      }
                      disabled={isEditing}
                      className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] text-ink-soft uppercase transition-colors hover:text-ink disabled:opacity-50"
                    >
                      {isOpen ? (
                        <ChevronUp className="size-3" strokeWidth={2.5} />
                      ) : (
                        <ChevronDown className="size-3" strokeWidth={2.5} />
                      )}
                      Опис
                    </button>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          disabled={isBusy}
                          className="rounded-lg border border-paper-line px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-paper disabled:opacity-50"
                        >
                          Скасувати
                        </button>
                        <button
                          type="button"
                          onClick={() => void saveDescription(code)}
                          disabled={isBusy}
                          className="rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
                        >
                          Зберегти
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(code, marketplace.description)}
                        disabled={isBusy}
                        className="text-xs text-ink-soft underline transition-colors hover:text-ink disabled:opacity-50"
                      >
                        Редагувати
                      </button>
                    )}
                  </div>

                  {isOpen && (
                    <div className="mt-2">
                      {isEditing ? (
                        <textarea
                          rows={12}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          disabled={isBusy}
                          placeholder="Введіть опис для маркетплейсу…"
                          className="w-full rounded-lg border border-paper-line bg-paper/40 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent"
                        />
                      ) : marketplace.description ? (
                        <p className="rounded-lg border border-paper-line bg-white p-3 text-sm whitespace-pre-wrap text-ink">
                          {marketplace.description}
                        </p>
                      ) : (
                        <p className="text-sm text-ink-soft italic">
                          Опису ще немає. Натисніть «Згенерувати опис».
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
