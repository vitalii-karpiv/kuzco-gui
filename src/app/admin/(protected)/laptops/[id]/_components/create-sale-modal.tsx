"use client";

import { useState, type FormEvent } from "react";

import { saleService } from "@/shared/api/sale-service";
import { customerService } from "@/shared/api/customer-service";
import { getErrorMessage } from "@/shared/api/error";
import { Modal } from "@/shared/ui/modal";
import { fieldClass, labelClass } from "@/shared/ui/form";
import {
  DELIVERY_TYPES,
  DELIVERY_TYPE_LABELS,
  SALE_SOURCES,
  SALE_SOURCE_LABELS,
  type DeliveryType,
  type Sale,
  type SaleSource,
} from "@/shared/domain/sale";
import type { Laptop } from "@/shared/domain/laptop";

interface CreateSaleModalProps {
  open: boolean;
  laptop: Laptop;
  onClose: () => void;
  onCreated: (sale: Sale) => void;
}

export function CreateSaleModal({
  open,
  laptop,
  onClose,
  onCreated,
}: CreateSaleModalProps) {
  const [phone, setPhone] = useState("");
  const [pib, setPib] = useState("");
  const [price, setPrice] = useState(String(laptop.sellPrice ?? ""));
  const [source, setSource] = useState<SaleSource | "">("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType | "">("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // Upsert the customer first (server keys on phone), then create the sale.
      const customer = await customerService.upsert({
        phone: phone.trim(),
        pib: pib.trim(),
      });
      const sale = await saleService.create({
        laptopId: laptop._id,
        customerId: customer._id,
        ...(price.trim() ? { price: Number(price) } : {}),
        ...(source ? { source } : {}),
        ...(deliveryType ? { deliveryType } : {}),
      });
      onCreated(sale);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Створити продаж">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="sale-phone" className={labelClass}>
              Телефон клієнта
            </label>
            <input
              id="sale-phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+380…"
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="sale-pib" className={labelClass}>
              ПІБ клієнта
            </label>
            <input
              id="sale-pib"
              required
              value={pib}
              onChange={(e) => setPib(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sale-price" className={labelClass}>
            Ціна
          </label>
          <input
            id="sale-price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="sale-source" className={labelClass}>
              Джерело
            </label>
            <select
              id="sale-source"
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
            <label htmlFor="sale-delivery" className={labelClass}>
              Доставка
            </label>
            <select
              id="sale-delivery"
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
    </Modal>
  );
}
