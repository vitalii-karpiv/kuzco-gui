"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { authService, type CurrentUser } from "@/shared/auth/auth-service";
import { clearToken } from "@/shared/auth/token";

interface AuthContextValue {
  user: CurrentUser;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Use the authenticated user within a tree rendered by `AuthGuard`.
 * Throws if used outside the guard (where the user is guaranteed present).
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthGuard>");
  }
  return ctx;
}

/**
 * Client-side route guard (analogue of the legacy CRM's `PrivateRoutes`).
 * On mount it calls `whoami()` — the api client auto-refreshes on a 401 — and:
 *   - while pending, renders `fallback`;
 *   - on success, provides the user and renders `children`;
 *   - on failure, redirects to `/admin/login`.
 */
export function AuthGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let active = true;

    authService
      .whoami()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        clearToken();
        router.replace("/admin/login");
      });

    return () => {
      active = false;
    };
  }, [router]);

  const logout = useCallback(async () => {
    await authService.logout();
    router.replace("/admin/login");
  }, [router]);

  const value = useMemo(
    () => (user ? { user, logout } : null),
    [user, logout],
  );

  if (!value) {
    return <>{fallback ?? null}</>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
