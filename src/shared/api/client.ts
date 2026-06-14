import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_URL } from "@/shared/config";
import { clearToken, getToken, setToken } from "@/shared/auth/token";

/**
 * Shared axios instance for the kuzco-server API.
 *
 * - Request interceptor injects `Authorization: Bearer <token>`.
 * - Response interceptor: on a 401, tries `GET /auth/refresh` once (the httpOnly
 *   refresh cookie rides along via `withCredentials`), stores the new access token,
 *   and replays the original request. Mirrors the legacy CRM's interceptor.
 */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _isRetry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && original && !original._isRetry) {
      original._isRetry = true;
      try {
        const { data } = await axios.get<{ accessToken: string }>(
          `${API_URL}/auth/refresh`,
          { withCredentials: true },
        );
        setToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api.request(original);
      } catch {
        clearToken();
      }
    }

    throw error;
  },
);
