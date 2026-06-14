/**
 * Sale domain types, mirroring kuzco-server's `common/enum/sale-state.ts`,
 * `sale-source.ts`, `delivery.ts` and the `Sale` model. Labels live here only
 * (requirements §CC-5).
 */

export const SALE_STATES = [
  "new",
  "toApprove",
  "delivering",
  "done",
  "rejected",
] as const;
export type SaleState = (typeof SALE_STATES)[number];

export const SALE_STATE_LABELS: Record<SaleState, string> = {
  new: "Нова",
  toApprove: "На підтвердження",
  delivering: "Доставка",
  done: "Завершена",
  rejected: "Відхилена",
};

export const SALE_STATE_COLORS: Record<SaleState, string> = {
  new: "#2563eb",
  toApprove: "#db2777",
  delivering: "#0891b2",
  done: "#16a34a",
  rejected: "#dc2626",
};

export const SALE_SOURCES = [
  "olx",
  "inst",
  "telegram",
  "tiktok",
  "prom",
  "website",
] as const;
export type SaleSource = (typeof SALE_SOURCES)[number];

export const SALE_SOURCE_LABELS: Record<SaleSource, string> = {
  olx: "OLX",
  inst: "Instagram",
  telegram: "Telegram",
  tiktok: "TikTok",
  prom: "Prom",
  website: "Сайт",
};

export const DELIVERY_TYPES = ["novapost", "ukrpost", "meest", "pickUp"] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  novapost: "Нова Пошта",
  ukrpost: "Укрпошта",
  meest: "Meest",
  pickUp: "Самовивіз",
};

export interface Sale {
  _id: string;
  code: string;
  laptopId: string;
  price?: number;
  date: string;
  source?: SaleSource;
  deliveryType?: DeliveryType;
  ttn?: string;
  customerId?: string;
  state: SaleState;
  assignee?: string;
  note?: string;
}
