import { api } from "@/shared/api/client";
import type { User } from "@/shared/domain/user";

export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
  surname: string;
  /** Ukrainian phone format, e.g. +380501234567 */
  phone: string;
}

export interface UserUpdateInput {
  id: string;
  email?: string;
  name?: string;
  surname?: string;
  phone?: string;
}

/** Client for the kuzco-server `user` domain. */
export const userService = {
  /** `POST /user/list` — returns all staff users (no body, raw array). */
  async list(): Promise<User[]> {
    const { data } = await api.post<User[]>("/user/list");
    return data ?? [];
  },

  /** `POST /user` — create a new staff user. */
  async create(input: UserCreateInput): Promise<User> {
    const { data } = await api.post<User>("/user", input);
    return data;
  },

  /** `GET /user/:id` — fetch a single staff user. */
  async get(id: string): Promise<User> {
    const { data } = await api.get<User>(`/user/${id}`);
    return data;
  },

  /** `PATCH /user` — update a staff user (password change not supported server-side). */
  async update(input: UserUpdateInput): Promise<User> {
    const { data } = await api.patch<User>("/user", input);
    return data;
  },

  /** `DELETE /user/:id` — permanently delete a staff user. */
  async remove(id: string): Promise<void> {
    await api.delete(`/user/${id}`);
  },
};
