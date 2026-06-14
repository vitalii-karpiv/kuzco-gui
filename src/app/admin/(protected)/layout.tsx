"use client";

import { type ReactNode } from "react";
import { LogOut } from "lucide-react";

import { AuthGuard, useAuth } from "@/shared/auth/auth-context";
import { AdminSidebar } from "./_components/admin-sidebar";

function AdminTopbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-paper-line bg-paper px-6">
      <span className="font-mono text-xs tracking-tight text-ink-soft">
        {user.email}
      </span>
      <button
        type="button"
        onClick={() => void logout()}
        className="inline-flex items-center gap-2 rounded-lg border border-paper-line bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink/20 hover:bg-paper"
      >
        <LogOut className="size-4" strokeWidth={2} />
        Вийти
      </button>
    </header>
  );
}

function GuardFallback() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-graphite font-mono text-sm tracking-[0.15em] text-muted-console uppercase">
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
      <div className="flex min-h-dvh">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col bg-paper text-ink">
          <AdminTopbar />
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}
