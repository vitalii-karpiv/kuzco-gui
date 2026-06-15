import { api } from "@/shared/api/client";
import type { Image } from "@/shared/domain/image";

/** Client for the kuzco-server `image` domain (scoped to a laptop). */
export const imageService = {
  /** `POST /image/list` by laptop. */
  async list(laptopId: string): Promise<Image[]> {
    const { data } = await api.post<Image[]>("/image/list", { laptopId });
    return data ?? [];
  },

  /** `POST /image/upload` — multipart; axios sets the boundary from FormData. */
  async upload(laptopId: string, file: File): Promise<void> {
    const form = new FormData();
    form.append("image", file);
    form.append("laptopId", laptopId);
    await api.post("/image/upload", form);
  },

  /** `DELETE /image/:id`. */
  async remove(id: string): Promise<void> {
    await api.delete(`/image/${id}`);
  },

  /** `POST /image/list` by laptop-group. */
  async listByGroup(groupId: string): Promise<Image[]> {
    const { data } = await api.post<Image[]>("/image/list", { groupId });
    return data ?? [];
  },

  /** `POST /image/upload` — multipart, attached to a laptop-group. */
  async uploadToGroup(groupId: string, file: File): Promise<void> {
    const form = new FormData();
    form.append("image", file);
    form.append("groupId", groupId);
    await api.post("/image/upload", form);
  },

  /** `POST /image/linkGroup` — copy a laptop's photos onto the group. */
  async linkGroup(
    laptopId: string,
    groupId: string,
  ): Promise<{ count?: number }> {
    const { data } = await api.post<{ count?: number }>("/image/linkGroup", {
      laptopId,
      groupId,
    });
    return data ?? {};
  },
};
