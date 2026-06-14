"use client";

import { Layers, Package, ShoppingCart } from "lucide-react";

import { useAuth } from "@/shared/auth/auth-context";

const QUEUES = [
  {
    title: "Замовлення",
    description: "Закупівлі та доставки в роботі",
    icon: Package,
  },
  {
    title: "Ноутбуки за станом",
    description: "Сервіс · тест · фотосесія · публікація",
    icon: Layers,
  },
  {
    title: "Продажі на підтвердження",
    description: "Заявки зі вітрини, що очікують підтвердження",
    icon: ShoppingCart,
  },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <div className="space-y-2">
          <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
            /admin/dashboard
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Вітаємо, {user.name || user.email}
          </h1>
          <p className="text-sm text-ink-soft">
            Огляд робочих черг. Дані підключимо на наступному етапі.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUEUES.map((queue) => {
            const Icon = queue.icon;
            return (
              <div
                key={queue.title}
                className="group relative overflow-hidden rounded-2xl border border-paper-line bg-white p-5 transition-colors hover:border-ink/15"
              >
                <span className="absolute top-0 left-0 h-full w-[3px] bg-accent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-ink">
                      {queue.title}
                    </h2>
                    <p className="mt-1 text-sm text-ink-soft">
                      {queue.description}
                    </p>
                  </div>
                  <Icon className="size-5 shrink-0 text-ink-soft" strokeWidth={1.75} />
                </div>
                <p className="mt-6 font-display text-4xl font-extrabold tabular-nums text-paper-line">
                  —
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
