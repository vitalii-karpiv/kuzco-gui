/** Shared date-range model + conversions for the finance overview sections. */

export interface FinanceDateRange {
  /** `YYYY-MM-DD` (inclusive). */
  from: string;
  /** `YYYY-MM-DD` (inclusive). */
  to: string;
}

/** Default range: from the first day of the current month through today. */
export function defaultFinanceRange(): FinanceDateRange {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toInputValue(first), to: toInputValue(now) };
}

function toInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** ISO bounds covering the full days of the range (for revenue + investments). */
export function rangeToIso(range: FinanceDateRange): { from: string; to: string } {
  return {
    from: new Date(`${range.from}T00:00:00`).toISOString(),
    to: new Date(`${range.to}T23:59:59.999`).toISOString(),
  };
}

/** Unix-second bounds covering the full days of the range (for expenses). */
export function rangeToSeconds(range: FinanceDateRange): {
  from: number;
  to: number;
} {
  return {
    from: Math.floor(new Date(`${range.from}T00:00:00`).getTime() / 1000),
    to: Math.floor(new Date(`${range.to}T23:59:59.999`).getTime() / 1000),
  };
}
