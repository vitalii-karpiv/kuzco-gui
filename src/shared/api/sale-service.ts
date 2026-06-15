import { api } from "@/shared/api/client";
import type {
  DeliveryType,
  Sale,
  SaleSource,
  SaleState,
} from "@/shared/domain/sale";

export interface SaleCreateInput {
  laptopId: string;
  price?: number;
  source?: SaleSource;
  deliveryType?: DeliveryType;
  customerId?: string;
  note?: string;
}

export interface SaleListFilter {
  source?: SaleSource;
  laptopIdList?: string[];
  state?: SaleState[];
  customerId?: string;
  assignee?: string;
  /** Inclusive ISO date range on the sale's `date`. */
  dateRange?: { from: string; to: string };
  /** Mongo sort object, e.g. `{ date: -1 }`. */
  sorters?: Record<string, 1 | -1>;
}

export interface SaleUpdateInput {
  id: string;
  laptopId?: string;
  price?: number;
  source?: SaleSource;
  deliveryType?: DeliveryType;
  ttn?: string;
  customerId?: string;
  assignee?: string;
  note?: string;
}

/**
 * Client for the kuzco-server `sale` domain. The acting user is derived from the
 * Bearer token server-side — never send `userId` (requirements §ID-1).
 */
export const saleService = {
  /** `POST /sale/list` — server applies filters/sort (pagination is a no-op today). */
  async list(filter: SaleListFilter = {}): Promise<Sale[]> {
    const { data } = await api.post<{ itemList: Sale[] }>("/sale/list", filter);
    return data.itemList ?? [];
  },

  /** `POST /sale/list` filtered to a single laptop. */
  async listByLaptop(laptopId: string): Promise<Sale[]> {
    const { data } = await api.post<{ itemList: Sale[] }>("/sale/list", {
      laptopIdList: [laptopId],
    });
    return data.itemList ?? [];
  },

  async get(id: string): Promise<Sale> {
    const { data } = await api.get<Sale>(`/sale/${id}`);
    return data;
  },

  /** `POST /sale` — also flips the laptop to `waitingForDelivery` server-side. */
  async create(input: SaleCreateInput): Promise<Sale> {
    const { data } = await api.post<Sale>("/sale", input);
    return data;
  },

  async update(input: SaleUpdateInput): Promise<Sale> {
    const { data } = await api.patch<Sale>("/sale", input);
    return data;
  },

  /** `POST /sale/setState` — side-effects the linked laptop's state. */
  async setState(id: string, state: SaleState): Promise<Sale> {
    const { data } = await api.post<Sale>("/sale/setState", { id, state });
    return data;
  },

  /** `POST /sale/setAssignee`. */
  async setAssignee(id: string, assignee: string): Promise<Sale> {
    const { data } = await api.post<Sale>("/sale/setAssignee", { id, assignee });
    return data;
  },

  /** `DELETE /sale/:id` — reverts the laptop to `selling`. */
  async remove(id: string): Promise<void> {
    await api.delete(`/sale/${id}`);
  },
};
