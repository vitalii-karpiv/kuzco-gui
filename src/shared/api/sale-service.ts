import { api } from "@/shared/api/client";
import type { DeliveryType, Sale, SaleSource } from "@/shared/domain/sale";

export interface SaleCreateInput {
  laptopId: string;
  price?: number;
  source?: SaleSource;
  deliveryType?: DeliveryType;
  customerId?: string;
  note?: string;
}

/** Client for the kuzco-server `sale` domain (subset used by the laptop detail). */
export const saleService = {
  /** `POST /sale/list` filtered to a single laptop. */
  async listByLaptop(laptopId: string): Promise<Sale[]> {
    const { data } = await api.post<{ itemList: Sale[] }>("/sale/list", {
      laptopIdList: [laptopId],
    });
    return data.itemList ?? [];
  },

  /** `POST /sale` — also flips the laptop to `waitingForDelivery` server-side. */
  async create(input: SaleCreateInput): Promise<Sale> {
    const { data } = await api.post<Sale>("/sale", input);
    return data;
  },
};
