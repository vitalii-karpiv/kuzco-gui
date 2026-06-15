"use client";

import { useState } from "react";

import { customerService } from "@/shared/api/customer-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass, cardTitleClass, fieldClass, labelClass } from "@/shared/ui/form";
import type { Customer } from "@/shared/domain/customer";

interface CustomerCardProps {
  customer: Customer | null;
  onChange: (customer: Customer) => void;
}

export function CustomerCard({ customer, onChange }: CustomerCardProps) {
  const [error, setError] = useState<string | null>(null);

  async function savePib(pib: string) {
    if (!customer || pib === customer.pib) return;
    setError(null);
    try {
      // Server upserts by phone, so PIB edits ride on the existing phone key.
      onChange(await customerService.upsert({ phone: customer.phone, pib }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Клієнт</h2>

      {!customer ? (
        <p className="text-sm text-ink-soft">Клієнта не вказано.</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className={labelClass}>ПІБ</span>
            <input
              defaultValue={customer.pib}
              onBlur={(e) => void savePib(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <span className={labelClass}>Телефон</span>
            <p className="text-sm text-ink">{customer.phone}</p>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
