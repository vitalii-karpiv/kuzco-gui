/**
 * Laptop domain types + lifecycle maps, mirroring kuzco-server's
 * `common/enum/laptop-state.ts` and the `Laptop` model. Only the subset the
 * admin reads today is typed here; extend as laptop screens are built.
 * Labels live here only (requirements §CC-5).
 */

export const LAPTOP_STATES = [
  "new",
  "toService",
  "toTest",
  "toPhotoSession",
  "toPublish",
  "selling",
  "waitingForApproval",
  "waitingForDelivery",
  "delivering",
  "done",
] as const;

export type LaptopState = (typeof LAPTOP_STATES)[number];

/**
 * States considered "in progress" — the default list-view selection, mirroring
 * the old CRM's `getActiveStates` (everything before it leaves the workshop).
 */
export const ACTIVE_LAPTOP_STATES: LaptopState[] = [
  "new",
  "toService",
  "toTest",
  "toPhotoSession",
  "toPublish",
  "selling",
  "waitingForApproval",
];

export const PANEL_TYPES = ["tn", "ips", "oled"] as const;
export type PanelType = (typeof PANEL_TYPES)[number];

export const PANEL_TYPE_LABELS: Record<PanelType, string> = {
  tn: "TN",
  ips: "IPS",
  oled: "OLED",
};

export const RESOLUTIONS = ["hd", "fhd", "qhd", "uhd"] as const;
export const RESOLUTION_LABELS: Record<string, string> = {
  hd: "HD",
  fhd: "Full HD",
  qhd: "2K",
  uhd: "4K",
};

export const REFRESH_RATES = ["60", "120", "144", "240"] as const;
export const REFRESH_RATE_LABELS: Record<string, string> = {
  "60": "60 Гц",
  "120": "120 Гц",
  "144": "144 Гц",
  "240": "240 Гц",
};

export const LAPTOP_CONDITIONS = ["a+", "a", "b", "c"] as const;
export type LaptopCondition = (typeof LAPTOP_CONDITIONS)[number];

export const LAPTOP_CONDITION_LABELS: Record<LaptopCondition, string> = {
  "a+": "A+",
  a: "A",
  b: "B",
  c: "C",
};

/** Tech-check items, mirroring the server's `TechCheck` model (all booleans). */
export const TECH_CHECK_KEYS = [
  "keyboard",
  "camera",
  "micro",
  "sound",
  "display",
  "batteryTakeCharge",
  "batteryHoldCharge",
  "ports",
  "cooler",
  "aidaStressTest",
  "memTest",
] as const;

export type TechCheckKey = (typeof TECH_CHECK_KEYS)[number];
export type TechCheck = Record<TechCheckKey, boolean>;

export const TECH_CHECK_LABELS: Record<TechCheckKey, string> = {
  keyboard: "Клавіатура",
  camera: "Камера",
  micro: "Мікрофон",
  sound: "Звук",
  display: "Дисплей",
  batteryTakeCharge: "Батарея бере заряд",
  batteryHoldCharge: "Батарея тримає заряд",
  ports: "Порти",
  cooler: "Кулер",
  aidaStressTest: "Aida стрес-тест",
  memTest: "Memtest",
};

/** Technical characteristics of a laptop (subset the admin reads/exports). */
export interface Characteristics {
  processor?: string;
  videocard?: string;
  discrete?: boolean;
  ssd?: number;
  ram?: number;
  screenSize?: number;
  resolution?: string;
  panelType?: string;
  refreshRate?: string;
  touch?: boolean;
  keyLight?: boolean;
  battery?: number;
  isTransformer?: boolean;
  condition?: LaptopCondition;
  ports?: string[];
}

/** A laptop as returned by `GET /laptop/:id` (full model). */
export interface Laptop {
  _id: string;
  orderId: string;
  code: string;
  name: string;
  serviceTag?: string;
  state: LaptopState;
  costPrice?: number;
  limitPrice?: number;
  sellPrice?: number;
  assignee?: string;
  note?: string;
  imageUrl?: string;
  laptopGroupId?: string;
  characteristics?: Characteristics;
  techCheck?: TechCheck;
  defects?: string[];
  toBuy?: string[];
  bought?: string[];
  complectation?: string[];
}

export const LAPTOP_STATE_LABELS: Record<LaptopState, string> = {
  new: "Новий",
  toService: "На сервіс",
  toTest: "На тест",
  toPhotoSession: "На фотосесію",
  toPublish: "На публікацію",
  selling: "Продається",
  waitingForApproval: "Очікує підтвердження",
  waitingForDelivery: "Очікує доставки",
  delivering: "Доставка",
  done: "Завершено",
};

/** Tag colors per state (hex — the shared StateTag tints from these). */
export const LAPTOP_STATE_COLORS: Record<LaptopState, string> = {
  new: "#64748b",
  toService: "#dc2626",
  toTest: "#ea580c",
  toPhotoSession: "#d97706",
  toPublish: "#7c3aed",
  selling: "#2563eb",
  waitingForApproval: "#db2777",
  waitingForDelivery: "#0891b2",
  delivering: "#0d9488",
  done: "#16a34a",
};
