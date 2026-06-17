"use client";

import { useState } from "react";

import { SystemStateCard } from "./_components/system-state-card";
import { ServiceActionsCard } from "./_components/service-actions-card";

export default function SystemPage() {
  const [reloadKey, setReloadKey] = useState(0);

  function refresh() {
    setReloadKey((k) => k + 1);
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="space-y-2">
          <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
            /admin/system
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Система
          </h1>
          <p className="text-sm text-ink-soft">
            Адміністрування: стан Kuzco, технічне обслуговування та сервісні дії.
          </p>
          <button
            type="button"
            onClick={refresh}
            className="mt-1 font-mono text-xs tracking-[0.1em] text-ink-soft underline-offset-2 hover:underline"
          >
            Оновити
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SystemStateCard reloadKey={reloadKey} />
          <ServiceActionsCard />
        </div>
      </div>
    </main>
  );
}
