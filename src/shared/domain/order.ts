/**
 * Order domain types + lifecycle maps, mirroring kuzco-server's
 * `common/enum/order-state.ts` and the `Order` model. Labels live here only
 * (requirements §CC-5) so a future i18n pass never touches feature code.
 */

export const ORDER_STATES = [
  "inUsa",
  "waitingForPayment",
  "delivering",
  "requireDocument",
  "taxPayed",
  "delivered",
  "sold",
] as const;

export type OrderState = (typeof ORDER_STATES)[number];

export interface StateHistoryItem {
  state: string;
  timestamp: string;
  initiator: string;
}

/** An order as returned by the API (Mongoose docs expose `_id`). */
export interface Order {
  _id: string;
  code: string;
  name: string;
  ebayUrl?: string;
  shippingUrl?: string;
  dateOfPurchase: string;
  itemsInLot: number;
  state: OrderState;
  note?: string;
  stateHistory?: StateHistoryItem[];
  /** User id of the counterparty, if assigned. */
  counterparty?: string;
}

export const ORDER_STATE_LABELS: Record<OrderState, string> = {
  inUsa: "В США",
  waitingForPayment: "Очікує оплати",
  delivering: "Доставка",
  requireDocument: "Потрібні документи",
  taxPayed: "Податок сплачено",
  delivered: "Доставлено",
  sold: "Продано",
};

/** Tag colors per state (hex — the shared StateTag tints from these). */
export const ORDER_STATE_COLORS: Record<OrderState, string> = {
  inUsa: "#db2777",
  waitingForPayment: "#dc2626",
  delivering: "#ea580c",
  requireDocument: "#7c3aed",
  taxPayed: "#0891b2",
  delivered: "#16a34a",
  sold: "#2563eb",
};
