"use client";

import { type ReactNode } from "react";

import { AuthGuard, useAuth } from "@/shared/auth/auth-context";

function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
      <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Kuzco CRM
      </span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {user.email}
        </span>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Вийти
        </button>
      </div>
    </header>
  );
}

function GuardFallback() {
  return (
    <div className="flex flex-1 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
      Завантаження…
    </div>
  );
}

export default function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard fallback={<GuardFallback />}>
      <div className="flex min-h-full flex-1 flex-col">
        <AdminHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </AuthGuard>
  );
}
