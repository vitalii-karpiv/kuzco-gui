"use client";

import { RefreshCw, Search } from "lucide-react";

interface UserFilterBarProps {
  value: string;
  onChange: (next: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export function UserFilterBar({
  value,
  onChange,
  loading,
  onRefresh,
}: UserFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Пошук за ім'ям, email, телефоном…"
          className="w-full rounded-lg border border-paper-line bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>
      <button
        type="button"
        onClick={onRefresh}
        aria-label="Оновити"
        className="inline-flex items-center justify-center rounded-lg border border-paper-line bg-white p-2 text-ink-soft transition-colors hover:text-ink"
      >
        <RefreshCw
          className={`size-4 ${loading ? "animate-spin" : ""}`}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}
