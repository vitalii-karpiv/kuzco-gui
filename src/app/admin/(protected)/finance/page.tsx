"use client";

import { useState } from "react";

import { FinanceFilterBar } from "./_components/finance-filter-bar";
import { RevenueEarnCard } from "./_components/revenue-earn-card";
import { BalanceCard } from "./_components/balance-card";
import { ExpenseTable } from "./_components/expense-table";
import { InvestmentTable } from "./_components/investment-table";
import { defaultFinanceRange, type FinanceDateRange } from "./_components/date-range";

export default function FinancePage() {
  const [range, setRange] = useState<FinanceDateRange>(defaultFinanceRange);
  const [reloadKey, setReloadKey] = useState(0);

  function refresh() {
    setReloadKey((key) => key + 1);
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="space-y-2">
          <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
            /admin/finance
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Фінанси
          </h1>
          <p className="text-sm text-ink-soft">
            Зведений огляд: баланси, P&amp;L за період, витрати та інвестиції зі
            спільним фільтром дат.
          </p>
        </div>

        <FinanceFilterBar
          value={range}
          onChange={setRange}
          loading={false}
          onRefresh={refresh}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueEarnCard range={range} reloadKey={reloadKey} />
          <BalanceCard reloadKey={reloadKey} />
        </div>

        <ExpenseTable range={range} reloadKey={reloadKey} onMutate={refresh} />

        <InvestmentTable range={range} reloadKey={reloadKey} onMutate={refresh} />
      </div>
    </main>
  );
}
