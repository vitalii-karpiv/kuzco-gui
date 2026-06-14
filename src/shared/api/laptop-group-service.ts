import { api } from "@/shared/api/client";
import type { LaptopGroup } from "@/shared/domain/laptop-group";

/** Client for the kuzco-server `laptop-group` domain (subset for the cross-link). */
export const laptopGroupService = {
  async get(id: string): Promise<LaptopGroup> {
    const { data } = await api.get<LaptopGroup>(`/laptopGroup/${id}`);
    return data;
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
};
