"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { authService } from "@/shared/auth/auth-service";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authService.login({ email, password });
      router.push("/admin/dashboard");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setError("Невірна пошта або пароль.");
      } else {
        setError("Не вдалося увійти. Спробуйте ще раз.");
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-graphite px-6 py-24 text-ink-dark">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center space-y-3 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-accent font-display text-2xl font-extrabold text-graphite">
            K
          </span>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-dark">
              KUZCO
            </h1>
            <p className="font-mono text-[11px] tracking-[0.2em] text-accent">
              {"// OPS CONSOLE"}
            </p>
          </div>
        </div>

        <form
          className="space-y-4 rounded-2xl border border-hairline bg-panel p-8"
          onSubmit={onSubmit}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block font-mono text-[11px] tracking-[0.1em] text-muted-console uppercase"
            >
              Електронна пошта
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@kuzco.com"
              className="w-full rounded-lg border border-hairline bg-graphite px-3 py-2 text-sm text-ink-dark outline-none placeholder:text-muted-console/50 focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block font-mono text-[11px] tracking-[0.1em] text-muted-console uppercase"
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-hairline bg-graphite px-3 py-2 text-sm text-ink-dark outline-none placeholder:text-muted-console/50 focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-graphite transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Вхід…" : "Увійти"}
          </button>
        </form>
      </div>
    </main>
  );
}
