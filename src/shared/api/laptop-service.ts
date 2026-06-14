import { api } from "@/shared/api/client";
import type {
  Characteristics,
  Laptop,
  LaptopState,
  PanelType,
  TechCheck,
} from "@/shared/domain/laptop";

export interface LaptopListFilter {
  /** Restrict to laptops belonging to a given order. */
  orderId?: string;
  stateList?: LaptopState[];
  /** Regex search across name + serviceTag (server-side). */
  name?: string;
  screenSize?: number;
  panelType?: PanelType;
  ssd?: number;
  ram?: number;
  touch?: boolean;
  keyLight?: boolean;
  discrete?: boolean;
  inGroup?: boolean;
  assignee?: string;
  idList?: string[];
  toBuy?: boolean;
  /** Mongo sort object, e.g. `{ sellPrice: -1 }`. */
  sorters?: Record<string, 1 | -1>;
}

export interface LaptopCreateInput {
  /** A laptop always belongs to an order. */
  orderId: string;
  name: string;
  serviceTag?: string;
  assignee?: string;
}

export type LaptopUpdateInput = {
  id: string;
  serviceTag?: string;
  note?: string;
  costPrice?: number;
  limitPrice?: number;
  sellPrice?: number;
  assignee?: string;
  laptopGroupId?: string;
  imageUrl?: string;
  toBuy?: string[];
  bought?: string[];
  complectation?: string[];
  defects?: string[];
  techCheck?: TechCheck;
  characteristics?: Characteristics;
};

/**
 * Client for the kuzco-server `laptop` domain. The acting user is derived from
 * the Bearer token server-side — never send `userId` (requirements §ID-1).
 */
export const laptopService = {
  /** `POST /laptop/list` — server applies filters/sort (pagination is a no-op today). */
  async list(filter: LaptopListFilter = {}): Promise<Laptop[]> {
    const { data } = await api.post<{ itemList: Laptop[] }>(
      "/laptop/list",
      filter,
    );
    return data.itemList ?? [];
  },

  async get(id: string): Promise<Laptop> {
    const { data } = await api.get<Laptop>(`/laptop/${id}`);
    return data;
  },

  async setState(id: string, state: LaptopState): Promise<Laptop> {
    const { data } = await api.post<Laptop>("/laptop/setState", { id, state });
    return data;
  },

  async create(input: LaptopCreateInput): Promise<Laptop> {
    const { data } = await api.post<Laptop>("/laptop", input);
    return data;
  },

  async update(input: LaptopUpdateInput): Promise<Laptop> {
    const { data } = await api.patch<Laptop>("/laptop", input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/laptop/${id}`);
  },
};
