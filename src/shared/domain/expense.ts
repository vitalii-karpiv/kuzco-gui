/**
 * Expense domain types, mirroring kuzco-server's `common/enum/expense-type.ts`
 * and the `Expense` model. Labels live here only (requirements §CC-5).
 */

export const EXPENSE_TYPES = [
  "delivery",
  "purchase",
  "advertisement",
  "stock",
  "tax",
  "other",
] as const;

export type ExpenseType = (typeof EXPENSE_TYPES)[number];

/** An expense as returned by `POST /finance/expense/list`. */
export interface Expense {
  _id: string;
  orderId?: string;
  type?: ExpenseType;
  amount: number;
  /** Epoch milliseconds. */
  time: number;
  cardOwner?: string;
  description?: string;
  deleted: boolean;
}

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  delivery: "Доставка",
  purchase: "Закупівля",
  advertisement: "Реклама",
  stock: "Склад",
  tax: "Податок",
  other: "Інше",
};
