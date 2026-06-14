import { api } from "@/shared/api/client";
import type { Expense } from "@/shared/domain/expense";

export interface ExpenseListFilter {
  /** Restrict to expenses linked to a given order. */
  orderId?: string;
  timeFrom?: number;
  timeTo?: number;
  deleted?: boolean;
}

/** Client for the kuzco-server `finance` domain (read-only subset for now). */
export const financeService = {
  /** `POST /finance/expense/list` — returns matching expenses. */
  async listExpenses(filter: ExpenseListFilter = {}): Promise<Expense[]> {
    const { data } = await api.post<{ itemList: Expense[] }>(
      "/finance/expense/list",
      filter,
    );
    return data.itemList ?? [];
  },

  /** `GET /finance/costPrice/order/:id` — total expenses for an order (COGS). */
  async getOrderCostPrice(id: string): Promise<number> {
    const { data } = await api.get<number>(`/finance/costPrice/order/${id}`);
    return data;
  },

  /** `GET /finance/costPrice/laptop/:id` — per-laptop COGS (order expenses / itemsInLot). */
  async getLaptopCostPrice(id: string): Promise<number> {
    const { data } = await api.get<number>(`/finance/costPrice/laptop/${id}`);
    return data;
  },
};
