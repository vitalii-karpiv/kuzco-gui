import Link from "next/link";

export default function StorefrontHome() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Вітрина
      </span>
      <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Kuzco — вживані ноутбуки
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Публічний магазин у розробці. Тут зʼявиться каталог ноутбуків, кошик та
        оформлення замовлення.
      </p>
      <Link
        href="/admin"
        className="text-sm font-medium text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        Адмін-панель →
      </Link>
    </main>
  );
}
