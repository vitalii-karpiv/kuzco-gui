"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { useAuth } from "@/shared/auth/auth-context";
import { KpiStrip } from "./_components/kpi-strip";
import { LifecycleQueues } from "./_components/lifecycle-queues";
import { MyItems } from "./_components/my-items";
import { ToBuy } from "./_components/to-buy";
import { ProcurementWatch } from "./_components/procurement-watch";

export default function DashboardPage() {
  const { user } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);

  function refresh() {
    setReloadKey((k) => k + 1);
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
              /admin/dashboard
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              Вітаємо, {user.name || user.email}
            </h1>
            <p className="text-sm text-ink-soft">
              Огляд робочих черг та показників
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            aria-label="Оновити дашборд"
            className="inline-flex items-center gap-2 rounded-lg border border-paper-line bg-white px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <RefreshCw className="size-4" strokeWidth={2} />
            Оновити
          </button>
        </div>

        {/* KPI strip (DASH-5) */}
        <KpiStrip reloadKey={reloadKey} />

        {/* Lifecycle queue cards (DASH-1) */}
        <LifecycleQueues reloadKey={reloadKey} />

        {/* Two-column area: left = my items + to-buy, right = procurement */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            {/* My items (DASH-2) */}
            <MyItems reloadKey={reloadKey} />

            {/* To-buy queue (DASH-4) */}
            <ToBuy reloadKey={reloadKey} />
          </div>

          {/* Procurement watch (DASH-3) */}
          <ProcurementWatch reloadKey={reloadKey} />
        </div>
      </div>
    </main>
  );
}
