/** Centralized date/money formatting (requirements §CC-4). */

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Format an ISO date string for display; returns an em dash when absent/invalid. */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

/** Format an epoch-ms timestamp for display; returns an em dash when absent/invalid. */
export function formatTimestamp(value?: number | null): string {
  if (value == null) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

const moneyFormatter = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});

/**
 * Format a money amount. The server stores a bare number; we render it as UAH
 * (₴) per the Ukrainian locale — confirm the currency if amounts are ever USD.
 */
export function formatMoney(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return moneyFormatter.format(value);
}

/**
 * Expenses are stored server-side as negative integer kopiykas. Convert to a
 * positive UAH amount for display (e.g. `-50000` -> `500 ₴`).
 */
export function formatExpenseAmount(kopiykas?: number | null): string {
  if (kopiykas == null || Number.isNaN(kopiykas)) return "—";
  return formatMoney((kopiykas / 100) * -1);
}
