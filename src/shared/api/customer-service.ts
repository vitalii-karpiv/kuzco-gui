import { api } from "@/shared/api/client";
import type { Customer } from "@/shared/domain/customer";

/** Client for the kuzco-server `customer` domain. */
export const customerService = {
  /** `POST /customer` — upserts by phone, returns the customer. */
  async upsert(input: { phone: string; pib: string }): Promise<Customer> {
    const { data } = await api.post<Customer>("/customer", input);
    return data;
  },

  /** `GET /customer/:id`. */
  async get(id: string): Promise<Customer> {
    const { data } = await api.get<Customer>(`/customer/${id}`);
    return data;
  },
};
