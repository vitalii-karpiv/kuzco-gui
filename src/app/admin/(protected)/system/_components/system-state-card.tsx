"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";

import { kuzcoService } from "@/shared/api/kuzco-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass, cardTitleClass } from "@/shared/ui/form";
import type { KuzcoState } from "@/shared/domain/kuzco";

interface SystemStateCardProps {
  reloadKey: number;
}

/** Displays the current Kuzco system state and allows toggling it. */
export function SystemStateCard({ reloadKey }: SystemStateCardProps) {
  const [state, setState] = useState<KuzcoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [pendingState, setPendingState] = useState<KuzcoState | null>(null);

  useEffect(() => {
    let active = true;
    kuzcoService
      .getState()
      .then((kuzco) => {
        if (!active) return;
        setState(kuzco.state);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function requestToggle(target: KuzcoState) {
    setPendingState(target);
  }

  function cancelToggle() {
    setPendingState(null);
  }

  async function confirmToggle() {
    if (!pendingState) return;
    setToggling(true);
    setError(null);
    try {
      const updated = await kuzcoService.setState(pendingState);
      setState(updated.state);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setToggling(false);
      setPendingState(null);
    }
  }

  const isActive = state === "active";

  return (
    <section className={cardClass}>
      <h2 className={cardTitleClass}>Стан системи</h2>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
          Завантаження…
        </p>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            {isActive ? (
              <ShieldCheck className="size-5 text-emerald-600" strokeWidth={1.75} />
            ) : (
              <ShieldOff className="size-5 text-amber-500" strokeWidth={1.75} />
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {isActive ? "Активний" : "Лише читання"}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => requestToggle("active")}
              disabled={state === "active" || toggling}
              className="rounded-lg border border-paper-line px-4 py-2 text-sm text-ink-soft transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Активний
            </button>
            <button
              type="button"
              onClick={() => requestToggle("readonly")}
              disabled={state === "readonly" || toggling}
              className="rounded-lg border border-paper-line px-4 py-2 text-sm text-ink-soft transition-colors hover:border-amber-300 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Лише читання
            </button>
          </div>

          <p className="mt-3 text-xs text-ink-soft">
            {isActive
              ? "Всі операції дозволені. Переведіть у режим «Лише читання» для технічного обслуговування."
              : "Лише GET-запити дозволені. CRM, каталог і Telegram-бот заморожені на запис."}
          </p>
        </>
      )}

      {/* Confirmation dialog */}
      {pendingState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-paper-line bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-extrabold tracking-tight text-ink">
              {pendingState === "readonly"
                ? "Перейти в режим лише читання?"
                : "Активувати систему?"}
            </h3>
            {pendingState === "readonly" && (
              <p className="mt-2 text-sm text-ink-soft">
                Усі операції запису будуть заблоковані для CRM, каталогу та
                Telegram-бота. GET-запити залишаться доступними.
              </p>
            )}
            {pendingState === "active" && (
              <p className="mt-2 text-sm text-ink-soft">
                Система повернеться до повноцінного режиму роботи.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelToggle}
                disabled={toggling}
                className="rounded-lg border border-paper-line px-4 py-2 text-sm text-ink-soft transition-colors hover:text-ink disabled:opacity-60"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={confirmToggle}
                disabled={toggling}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${
                  pendingState === "readonly"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {toggling ? "Збереження…" : "Підтвердити"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
