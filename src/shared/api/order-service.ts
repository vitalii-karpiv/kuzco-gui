import { api } from "@/shared/api/client";
import type { Order, OrderState } from "@/shared/domain/order";

export interface OrderListFilter {
  state?: OrderState;
  /** Counterparty user id. */
  counterparty?: string;
}

export interface OrderCreateInput {
  name: string;
  /** ISO date string. */
  dateOfPurchase: string;
  itemsInLot: number;
  state: OrderState;
  ebayUrl?: string;
  shippingUrl?: string;
  note?: string;
  counterparty?: string;
}

export type OrderUpdateInput = { id: string } & Partial<
  Omit<OrderCreateInput, "state">
>;

/**
 * Client for the kuzco-server `order` domain. The acting user is derived from
 * the Bearer token server-side — never send `userId` (requirements §ID-1).
 */
export const orderService = {
  /** `POST /order/list` — returns all matching orders (no server pagination). */
  async list(filter: OrderListFilter = {}): Promise<Order[]> {
    const { data } = await api.post<{ itemList: Order[] }>(
      "/order/list",
      filter,
    );
    return data.itemList ?? [];
  },

  async get(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/order/${id}`);
    return data;
  },

  async create(input: OrderCreateInput): Promise<Order> {
    const { data } = await api.post<Order>("/order", input);
    return data;
  },

  async update(input: OrderUpdateInput): Promise<Order> {
    const { data } = await api.patch<Order>("/order", input);
    return data;
  },

  async setState(id: string, state: OrderState): Promise<Order> {
    const { data } = await api.post<Order>("/order/setState", { id, state });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/order/${id}`);
  },
};
