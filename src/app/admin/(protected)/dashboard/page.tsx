"use client";

import { useAuth } from "@/shared/auth/auth-context";

const QUEUES = [
  { title: "Замовлення", description: "Закупівлі та доставки в роботі" },
  { title: "Ноутбуки за станом", description: "Сервіс · тест · фотосесія · публікація" },
  { title: "Продажі на підтвердження", description: "Заявки зі вітрини, що очікують підтвердження" },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="flex-1 px-6 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Вітаємо, {user.name || user.email}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Огляд робочих черг. Дані підключимо на наступному етапі.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUEUES.map((queue) => (
            <div
              key={queue.title}
              className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {queue.title}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {queue.description}
              </p>
              <p className="mt-4 text-3xl font-semibold tabular-nums text-zinc-300 dark:text-zinc-700">
                —
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
