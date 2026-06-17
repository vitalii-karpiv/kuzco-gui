import { api } from "@/shared/api/client";
import type { Expense, ExpenseType } from "@/shared/domain/expense";
import type { Investment } from "@/shared/domain/investment";
import type { Balance } from "@/shared/domain/balance";

export interface ExpenseListFilter {
  /** Restrict to expenses linked to a given order. */
  orderId?: string;
  /** Unix seconds. */
  timeFrom?: number;
  /** Unix seconds. */
  timeTo?: number;
  deleted?: boolean;
  index?: number;
  limit?: number;
}

export interface ExpenseCreateInput {
  /** Negative integer kopiykas. */
  amount: number;
  /** Unix seconds. */
  time: number;
  type?: ExpenseType;
  orderId?: string;
  cardOwner?: string;
  description?: string;
  deleted?: boolean;
}

export interface ExpenseUpdateInput {
  id: string;
  /** Negative integer kopiykas. */
  amount?: number;
  /** Unix seconds. */
  time?: number;
  type?: ExpenseType;
  orderId?: string;
  description?: string;
}

export interface InvestmentListFilter {
  userId?: string;
  /** ISO date string. */
  dateFrom?: string;
  /** ISO date string. */
  dateTo?: string;
}

export interface InvestmentCreateInput {
  userId: string;
  /** ISO date string. */
  date: string;
  amount: number;
}

export interface RevenueAndEarnings {
  revenue: number;
  earn: number;
}

/** Client for the kuzco-server `finance` domain. */
export const financeService = {
  /** `POST /finance/expense/list` — returns matching expenses. */
  async listExpenses(filter: ExpenseListFilter = {}): Promise<Expense[]> {
    const { data } = await api.post<{ itemList: Expense[] }>(
      "/finance/expense/list",
      filter,
    );
    return data.itemList ?? [];
  },

  /** `POST /finance/expense` — creates an expense (amount in negative kopiykas). */
  async createExpense(input: ExpenseCreateInput): Promise<Expense> {
    const { data } = await api.post<Expense>("/finance/expense", input);
    return data;
  },

  /** `PATCH /finance/expense` — updates an existing expense. */
  async updateExpense(input: ExpenseUpdateInput): Promise<Expense> {
    const { data } = await api.patch<Expense>("/finance/expense", input);
    return data;
  },

  /** `DELETE /finance/expense/:id` — removes an expense. */
  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/finance/expense/${id}`);
  },

  /** `POST /finance/expense/sync` — pulls bank transactions (Unix seconds). */
  async syncExpenses(from: number, to: number): Promise<void> {
    await api.post("/finance/expense/sync", { from, to });
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

  /** `POST /finance/investment/list` — returns matching investments. */
  async listInvestments(filter: InvestmentListFilter = {}): Promise<Investment[]> {
    const { data } = await api.post<{ itemList: Investment[] }>(
      "/finance/investment/list",
      filter,
    );
    return data.itemList ?? [];
  },

  /** `POST /finance/investment` — records a new investment. */
  async createInvestment(input: InvestmentCreateInput): Promise<Investment> {
    const { data } = await api.post<Investment>("/finance/investment", input);
    return data;
  },

  /** `POST /finance/balance/list` — returns all bank account balances. */
  async listBalances(): Promise<Balance[]> {
    const { data } = await api.post<{ itemList: Balance[] }>(
      "/finance/balance/list",
      {},
    );
    return data.itemList ?? [];
  },

  /** `POST /finance/balance/sync` — refreshes balances from Monobank. */
  async syncBalances(): Promise<void> {
    await api.post("/finance/balance/sync", {});
  },

  /** `POST /finance/revenueAndEarnings` — revenue + net earnings for a range (ISO dates). */
  async getRevenueAndEarnings(
    from: string,
    to: string,
  ): Promise<RevenueAndEarnings> {
    const { data } = await api.post<RevenueAndEarnings>(
      "/finance/revenueAndEarnings",
      { from, to },
    );
    return data;
  },
};
