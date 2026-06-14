/**
 * Laptop-group domain types, mirroring kuzco-server's
 * `common/enum/laptop-group-state.ts` and the `LaptopGroup` model (subset used
 * for the laptop cross-link). Labels live here only (requirements §CC-5).
 */

export const LAPTOP_GROUP_STATES = ["service", "preparing", "published"] as const;
export type LaptopGroupState = (typeof LAPTOP_GROUP_STATES)[number];

export const LAPTOP_GROUP_STATE_LABELS: Record<LaptopGroupState, string> = {
  service: "Сервіс",
  preparing: "Підготовка",
  published: "Опубліковано",
};

export const LAPTOP_GROUP_STATE_COLORS: Record<LaptopGroupState, string> = {
  service: "#dc2626",
  preparing: "#d97706",
  published: "#16a34a",
};

export interface LaptopGroup {
  _id: string;
  groupIdentifier?: string;
  groupName?: string;
  title?: string;
  state: LaptopGroupState;
  imageUrl?: string;
}
