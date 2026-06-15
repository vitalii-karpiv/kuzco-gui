/**
 * Laptop-group domain types, mirroring kuzco-server's
 * `common/enum/laptop-group-state.ts` and the `LaptopGroup` model (incl. nested
 * variants + marketplaces). Labels live here only (requirements §CC-5).
 */

import type { LaptopCondition } from "@/shared/domain/laptop";

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

/** Marketplaces a group can publish to (only Instagram today). */
export const MARKETPLACE_CODES = ["instagram"] as const;
export type MarketplaceCode = (typeof MARKETPLACE_CODES)[number];

export const MARKETPLACE_LABELS: Record<MarketplaceCode, string> = {
  instagram: "Instagram",
};

/** Battery condition of a variant (server `BatteryCondition` enum, distinct from
 * the laptop's numeric battery %). */
export const BATTERY_CONDITIONS = ["excellent", "good", "fair", "poor"] as const;
export type BatteryCondition = (typeof BATTERY_CONDITIONS)[number];

export const BATTERY_CONDITION_LABELS: Record<BatteryCondition, string> = {
  excellent: "Відмінна",
  good: "Добра",
  fair: "Задовільна",
  poor: "Слабка",
};

export const BATTERY_CONDITION_COLORS: Record<BatteryCondition, string> = {
  excellent: "#16a34a",
  good: "#65a30d",
  fair: "#d97706",
  poor: "#dc2626",
};

/** A spec/price combination within a group (server `LaptopVariant`, `_id: false`). */
export interface LaptopVariant {
  identifier?: string;
  ram?: number;
  ssd?: number;
  touch?: boolean;
  battery?: BatteryCondition;
  condition?: LaptopCondition;
  price?: number;
  itemList: string[];
}

/** Per-marketplace publish state + generated text (server `Marketplace`). */
export interface Marketplace {
  code: MarketplaceCode;
  published: boolean;
  description?: string;
}

export interface LaptopGroup {
  _id: string;
  groupIdentifier?: string;
  groupName?: string;
  title?: string;
  groupDescription?: string;
  state: LaptopGroupState;
  imageUrl?: string;
  note?: string;
  // Identifying specs (shared by every laptop in the group).
  processor?: string;
  videocard?: string;
  discrete?: boolean;
  isTransformer?: boolean;
  screenSize?: number;
  resolution?: string;
  panelType?: string;
  refreshRate?: string;
  variants?: LaptopVariant[];
  marketplaces?: Marketplace[];
  /** Legacy flat membership list (pre-variants groups). */
  itemList?: string[];
}

/** Total laptops in a group: sum of variants' itemLists, falling back to the
 * legacy flat `itemList`. Mirrors the CRM's count logic. */
export function laptopCountOf(group: LaptopGroup): number {
  const fromVariants = (group.variants ?? []).reduce(
    (sum, variant) => sum + (variant.itemList?.length ?? 0),
    0,
  );
  if (fromVariants > 0) return fromVariants;
  return group.itemList?.length ?? 0;
}

/** All laptop ids referenced by a group (variants + legacy list), de-duplicated. */
export function laptopIdsOf(group: LaptopGroup): string[] {
  const variantIds = (group.variants ?? []).flatMap((v) => v.itemList ?? []);
  const legacyIds = group.itemList ?? [];
  return Array.from(new Set([...variantIds, ...legacyIds].filter(Boolean)));
}
