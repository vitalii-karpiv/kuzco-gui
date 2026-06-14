import { api } from "@/shared/api/client";
import type { User } from "@/shared/domain/user";

/** Client for the kuzco-server `user` domain. */
export const userService = {
  /** `POST /user/list` — returns all staff users (no body, raw array). */
  async list(): Promise<User[]> {
    const { data } = await api.post<User[]>("/user/list");
    return data ?? [];
  },
};
