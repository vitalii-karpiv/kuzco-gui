"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { financeService } from "@/shared/api/finance-service";
import { getErrorMessage } from "@/shared/api/error";
import { formatMoney } from "@/shared/format";
import { cardClass, cardTitleClass } from "@/shared/ui/form";
import type { Balance } from "@/shared/domain/balance";

interface BalanceCardProps {
  reloadKey: number;
}

/** Current bank balances across all accounts, with a Monobank sync action. */
export function BalanceCard({ reloadKey }: BalanceCardProps) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Set state only from async callbacks (never synchronously in the effect
  // body) per react-hooks/set-state-in-effect.
  useEffect(() => {
    let active = true;
    financeService
      .listBalances()
      .then((list) => {
        if (!active) return;
        setBalances(list);
        setError(null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      await financeService.syncBalances();
      setBalances(await financeService.listBalances());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  }

  const total = balances.reduce((sum, balance) => sum + balance.value, 0);

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={`${cardTitleClass} mb-0`}>Баланс</h2>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-lg border border-paper-line px-3 py-1.5 text-sm text-ink-soft transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`size-3.5 ${syncing ? "animate-spin" : ""}`}
            strokeWidth={2}
          />
          Синхронізувати
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
          Завантаження…
        </p>
      ) : (
        <>
          <p className="font-display text-2xl font-extrabold tracking-tight text-ink tabular-nums">
            {formatMoney(total)}
          </p>
          {balances.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {balances.map((balance) => (
                <div
                  key={balance._id}
                  className="rounded-lg border border-paper-line bg-paper/40 px-3 py-2"
                >
                  <p className="font-mono text-[10px] tracking-[0.08em] text-ink-soft uppercase">
                    {balance.title}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-ink tabular-nums">
                    {formatMoney(balance.value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
