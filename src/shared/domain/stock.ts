/**
 * Stock (parts) domain types, mirroring kuzco-server's `common/enum/stock-type.ts`,
 * `stock-state.ts` and the `Stock` model. Labels live here only (requirements §CC-5).
 */

export const STOCK_TYPES = [
  "ram",
  "hdd",
  "ssd",
  "battery",
  "screen",
  "flex-cable",
  "keyboard",
  "motherboard",
  "matrix",
  "charger",
] as const;
export type StockType = (typeof STOCK_TYPES)[number];

export const STOCK_TYPE_LABELS: Record<StockType, string> = {
  ram: "Оперативна пам'ять",
  hdd: "HDD",
  ssd: "SSD",
  battery: "Батарея",
  screen: "Екран",
  "flex-cable": "Шлейф",
  keyboard: "Клавіатура",
  motherboard: "Материнська плата",
  matrix: "Матриця",
  charger: "Зарядний пристрій",
};

export const STOCK_STATES = ["free", "booked", "sold"] as const;
export type StockState = (typeof STOCK_STATES)[number];

export const STOCK_STATE_LABELS: Record<StockState, string> = {
  free: "Вільний",
  booked: "Заброньований",
  sold: "Проданий",
};

/** Tag colors per state (hex — the shared StateTag tints from these). */
export const STOCK_STATE_COLORS: Record<StockState, string> = {
  free: "#16a34a",
  booked: "#d97706",
  sold: "#64748b",
};

export interface Stock {
  _id: string;
  name: string;
  code: string;
  laptopId?: string;
  price: number;
  type: StockType;
  state: StockState;
}
