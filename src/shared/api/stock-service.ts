import { api } from "@/shared/api/client";
import type { Stock, StockState, StockType } from "@/shared/domain/stock";

export interface StockListFilter {
  laptopId?: string;
  type?: StockType;
  state?: StockState;
  name?: string;
}

export interface StockCreateInput {
  name: string;
  price: number;
  type: StockType;
  /** When set, the new item is booked to the laptop. */
  laptopId?: string;
}

/** Client for the kuzco-server `stock` domain (subset used by the laptop detail). */
export const stockService = {
  /** `POST /stock/list`. */
  async list(filter: StockListFilter = {}): Promise<Stock[]> {
    const { data } = await api.post<{ itemList: Stock[] }>("/stock/list", filter);
    return data.itemList ?? [];
  },

  /** `POST /stock` — returns the created item(s). */
  async create(input: StockCreateInput): Promise<Stock[]> {
    const { data } = await api.post<Stock[]>("/stock", input);
    return data;
  },

  /** `PATCH /stock` — book to a laptop (`laptopId`) or release it (`null`). */
  async setLaptop(id: string, laptopId: string | null): Promise<Stock> {
    const { data } = await api.patch<Stock>("/stock", { id, laptopId });
    return data;
  },
};
