"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { userService } from "@/shared/api/user-service";
import type { User } from "@/shared/domain/user";
import { userFullName } from "@/shared/domain/user";

interface UsersContextValue {
  users: User[];
  /** Resolve a user id to its display name (em dash when unknown). */
  nameOf: (id?: string) => string;
}

const UsersContext = createContext<UsersContextValue | null>(null);

/**
 * Loads the staff user list once and shares it (counterparty + assignee pickers,
 * requirements §USR-2). Mirrors the legacy CRM's `UserContext`. A failed fetch
 * leaves the list empty — callers degrade to ids/em dashes rather than crashing.
 */
export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);

  // Set state only from the async callback (never synchronously in the effect
  // body) to satisfy react-hooks/set-state-in-effect.
  useEffect(() => {
    let active = true;
    userService
      .list()
      .then((list) => {
        if (active) setUsers(list);
      })
      .catch(() => {
        // Non-fatal: pickers simply show no options / raw ids.
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<UsersContextValue>(() => {
    const byId = new Map(users.map((user) => [user._id, user]));
    return {
      users,
      nameOf: (id?: string) => (id ? userFullName(byId.get(id)) : "—"),
    };
  }, [users]);

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

/** Access the shared staff user list. Returns an empty list outside a provider. */
export function useUsers(): UsersContextValue {
  return useContext(UsersContext) ?? { users: [], nameOf: () => "—" };
}
