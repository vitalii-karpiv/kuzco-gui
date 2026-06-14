import Link from "next/link";

export default function AdminDashboard() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Адмін-панель
      </span>
      <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Панель керування Kuzco
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        CRM у розробці. Тут зʼявляться замовлення, ноутбуки, продажі, склад та
        фінанси.
      </p>
      <Link
        href="/admin/login"
        className="text-sm font-medium text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        Увійти →
      </Link>
    </main>
  );
}
