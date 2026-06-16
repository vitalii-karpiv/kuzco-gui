import { api } from "@/shared/api/client";
import type { Stock, StockState, StockType } from "@/shared/domain/stock";

export interface StockListFilter {
  laptopId?: string;
  type?: StockType;
  state?: StockState;
  name?: string;
  /** Mongo sort object, e.g. `{ price: -1 }`. */
  sorters?: Record<string, 1 | -1>;
}

export interface StockCreateInput {
  name: string;
  price: number;
  type: StockType;
  /** Generate N identical items at once (server defaults to 1). */
  quantity?: number;
  /** When set, the new item is booked to the laptop. */
  laptopId?: string;
}

export interface StockUpdateInput {
  id: string;
  name?: string;
  price?: number;
  type?: StockType;
  /** Pass a laptop id to book, or `null` to release. */
  laptopId?: string | null;
}

/**
 * Client for the kuzco-server `stock` domain. The acting user is derived from
 * the Bearer token server-side — never send `userId` (requirements §ID-1).
 */
export const stockService = {
  /** `POST /stock/list` — server applies filters/sort. */
  async list(filter: StockListFilter = {}): Promise<Stock[]> {
    const { data } = await api.post<{ itemList: Stock[] }>(
      "/stock/list",
      filter,
    );
    return data.itemList ?? [];
  },

  async get(id: string): Promise<Stock> {
    const { data } = await api.get<Stock>(`/stock/${id}`);
    return data;
  },

  /** `POST /stock` — returns the created item(s). */
  async create(input: StockCreateInput): Promise<Stock[]> {
    const { data } = await api.post<Stock[]>("/stock", input);
    return data;
  },

  /** `PATCH /stock` — update fields; the server recomputes state from `laptopId`. */
  async update(input: StockUpdateInput): Promise<Stock> {
    const { data } = await api.patch<Stock>("/stock", input);
    return data;
  },

  /** `PATCH /stock` — book to a laptop (`laptopId`) or release it (`null`). */
  async setLaptop(id: string, laptopId: string | null): Promise<Stock> {
    const { data } = await api.patch<Stock>("/stock", { id, laptopId });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/stock/${id}`);
  },
};
