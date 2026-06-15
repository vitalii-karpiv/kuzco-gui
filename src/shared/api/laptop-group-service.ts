import { api } from "@/shared/api/client";
import type {
  LaptopGroup,
  LaptopGroupState,
  LaptopVariant,
  Marketplace,
  MarketplaceCode,
} from "@/shared/domain/laptop-group";

export interface LaptopGroupListFilter {
  /** Regex search across groupName + title (server-side). */
  groupName?: string;
  state?: LaptopGroupState[];
  /** Filter by the Instagram marketplace's published flag. */
  isInstagramPublished?: boolean;
}

export interface LaptopGroupUpdateInput {
  id: string;
  title?: string;
  groupDescription?: string;
  note?: string;
  imageUrl?: string;
  variants?: LaptopVariant[];
  marketplaces?: Marketplace[];
}

/**
 * Client for the kuzco-server `laptop-group` domain. The acting user is derived
 * from the Bearer token server-side — never send `userId` (requirements §ID-1).
 */
export const laptopGroupService = {
  /** `POST /laptopGroup/list` — server applies filters (pagination is a no-op today). */
  async list(filter: LaptopGroupListFilter = {}): Promise<LaptopGroup[]> {
    const { data } = await api.post<{ itemList: LaptopGroup[] }>(
      "/laptopGroup/list",
      filter,
    );
    return data.itemList ?? [];
  },

  async get(id: string): Promise<LaptopGroup> {
    const { data } = await api.get<LaptopGroup>(`/laptopGroup/${id}`);
    return data;
  },

  async update(input: LaptopGroupUpdateInput): Promise<LaptopGroup> {
    const { data } = await api.patch<LaptopGroup>("/laptopGroup", input);
    return data;
  },

  async setState(id: string, state: LaptopGroupState): Promise<LaptopGroup> {
    const { data } = await api.post<LaptopGroup>("/laptopGroup/setState", {
      id,
      state,
    });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/laptopGroup/${id}`);
  },

  /** `POST /laptopGroup/addLaptop` → returns the updated group. */
  async addLaptop(laptopId: string): Promise<LaptopGroup> {
    const { data } = await api.post<LaptopGroup>("/laptopGroup/addLaptop", {
      laptopId,
    });
    return data;
  },

  /** `POST /laptopGroup/removeLaptop` → returns the updated group. */
  async removeLaptop(groupId: string, laptopId: string): Promise<LaptopGroup> {
    const { data } = await api.post<LaptopGroup>("/laptopGroup/removeLaptop", {
      groupId,
      laptopId,
    });
    return data;
  },

  /** `POST /laptopGroup/marketplace/generateDescription` → updated group (AI text). */
  async generateMarketplaceDescription(
    id: string,
    code: MarketplaceCode,
  ): Promise<LaptopGroup> {
    const { data } = await api.post<LaptopGroup>(
      "/laptopGroup/marketplace/generateDescription",
      { id, code },
    );
    return data;
  },

  /** `POST /laptopGroup/marketplace/togglePublished` → updated group. */
  async toggleMarketplacePublished(
    id: string,
    code: MarketplaceCode,
  ): Promise<LaptopGroup> {
    const { data } = await api.post<LaptopGroup>(
      "/laptopGroup/marketplace/togglePublished",
      { id, code },
    );
    return data;
  },
};
