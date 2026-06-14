import { api } from "@/shared/api/client";
import { clearToken, setToken } from "@/shared/auth/token";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone: string;
}

interface LoginResponse {
  accessToken: string;
}

export const authService = {
  /** Authenticate and persist the access token. Refresh cookie is set by the server. */
  async login(credentials: { email: string; password: string }): Promise<void> {
    const { data } = await api.post<LoginResponse>("/auth/login", credentials);
    setToken(data.accessToken);
  },

  /** Clear the server-side refresh cookie and the local access token. */
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      clearToken();
    }
  },

  /** Fetch the currently authenticated user. Throws if unauthenticated. */
  async whoami(): Promise<CurrentUser> {
    const { data } = await api.get<CurrentUser>("/user/whoami");
    return data;
  },
};
