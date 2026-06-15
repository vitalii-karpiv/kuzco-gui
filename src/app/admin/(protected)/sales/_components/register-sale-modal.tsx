"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";

import { saleService } from "@/shared/api/sale-service";
import { customerService } from "@/shared/api/customer-service";
import { laptopService } from "@/shared/api/laptop-service";
import { getErrorMessage } from "@/shared/api/error";
import { Modal } from "@/shared/ui/modal";
import { fieldClass, labelClass } from "@/shared/ui/form";
import { formatMoney } from "@/shared/format";
import type { Laptop } from "@/shared/domain/laptop";
import {
  DELIVERY_TYPES,
  DELIVERY_TYPE_LABELS,
  SALE_SOURCES,
  SALE_SOURCE_LABELS,
  type DeliveryType,
  type SaleSource,
} from "@/shared/domain/sale";

interface RegisterSaleModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function RegisterSaleModal({
  open,
  onClose,
  onCreated,
}: RegisterSaleModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Зареєструвати продаж">
      {/* Mounted only while open (Modal renders null when closed), so the form
          state resets on every open without a reset effect. */}
      <RegisterSaleForm onClose={onClose} onCreated={onCreated} />
    </Modal>
  );
}

function RegisterSaleForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Laptop[]>([]);
  const [searching, setSearching] = useState(false);
  const [laptop, setLaptop] = useState<Laptop | null>(null);

  const [phone, setPhone] = useState("");
  const [pib, setPib] = useState("");
  const [price, setPrice] = useState("");
  const [source, setSource] = useState<SaleSource | "">("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType | "">("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Debounced search of sellable laptops (only while no laptop is picked).
  // All setState happens inside the timeout callback (never synchronously in the
  // effect body — react-hooks/set-state-in-effect).
  useEffect(() => {
    if (laptop) return;
    const term = search.trim();
    const id = setTimeout(() => {
      if (!term) {
        setResults([]);
        return;
      }
      setSearching(true);
      laptopService
        .list({ name: term, stateList: ["selling"] })
        .then((list) => setResults(list))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(id);
  }, [search, laptop]);

  function pick(selected: Laptop) {
    setLaptop(selected);
    setPrice(selected.sellPrice != null ? String(selected.sellPrice) : "");
    setResults([]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!laptop) return;
    setSubmitting(true);
    setError(null);
    try {
      const customer = await customerService.upsert({
        phone: phone.trim(),
        pib: pib.trim(),
      });
      await saleService.create({
        laptopId: laptop._id,
        customerId: customer._id,
        ...(price.trim() ? { price: Number(price) } : {}),
        ...(source ? { source } : {}),
        ...(deliveryType ? { deliveryType } : {}),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!laptop) {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <span className={labelClass}>Ноутбук (у продажу)</span>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за назвою або сервісним тегом…"
              className="w-full rounded-lg border border-paper-line bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto rounded-lg border border-paper-line">
          {searching ? (
            <p className="px-3 py-6 text-center font-mono text-xs tracking-[0.1em] text-ink-soft uppercase">
              Пошук…
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-soft">
              {search.trim()
                ? "Нічого не знайдено."
                : "Почніть вводити назву ноутбука."}
            </p>
          ) : (
            <ul>
              {results.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => pick(item)}
                    className="flex w-full items-center justify-between gap-3 border-b border-paper-line/70 px-3 py-2 text-left transition-colors last:border-0 hover:bg-paper"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">
                        {item.name}
                      </span>
                      <span className="font-mono text-xs text-ink-soft">
                        {item.code}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-ink-soft">
                      {formatMoney(item.sellPrice)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {/* Picked laptop */}
      <div className="flex items-center justify-between gap-3 rounded-lg bg-paper/60 px-3 py-2.5">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink">
            {laptop.name}
          </span>
          <span className="font-mono text-xs text-ink-soft">{laptop.code}</span>
        </span>
        <button
          type="button"
          onClick={() => setLaptop(null)}
          aria-label="Змінити ноутбук"
          className="rounded-lg p-1 text-ink-soft transition-colors hover:bg-white hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="reg-phone" className={labelClass}>
            Телефон клієнта
          </label>
          <input
            id="reg-phone"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+380…"
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="reg-pib" className={labelClass}>
            ПІБ клієнта
          </label>
          <input
            id="reg-pib"
            required
            value={pib}
            onChange={(e) => setPib(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-price" className={labelClass}>
          Ціна
        </label>
        <input
          id="reg-price"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="reg-source" className={labelClass}>
            Джерело
          </label>
          <select
            id="reg-source"
            value={source}
            onChange={(e) => setSource(e.target.value as SaleSource | "")}
            className={fieldClass}
          >
            <option value="">—</option>
            {SALE_SOURCES.map((value) => (
              <option key={value} value={value}>
                {SALE_SOURCE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="reg-delivery" className={labelClass}>
            Доставка
          </label>
          <select
            id="reg-delivery"
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value as DeliveryType | "")}
            className={fieldClass}
          >
            <option value="">—</option>
            {DELIVERY_TYPES.map((value) => (
              <option key={value} value={value}>
                {DELIVERY_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-paper-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
        >
          Скасувати
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Створення…" : "Створити продаж"}
        </button>
      </div>
    </form>
  );
}
