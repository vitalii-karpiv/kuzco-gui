import { api } from "@/shared/api/client";
import type { Kuzco, KuzcoState } from "@/shared/domain/kuzco";

/** Client for the kuzco-server `kuzco` domain (global system control). */
export const kuzcoService = {
  /** `GET /kuzco` — returns the current Kuzco singleton state. */
  async getState(): Promise<Kuzco> {
    const { data } = await api.get<Kuzco>("/kuzco");
    return data;
  },

  /** `PUT /kuzco` — switches system state to `active` or `readonly`. */
  async setState(state: KuzcoState): Promise<Kuzco> {
    const { data } = await api.put<Kuzco>("/kuzco", { state });
    return data;
  },
};
