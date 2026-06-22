# Kuzco Storefront — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public, mobile-first storefront (browse → product detail → cart → checkout → info pages) inside `kuzco-gui`'s `(storefront)` route group, replacing the standalone `kuzco-catalog` SPA.

**Architecture:** Next.js App Router. Browse and detail pages are Server Components that fetch the public `kuzco-server` endpoints via a small server-safe `fetch` layer (no auth, no axios). Filters live in URL search params. The cart is a client-side React context persisted to `localStorage`. Checkout posts one grouped order to `POST /sale/order/public`. A scoped "Warm Trust" Tailwind theme (new `sf-*` color tokens) isolates the storefront from the dark admin theme.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, Tailwind v4 (`@theme inline` in `globals.css`), lucide-react, TypeScript 5. No test runner exists in this project — verification is `npm run build` (typecheck) + `npm run lint` + dev-server visual checks.

## Global Constraints

- All commands run from inside `/Users/user/Developer/Kuzco/kuzco-gui`.
- Path alias: `@/*` → `./src/*`.
- **Depends on the server plan** `2026-06-22-public-customer-order.md` — `POST /sale/order/public` must exist (locally or deployed) before Task 8 can be exercised end-to-end.
- **Mobile-first:** build and verify at 375px width first, then enhance with `sm:`/`md:`/`lg:` breakpoints. Tap targets ≥ 44px.
- **Ukrainian only** — all visible copy in Ukrainian. No i18n library.
- Reuse domain types from `@/shared/domain/*`. Reuse `API_URL` from `@/shared/config`.
- Do **not** use the admin axios client (`@/shared/api/client`) in storefront server components — it is browser/localStorage bound. Use the new `fetch` layer.
- Verification gate for every task: `npm run lint` and `npm run build` must pass.
- Warm Trust palette (verbatim hex): paper `#fbf8f3`, panel `#efe7da`, hairline `#e7ddcb`, ink `#1f3d2b`, ink-soft `#6b5d49`, primary `#2f6f4e`, accent `#c9892f`, danger `#b04a3a`.

---

### Task 1: Scoped "Warm Trust" theme tokens

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: Tailwind color utilities `bg-sf-paper`, `bg-sf-panel`, `border-sf-hairline`, `text-sf-ink`, `text-sf-ink-soft`, `bg-sf-primary`/`text-sf-primary`, `bg-sf-accent`/`text-sf-accent`, `text-sf-danger`. Used by all later storefront tasks.

- [ ] **Step 1: Declare the tokens**

In `src/app/globals.css`, add to the `:root` block (after the Graphite Console accents):

```css
  /* ── Storefront "Warm Trust" identity ────────────────────────────── */
  --sf-paper: #fbf8f3;
  --sf-panel: #efe7da;
  --sf-hairline: #e7ddcb;
  --sf-ink: #1f3d2b;
  --sf-ink-soft: #6b5d49;
  --sf-primary: #2f6f4e;
  --sf-accent: #c9892f;
  --sf-danger: #b04a3a;
```

Then inside the `@theme inline { ... }` block, expose them as utilities:

```css
  --color-sf-paper: var(--sf-paper);
  --color-sf-panel: var(--sf-panel);
  --color-sf-hairline: var(--sf-hairline);
  --color-sf-ink: var(--sf-ink);
  --color-sf-ink-soft: var(--sf-ink-soft);
  --color-sf-primary: var(--sf-primary);
  --color-sf-accent: var(--sf-accent);
  --color-sf-danger: var(--sf-danger);
```

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: success. (The utilities are emitted lazily; Task 3 will exercise them visually.)

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(storefront): add Warm Trust sf-* theme tokens"
```

---

### Task 2: Public API layer + view-model mappers

**Files:**
- Create: `src/app/(storefront)/lib/catalog-api.ts`
- Create: `src/app/(storefront)/lib/types.ts`
- Create: `src/app/(storefront)/lib/mappers.ts`
- Create: `src/app/(storefront)/lib/format.ts`

**Interfaces:**
- Produces:
  - `type PublicListFilter = { title?: string; priceFrom?: number; priceTo?: number; ramList?: number[]; ssdList?: number[]; screenSizeList?: number[]; resolutionList?: string[]; panelType?: string[]; pageIndex?: number; pageSize?: number }`
  - `listPublicGroups(filter: PublicListFilter): Promise<{ itemList: LaptopGroup[]; pageInfo: { pageIndex: number; pageSize: number; totalCount: number } }>`
  - `getPublicGroup(id: string): Promise<LaptopGroup>`
  - `listGroupImages(groupId: string): Promise<Image[]>`
  - `createPublicOrder(payload: CreateOrderPayload): Promise<{ orderRef: string }>` (client-callable)
  - `type CreateOrderPayload = { pib: string; phone: string; contactChannel: "phone" | "telegram"; deliveryCity: string; deliveryBranch: string; note?: string; items: { groupId: string; variantIdentifier: string }[] }`
  - `type ProductCardVM = { id: string; title: string; specLine: string; imageUrl?: string; priceFrom?: number; inStock: boolean; condition?: string }`
  - `type VariantVM = { identifier: string; ram?: number; ssd?: number; touch?: boolean; battery?: string; condition?: string; price?: number; stock: number; inStock: boolean }`
  - `toProductCardVM(group: LaptopGroup): ProductCardVM`
  - `variantVMs(group: LaptopGroup): VariantVM[]`
  - `priceRangeOf(group: LaptopGroup): { from?: number; to?: number }`
  - `formatUah(value?: number): string` (e.g. `₴18 999`)

- [ ] **Step 1: Write `format.ts`**

```typescript
export function formatUah(value?: number): string {
  if (value == null) return "—";
  return `₴${Math.round(value).toLocaleString("uk-UA").replace(/,/g, " ")}`;
}
```

- [ ] **Step 2: Write `types.ts`**

```typescript
export type PublicListFilter = {
  title?: string;
  priceFrom?: number;
  priceTo?: number;
  ramList?: number[];
  ssdList?: number[];
  screenSizeList?: number[];
  resolutionList?: string[];
  panelType?: string[];
  pageIndex?: number;
  pageSize?: number;
};

export type CreateOrderPayload = {
  pib: string;
  phone: string;
  contactChannel: "phone" | "telegram";
  deliveryCity: string;
  deliveryBranch: string;
  note?: string;
  items: { groupId: string; variantIdentifier: string }[];
};

export type ProductCardVM = {
  id: string;
  title: string;
  specLine: string;
  imageUrl?: string;
  priceFrom?: number;
  inStock: boolean;
  condition?: string;
};

export type VariantVM = {
  identifier: string;
  ram?: number;
  ssd?: number;
  touch?: boolean;
  battery?: string;
  condition?: string;
  price?: number;
  stock: number;
  inStock: boolean;
};
```

- [ ] **Step 3: Write `catalog-api.ts`**

```typescript
import { API_URL } from "@/shared/config";
import type { LaptopGroup } from "@/shared/domain/laptop-group";
import type { Image } from "@/shared/domain/image";
import type { CreateOrderPayload, PublicListFilter } from "./types";

const json = { "Content-Type": "application/json" };

/** Server-rendered browse list. Revalidates every 60s. */
export async function listPublicGroups(
  filter: PublicListFilter,
): Promise<{
  itemList: LaptopGroup[];
  pageInfo: { pageIndex: number; pageSize: number; totalCount: number };
}> {
  const res = await fetch(`${API_URL}/laptopGroup/list/public`, {
    method: "POST",
    headers: json,
    body: JSON.stringify(filter),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`listPublicGroups failed: ${res.status}`);
  const data = await res.json();
  return {
    itemList: data.itemList ?? [],
    pageInfo: data.pageInfo ?? {
      pageIndex: 0,
      pageSize: filter.pageSize ?? 24,
      totalCount: (data.itemList ?? []).length,
    },
  };
}

export async function getPublicGroup(id: string): Promise<LaptopGroup> {
  const res = await fetch(`${API_URL}/laptopGroup/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`getPublicGroup failed: ${res.status}`);
  return res.json();
}

export async function listGroupImages(groupId: string): Promise<Image[]> {
  const res = await fetch(`${API_URL}/image/list`, {
    method: "POST",
    headers: json,
    body: JSON.stringify({ groupId }),
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

/** Called from the client checkout form (no caching). */
export async function createPublicOrder(
  payload: CreateOrderPayload,
): Promise<{ orderRef: string }> {
  const res = await fetch(`${API_URL}/sale/order/public`, {
    method: "POST",
    headers: json,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createPublicOrder failed: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 4: Write `mappers.ts`**

```typescript
import type { LaptopGroup, LaptopVariant } from "@/shared/domain/laptop-group";
import { LAPTOP_CONDITION_LABELS } from "@/shared/domain/laptop";
import type { ProductCardVM, VariantVM } from "./types";

function specLineOf(g: LaptopGroup): string {
  return [g.processor, g.videocard, g.screenSize ? `${g.screenSize}"` : null]
    .filter(Boolean)
    .join(" · ");
}

export function priceRangeOf(g: LaptopGroup): { from?: number; to?: number } {
  const prices = (g.variants ?? [])
    .map((v) => v.price)
    .filter((p): p is number => typeof p === "number");
  if (prices.length === 0) return {};
  return { from: Math.min(...prices), to: Math.max(...prices) };
}

const stockOf = (v: LaptopVariant): number => v.itemList?.length ?? 0;

export function variantVMs(g: LaptopGroup): VariantVM[] {
  return (g.variants ?? []).map((v) => ({
    identifier: v.identifier ?? "",
    ram: v.ram,
    ssd: v.ssd,
    touch: v.touch,
    battery: v.battery,
    condition: v.condition,
    price: v.price,
    stock: stockOf(v),
    inStock: stockOf(v) > 0,
  }));
}

export function toProductCardVM(g: LaptopGroup): ProductCardVM {
  const variants = variantVMs(g);
  const range = priceRangeOf(g);
  const topCondition = variants.find((v) => v.condition)?.condition;
  return {
    id: g._id,
    title: g.title ?? g.groupName ?? "Ноутбук",
    specLine: specLineOf(g),
    imageUrl: g.imageUrl,
    priceFrom: range.from,
    inStock: variants.some((v) => v.inStock),
    condition: topCondition
      ? (LAPTOP_CONDITION_LABELS[topCondition as never] ?? topCondition)
      : undefined,
  };
}
```

- [ ] **Step 5: Reconcile imports against live types**

Run: `grep -n "LAPTOP_CONDITION_LABELS\|LaptopCondition\|CONDITION" src/shared/domain/laptop.ts`
If `LAPTOP_CONDITION_LABELS` does not exist with that exact name, update the import + usage in `mappers.ts` to the actual exported label map (or drop the label mapping and use the raw `condition` string). Adjust until `npm run build` passes.

- [ ] **Step 6: Verify**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(storefront)/lib"
git commit -m "feat(storefront): public api layer, types, mappers, formatter"
```

---

### Task 3: Cart context (client, localStorage)

**Files:**
- Create: `src/app/(storefront)/lib/cart.tsx`

**Interfaces:**
- Produces:
  - `type CartLine = { groupId: string; variantIdentifier: string; title: string; specSummary: string; condition?: string; battery?: string; price?: number; imageUrl?: string; addedAt: number }`
  - `CartProvider({ children }): JSX.Element`
  - `useCart(): { lines: CartLine[]; count: number; total: number; add(line: Omit<CartLine,"addedAt">): void; remove(groupId: string, variantIdentifier: string): void; clear(): void; has(groupId: string, variantIdentifier: string): boolean }`

- [ ] **Step 1: Write the provider**

```typescript
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "kuzco_cart_v1";

export type CartLine = {
  groupId: string;
  variantIdentifier: string;
  title: string;
  specSummary: string;
  condition?: string;
  battery?: string;
  price?: number;
  imageUrl?: string;
  addedAt: number;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (line: Omit<CartLine, "addedAt">) => void;
  remove: (groupId: string, variantIdentifier: string) => void;
  clear: () => void;
  has: (groupId: string, variantIdentifier: string) => boolean;
};

const Ctx = createContext<CartCtx | null>(null);
const key = (g: string, v: string) => `${g}::${v}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((line: Omit<CartLine, "addedAt">) => {
    setLines((prev) =>
      prev.some(
        (l) => key(l.groupId, l.variantIdentifier) === key(line.groupId, line.variantIdentifier),
      )
        ? prev
        : [...prev, { ...line, addedAt: Date.now() }],
    );
  }, []);

  const remove = useCallback((g: string, v: string) => {
    setLines((prev) => prev.filter((l) => key(l.groupId, l.variantIdentifier) !== key(g, v)));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const has = useCallback(
    (g: string, v: string) => lines.some((l) => key(l.groupId, l.variantIdentifier) === key(g, v)),
    [lines],
  );

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count: lines.length,
      total: lines.reduce((sum, l) => sum + (l.price ?? 0), 0),
      add,
      remove,
      clear,
      has,
    }),
    [lines, add, remove, clear, has],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify**

Run: `npm run build && npm run lint`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(storefront)/lib/cart.tsx"
git commit -m "feat(storefront): client cart context with localStorage"
```

---

### Task 4: Storefront layout shell (header, footer, cart drawer)

**Files:**
- Create: `src/app/(storefront)/layout.tsx`
- Create: `src/app/(storefront)/_components/Header.tsx`
- Create: `src/app/(storefront)/_components/Footer.tsx`
- Create: `src/app/(storefront)/_components/CartDrawer.tsx`
- Create: `src/app/(storefront)/_components/CartButton.tsx`

**Interfaces:**
- Consumes: `CartProvider`, `useCart` (Task 3); `formatUah` (Task 2).
- Produces: a public layout wrapping all storefront routes with Warm Trust theme, sticky header (logo, nav links Каталог/Доставка/Гарантія/Контакти, cart button), slide-over cart drawer, footer.

- [ ] **Step 1: Layout**

`src/app/(storefront)/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { CartProvider } from "./lib/cart";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col bg-sf-paper text-sf-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
```

- [ ] **Step 2: CartButton (opens drawer)**

`src/app/(storefront)/_components/CartButton.tsx`:

```tsx
"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "../lib/cart";

export function CartButton({ onOpen }: { onOpen: () => void }) {
  const { count } = useCart();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Кошик"
      className="relative inline-flex size-11 items-center justify-center rounded-full bg-sf-accent text-sf-ink"
    >
      <ShoppingBag className="size-5" strokeWidth={2} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-sf-primary px-1 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 3: CartDrawer**

`src/app/(storefront)/_components/CartDrawer.tsx`:

```tsx
"use client";

import Link from "next/link";
import { X, Trash2 } from "lucide-react";
import { useCart } from "../lib/cart";
import { formatUah } from "../lib/format";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, total, remove } = useCart();
  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-sf-ink/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-sf-paper shadow-xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <header className="flex items-center justify-between border-b border-sf-hairline p-4">
          <h2 className="font-display text-lg font-bold">Кошик</h2>
          <button type="button" onClick={onClose} aria-label="Закрити" className="size-11">
            <X className="mx-auto size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {lines.length === 0 ? (
            <p className="text-sm text-sf-ink-soft">Кошик порожній.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map((l) => (
                <li
                  key={`${l.groupId}-${l.variantIdentifier}`}
                  className="flex gap-3 rounded-xl border border-sf-hairline bg-white p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.title}</p>
                    <p className="text-xs text-sf-ink-soft">{l.specSummary}</p>
                    <p className="mt-1 font-semibold">{formatUah(l.price)}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Видалити"
                    onClick={() => remove(l.groupId, l.variantIdentifier)}
                    className="size-9 text-sf-danger"
                  >
                    <Trash2 className="mx-auto size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="border-t border-sf-hairline p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sf-ink-soft">Разом</span>
            <span className="font-display text-xl font-extrabold">{formatUah(total)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={onClose}
            aria-disabled={lines.length === 0}
            className={`block rounded-xl py-3 text-center font-bold text-white ${lines.length === 0 ? "pointer-events-none bg-sf-ink-soft/40" : "bg-sf-primary"}`}
          >
            Оформити замовлення
          </Link>
        </footer>
      </aside>
    </div>
  );
}
```

- [ ] **Step 4: Header (with mobile nav + drawer state)**

`src/app/(storefront)/_components/Header.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { CartButton } from "./CartButton";
import { CartDrawer } from "./CartDrawer";

const NAV = [
  { href: "/", label: "Каталог" },
  { href: "/delivery", label: "Доставка" },
  { href: "/warranty", label: "Гарантія" },
  { href: "/contact", label: "Контакти" },
];

export function Header() {
  const [cartOpen, setCartOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sf-hairline bg-sf-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <button
          type="button"
          className="size-11 md:hidden"
          aria-label="Меню"
          onClick={() => setNavOpen((v) => !v)}
        >
          {navOpen ? <X className="mx-auto size-6" /> : <Menu className="mx-auto size-6" />}
        </button>
        <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
          KUZCO
        </Link>
        <nav className="hidden gap-6 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-medium hover:text-sf-primary">
              {n.label}
            </Link>
          ))}
        </nav>
        <CartButton onOpen={() => setCartOpen(true)} />
      </div>
      {navOpen && (
        <nav className="flex flex-col gap-1 border-t border-sf-hairline px-4 py-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setNavOpen(false)}
              className="rounded-lg px-2 py-3 text-base font-medium"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
```

- [ ] **Step 5: Footer**

`src/app/(storefront)/_components/Footer.tsx`:

```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-sf-hairline bg-sf-panel">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-sf-ink-soft sm:flex-row sm:justify-between">
        <div>
          <p className="font-display text-lg font-extrabold text-sf-ink">KUZCO</p>
          <p>Перевірені вживані ноутбуки з гарантією.</p>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/about">Про нас</Link>
          <Link href="/delivery">Доставка</Link>
          <Link href="/warranty">Гарантія та обмін</Link>
          <Link href="/contact">Контакти</Link>
        </nav>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Replace the stub home page temporarily**

Replace `src/app/(storefront)/page.tsx` with a minimal placeholder so the layout renders (the real browse page lands in Task 5):

```tsx
export default function Home() {
  return <div className="mx-auto max-w-6xl p-8">Каталог — незабаром.</div>;
}
```

- [ ] **Step 7: Verify visually**

Run: `npm run build && npm run lint`, then `npm run dev` and open `http://localhost:3000/` at 375px width. Confirm: header with logo + cart, hamburger toggles mobile nav, cart button opens an empty drawer, footer renders. Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(storefront)"
git commit -m "feat(storefront): layout shell — header, footer, cart drawer"
```

---

### Task 5: Browse home (`/`) — server-rendered grid + URL filters

**Files:**
- Modify: `src/app/(storefront)/page.tsx`
- Create: `src/app/(storefront)/_components/ProductCard.tsx`
- Create: `src/app/(storefront)/_components/ProductGrid.tsx`
- Create: `src/app/(storefront)/_components/FilterPanel.tsx`
- Create: `src/app/(storefront)/_components/Pagination.tsx`
- Create: `src/app/(storefront)/_components/Hero.tsx`
- Create: `src/app/(storefront)/lib/search-params.ts`

**Interfaces:**
- Consumes: `listPublicGroups` (Task 2), `toProductCardVM` (Task 2).
- Produces: `parseFilter(searchParams: Record<string,string|string[]|undefined>): PublicListFilter`; a server-component browse page reading `searchParams`, rendering Hero + trust band + FilterPanel + ProductGrid + Pagination.

- [ ] **Step 1: `search-params.ts`**

```typescript
import type { PublicListFilter } from "./types";

const nums = (v?: string | string[]) =>
  (Array.isArray(v) ? v : v ? [v] : [])
    .flatMap((s) => s.split(","))
    .map(Number)
    .filter((n) => !Number.isNaN(n));

const strs = (v?: string | string[]) =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((s) => s.split(",")).filter(Boolean);

const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

export const PAGE_SIZE = 24;

export function parseFilter(
  sp: Record<string, string | string[] | undefined>,
): PublicListFilter {
  const priceFrom = Number(one(sp.priceFrom));
  const priceTo = Number(one(sp.priceTo));
  const pageIndex = Number(one(sp.page)) ? Number(one(sp.page)) - 1 : 0;
  return {
    title: one(sp.q) || undefined,
    priceFrom: Number.isNaN(priceFrom) || !one(sp.priceFrom) ? undefined : priceFrom,
    priceTo: Number.isNaN(priceTo) || !one(sp.priceTo) ? undefined : priceTo,
    ramList: nums(sp.ram),
    ssdList: nums(sp.ssd),
    screenSizeList: nums(sp.screen),
    resolutionList: strs(sp.resolution),
    panelType: strs(sp.panel),
    pageIndex,
    pageSize: PAGE_SIZE,
  };
}
```

- [ ] **Step 2: `ProductCard.tsx`**

```tsx
import Link from "next/link";
import type { ProductCardVM } from "../lib/types";
import { formatUah } from "../lib/format";

export function ProductCard({ vm }: { vm: ProductCardVM }) {
  return (
    <Link
      href={`/laptop/${vm.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-sf-hairline bg-white"
    >
      <div className="relative aspect-[4/3] bg-sf-panel">
        {vm.condition && (
          <span className="absolute left-2 top-2 rounded-full bg-sf-primary px-2 py-0.5 text-xs font-semibold text-white">
            Стан {vm.condition}
          </span>
        )}
        {vm.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vm.imageUrl}
            alt={vm.title}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="font-medium leading-tight">{vm.title}</p>
        <p className="mt-0.5 text-xs text-sf-ink-soft">{vm.specLine}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-display text-lg font-extrabold">
            {vm.priceFrom != null ? `від ${formatUah(vm.priceFrom)}` : "—"}
          </span>
          <span className={vm.inStock ? "text-xs text-sf-primary" : "text-xs text-sf-danger"}>
            {vm.inStock ? "в наявності" : "немає"}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: `ProductGrid.tsx`**

```tsx
import type { ProductCardVM } from "../lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ items }: { items: ProductCardVM[] }) {
  if (items.length === 0) {
    return <p className="py-16 text-center text-sf-ink-soft">Нічого не знайдено.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((vm) => (
        <ProductCard key={vm.id} vm={vm} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: `FilterPanel.tsx` (client; desktop sidebar + mobile bottom-sheet)**

`FilterPanel` is a client component that reads the current URL via `useSearchParams`, renders checkbox groups for RAM/SSD/screen/resolution/panel + price inputs + search box, and on "Застосувати" pushes a new URL with `useRouter().push`. It exposes a "Фільтри" trigger button visible below `md`, opening a bottom-sheet; on `md+` it renders inline as a sidebar. Full implementation:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

const RAM = [8, 16, 32];
const SSD = [256, 512, 1024];
const SCREEN = [13, 14, 15, 16];
const RESOLUTION = [
  { v: "fhd", l: "Full HD" },
  { v: "qhd", l: "QHD" },
  { v: "uhd", l: "4K" },
];
const PANEL = [
  { v: "ips", l: "IPS" },
  { v: "oled", l: "OLED" },
  { v: "tn", l: "TN" },
];

function CheckGroup({
  label,
  name,
  options,
  selected,
  onToggle,
}: {
  label: string;
  name: string;
  options: { v: string; l: string }[];
  selected: Set<string>;
  onToggle: (name: string, v: string) => void;
}) {
  return (
    <fieldset className="border-b border-sf-hairline py-3">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-sf-ink-soft">
        {label}
      </legend>
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <label key={o.v} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.has(o.v)}
              onChange={() => onToggle(name, o.v)}
              className="size-4 accent-sf-primary"
            />
            {o.l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FilterPanel() {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const setFor = (name: string) => new Set((sp.get(name)?.split(",") ?? []).filter(Boolean));
  const [state, setState] = useState({
    ram: setFor("ram"),
    ssd: setFor("ssd"),
    screen: setFor("screen"),
    resolution: setFor("resolution"),
    panel: setFor("panel"),
    priceFrom: sp.get("priceFrom") ?? "",
    priceTo: sp.get("priceTo") ?? "",
  });

  const toggle = (name: string, v: string) =>
    setState((s) => {
      const next = new Set(s[name as "ram"]);
      next.has(v) ? next.delete(v) : next.add(v);
      return { ...s, [name]: next };
    });

  const apply = () => {
    const params = new URLSearchParams();
    if (sp.get("q")) params.set("q", sp.get("q")!);
    (["ram", "ssd", "screen", "resolution", "panel"] as const).forEach((k) => {
      const set = state[k];
      if (set.size) params.set(k, [...set].join(","));
    });
    if (state.priceFrom) params.set("priceFrom", state.priceFrom);
    if (state.priceTo) params.set("priceTo", state.priceTo);
    router.push(`/?${params.toString()}`);
    setOpen(false);
  };

  const body = (
    <div className="flex flex-col">
      <div className="border-b border-sf-hairline py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sf-ink-soft">Ціна</p>
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            placeholder="від"
            value={state.priceFrom}
            onChange={(e) => setState((s) => ({ ...s, priceFrom: e.target.value }))}
            className="w-full rounded-lg border border-sf-hairline bg-white px-3 py-2 text-sm"
          />
          <input
            inputMode="numeric"
            placeholder="до"
            value={state.priceTo}
            onChange={(e) => setState((s) => ({ ...s, priceTo: e.target.value }))}
            className="w-full rounded-lg border border-sf-hairline bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>
      <CheckGroup label="Оперативна памʼять" name="ram" selected={state.ram} onToggle={toggle}
        options={RAM.map((r) => ({ v: String(r), l: `${r} GB` }))} />
      <CheckGroup label="Накопичувач" name="ssd" selected={state.ssd} onToggle={toggle}
        options={SSD.map((s) => ({ v: String(s), l: s >= 1024 ? `${s / 1024} TB` : `${s} GB` }))} />
      <CheckGroup label="Екран" name="screen" selected={state.screen} onToggle={toggle}
        options={SCREEN.map((s) => ({ v: String(s), l: `${s}"` }))} />
      <CheckGroup label="Роздільна здатність" name="resolution" selected={state.resolution} onToggle={toggle} options={RESOLUTION} />
      <CheckGroup label="Матриця" name="panel" selected={state.panel} onToggle={toggle} options={PANEL} />
      <button type="button" onClick={apply} className="mt-4 rounded-xl bg-sf-primary py-3 font-bold text-white">
        Застосувати
      </button>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-sf-hairline bg-white px-4 py-2 text-sm font-medium md:hidden"
      >
        <SlidersHorizontal className="size-4" /> Фільтри
      </button>
      <aside className="hidden w-60 shrink-0 md:block">{body}</aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-sf-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-sf-paper p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Фільтри</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрити" className="size-9">
                <X className="mx-auto size-5" />
              </button>
            </div>
            {body}
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 5: `Pagination.tsx` (client)**

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function Pagination({ pageIndex, pageSize, totalCount }: { pageIndex: number; pageSize: number; totalCount: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  const go = (page: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(page));
    router.push(`/?${params.toString()}`);
  };
  const current = pageIndex + 1;

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button type="button" disabled={current <= 1} onClick={() => go(current - 1)}
        className="rounded-lg border border-sf-hairline bg-white px-4 py-2 text-sm disabled:opacity-40">
        Назад
      </button>
      <span className="text-sm text-sf-ink-soft">{current} / {totalPages}</span>
      <button type="button" disabled={current >= totalPages} onClick={() => go(current + 1)}
        className="rounded-lg border border-sf-hairline bg-white px-4 py-2 text-sm disabled:opacity-40">
        Далі
      </button>
    </div>
  );
}
```

- [ ] **Step 6: `Hero.tsx` (slim hero + trust band)**

```tsx
import { ShieldCheck, Wrench, RefreshCw } from "lucide-react";

export function Hero() {
  return (
    <section className="bg-sf-panel">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
          Ноутбуки з гарантією — обери свій
        </h1>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { Icon: ShieldCheck, t: "Гарантія до 6 місяців" },
            { Icon: Wrench, t: "Повна діагностика" },
            { Icon: RefreshCw, t: "Обмін 14 днів" },
          ].map(({ Icon, t }) => (
            <div key={t} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm">
              <Icon className="size-4 text-sf-primary" /> {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Browse page**

`src/app/(storefront)/page.tsx`:

```tsx
import { listPublicGroups } from "./lib/catalog-api";
import { toProductCardVM } from "./lib/mappers";
import { parseFilter } from "./lib/search-params";
import { Hero } from "./_components/Hero";
import { FilterPanel } from "./_components/FilterPanel";
import { ProductGrid } from "./_components/ProductGrid";
import { Pagination } from "./_components/Pagination";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter = parseFilter(sp);
  const { itemList, pageInfo } = await listPublicGroups(filter);
  const cards = itemList.map(toProductCardVM);

  return (
    <>
      <Hero />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">
            Каталог · {pageInfo.totalCount} ноутбуків
          </h2>
          <FilterPanel />
        </div>
        <div className="flex gap-6">
          <div className="hidden md:block">
            <FilterPanel />
          </div>
          <div className="flex-1">
            <ProductGrid items={cards} />
            <Pagination
              pageIndex={pageInfo.pageIndex}
              pageSize={pageInfo.pageSize}
              totalCount={pageInfo.totalCount}
            />
          </div>
        </div>
      </div>
    </>
  );
}
```

Note: `FilterPanel` renders its own responsive trigger/sidebar, so the duplicate above is intentional only if you prefer to keep the mobile trigger in the header row and the sidebar in the row below — if it double-renders the sidebar, remove the inner `<div className="hidden md:block">` wrapper and rely on `FilterPanel`'s internal `md:` switching. Decide during Step 8 by visual check; keep exactly one sidebar visible at `md+`.

- [ ] **Step 8: Verify visually**

Run: `npm run build && npm run lint`, then `npm run dev`. At 375px: hero, trust band, "Фільтри" button opens bottom-sheet, grid is 1 column. At ≥1024px: sidebar visible once, grid 3–4 columns, pagination works, applying a filter updates the URL and results. Fix the sidebar duplication per Step 7 note if needed. Stop dev server.

- [ ] **Step 9: Commit**

```bash
git add "src/app/(storefront)"
git commit -m "feat(storefront): browse home with URL filters, grid, pagination"
```

---

### Task 6: Product detail (`/laptop/[id]`) + metadata

**Files:**
- Create: `src/app/(storefront)/laptop/[id]/page.tsx`
- Create: `src/app/(storefront)/_components/Gallery.tsx`
- Create: `src/app/(storefront)/_components/VariantSelector.tsx`
- Create: `src/app/(storefront)/_components/SpecTable.tsx`
- Create: `src/app/(storefront)/_components/BadgeRow.tsx`

**Interfaces:**
- Consumes: `getPublicGroup`, `listGroupImages`, `variantVMs`, `formatUah`, `useCart`.
- Produces: server page with `generateMetadata`; client `VariantSelector` that owns selected-variant state, price display, add-to-cart + buy-now.

- [ ] **Step 1: `Gallery.tsx` (client)**

```tsx
"use client";

import { useState } from "react";
import type { Image } from "@/shared/domain/image";

export function Gallery({ images, alt }: { images: Image[]; alt: string }) {
  const [active, setActive] = useState(0);
  const main = images[active]?.s3Url;
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-sf-panel">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={main} alt={alt} className="size-full object-cover" />
        ) : null}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? "border-sf-primary" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.s3Url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `BadgeRow.tsx`**

```tsx
export function BadgeRow({ items }: { items: { label: string; tone?: "primary" | "muted" }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((b) => (
        <span
          key={b.label}
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.tone === "primary" ? "bg-sf-primary text-white" : "bg-sf-panel text-sf-ink"}`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `SpecTable.tsx`**

```tsx
export function SpecTable({ rows }: { rows: { label: string; value?: string | number | boolean }[] }) {
  const fmt = (v: string | number | boolean | undefined) =>
    v == null || v === "" ? "—" : typeof v === "boolean" ? (v ? "Так" : "Ні") : String(v);
  return (
    <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between border-b border-dashed border-sf-hairline py-2 text-sm">
          <dt className="text-sf-ink-soft">{r.label}</dt>
          <dd className="font-medium">{fmt(r.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 4: `VariantSelector.tsx` (client; owns selection + cart actions)**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VariantVM } from "../lib/types";
import { useCart } from "../lib/cart";
import { formatUah } from "../lib/format";

const specSummary = (v: VariantVM) =>
  [v.ram ? `${v.ram}GB` : null, v.ssd ? `${v.ssd >= 1024 ? v.ssd / 1024 + "TB" : v.ssd + "GB"} SSD` : null, v.condition ? `Стан ${v.condition}` : null]
    .filter(Boolean)
    .join(" · ");

export function VariantSelector({
  groupId,
  title,
  imageUrl,
  variants,
}: {
  groupId: string;
  title: string;
  imageUrl?: string;
  variants: VariantVM[];
}) {
  const router = useRouter();
  const { add, has } = useCart();
  const firstInStock = variants.findIndex((v) => v.inStock);
  const [selected, setSelected] = useState(firstInStock >= 0 ? firstInStock : 0);
  const v = variants[selected];

  const addToCart = () => {
    if (!v) return;
    add({
      groupId,
      variantIdentifier: v.identifier,
      title,
      specSummary: specSummary(v),
      condition: v.condition,
      battery: v.battery,
      price: v.price,
      imageUrl,
    });
  };
  const buyNow = () => {
    addToCart();
    router.push("/checkout");
  };
  const inCart = v ? has(groupId, v.identifier) : false;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sf-ink-soft">Конфігурація</p>
      <div className="flex flex-col gap-2">
        {variants.map((variant, i) => (
          <button
            key={variant.identifier || i}
            type="button"
            disabled={!variant.inStock}
            onClick={() => setSelected(i)}
            className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm ${i === selected ? "border-2 border-sf-primary bg-sf-primary/5" : "border-sf-hairline bg-white"} ${!variant.inStock ? "opacity-50" : ""}`}
          >
            <span>{specSummary(variant)}</span>
            <span className="flex items-center gap-2">
              <span className="font-bold">{formatUah(variant.price)}</span>
              <span className={variant.inStock ? "text-xs text-sf-primary" : "text-xs text-sf-danger"}>
                {variant.inStock ? "є" : "немає"}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Desktop buy row */}
      <div className="mt-5 hidden items-center gap-3 sm:flex">
        <span className="font-display text-2xl font-extrabold">{formatUah(v?.price)}</span>
        <button type="button" onClick={addToCart} disabled={!v?.inStock}
          className="flex-1 rounded-xl bg-sf-primary py-3 font-bold text-white disabled:opacity-40">
          {inCart ? "У кошику ✓" : "Додати в кошик"}
        </button>
        <button type="button" onClick={buyNow} disabled={!v?.inStock}
          className="rounded-xl bg-sf-accent px-5 py-3 font-bold text-sf-ink disabled:opacity-40">
          Купити зараз
        </button>
      </div>

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-sf-hairline bg-sf-paper p-3 sm:hidden">
        <span className="font-display text-xl font-extrabold">{formatUah(v?.price)}</span>
        <button type="button" onClick={addToCart} disabled={!v?.inStock}
          className="flex-1 rounded-xl bg-sf-primary py-3 font-bold text-white disabled:opacity-40">
          {inCart ? "У кошику ✓" : "В кошик"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Detail page + metadata**

`src/app/(storefront)/laptop/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicGroup, listGroupImages } from "../../lib/catalog-api";
import { variantVMs, priceRangeOf } from "../../lib/mappers";
import { formatUah } from "../../lib/format";
import { Gallery } from "../../_components/Gallery";
import { VariantSelector } from "../../_components/VariantSelector";
import { SpecTable } from "../../_components/SpecTable";
import { BadgeRow } from "../../_components/BadgeRow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const g = await getPublicGroup(id);
    const title = g.title ?? g.groupName ?? "Ноутбук";
    return {
      title: `${title} — KUZCO`,
      description: [g.processor, g.videocard, g.screenSize ? `${g.screenSize}"` : null]
        .filter(Boolean)
        .join(", "),
      openGraph: { images: g.imageUrl ? [g.imageUrl] : [] },
    };
  } catch {
    return { title: "Ноутбук — KUZCO" };
  }
}

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let group;
  try {
    group = await getPublicGroup(id);
  } catch {
    notFound();
  }
  // Client guard: only published groups are public.
  if (!group || group.state !== "published") notFound();

  const images = await listGroupImages(id);
  const variants = variantVMs(group);
  const range = priceRangeOf(group);
  const title = group.title ?? group.groupName ?? "Ноутбук";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:pb-6">
      <nav className="mb-3 text-xs text-sf-ink-soft">Каталог › {title}</nav>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Gallery images={images} alt={title} />
        <div>
          <h1 className="font-display text-2xl font-extrabold">{title}</h1>
          <p className="mt-1 text-sm text-sf-ink-soft">
            {[group.processor, group.videocard, group.screenSize ? `${group.screenSize}" ${group.panelType?.toUpperCase() ?? ""}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="my-4">
            <BadgeRow
              items={[
                ...(variants[0]?.condition ? [{ label: `Стан ${variants[0].condition}`, tone: "primary" as const }] : []),
                { label: "Гарантія 3 міс" },
                ...(range.from != null ? [{ label: `від ${formatUah(range.from)}` }] : []),
              ]}
            />
          </div>
          <VariantSelector groupId={group._id} title={title} imageUrl={group.imageUrl} variants={variants} />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold">Характеристики</h2>
        <SpecTable
          rows={[
            { label: "Процесор", value: group.processor },
            { label: "Відеокарта", value: group.videocard },
            { label: "Дискретна графіка", value: group.discrete },
            { label: "Екран", value: group.screenSize ? `${group.screenSize}"` : undefined },
            { label: "Роздільна здатність", value: group.resolution?.toUpperCase() },
            { label: "Матриця", value: group.panelType?.toUpperCase() },
            { label: "Частота", value: group.refreshRate ? `${group.refreshRate} Hz` : undefined },
            { label: "Трансформер", value: group.isTransformer },
          ]}
        />
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Reconcile field names**

Run: `grep -n "state\|resolution\|panelType\|refreshRate\|isTransformer\|discrete" src/shared/domain/laptop-group.ts`
Confirm the `LaptopGroup` field names used above match exactly. Adjust any mismatch until `npm run build` passes. Confirm the published-state literal is `"published"` per `LAPTOP_GROUP_STATES`.

- [ ] **Step 7: Verify visually**

Run: `npm run build && npm run lint`, then `npm run dev`. Open a product. At 375px: gallery → info → specs stacked, sticky bottom buy bar present, selecting variants changes price, out-of-stock variants disabled. Add to cart → cart drawer count increments. "Купити зараз" routes to `/checkout`. Stop dev server.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(storefront)"
git commit -m "feat(storefront): product detail page, gallery, variant selector, metadata"
```

---

### Task 7: Cart page (`/cart`) with soft availability check

**Files:**
- Create: `src/app/(storefront)/cart/page.tsx`

**Interfaces:**
- Consumes: `useCart`, `getPublicGroup`, `variantVMs`, `formatUah`.
- Produces: a client page listing cart lines, per-line soft availability re-check (re-fetch each group, flag lines whose variant now has 0 stock), total, and a checkout CTA.

- [ ] **Step 1: Write the page**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useCart } from "../lib/cart";
import { getPublicGroup } from "../lib/catalog-api";
import { variantVMs } from "../lib/mappers";
import { formatUah } from "../lib/format";

export default function CartPage() {
  const { lines, total, remove } = useCart();
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      const flagged = new Set<string>();
      await Promise.all(
        lines.map(async (l) => {
          try {
            const g = await getPublicGroup(l.groupId);
            const v = variantVMs(g).find((x) => x.identifier === l.variantIdentifier);
            if (!v || !v.inStock || g.state !== "published") {
              flagged.add(`${l.groupId}::${l.variantIdentifier}`);
            }
          } catch {
            flagged.add(`${l.groupId}::${l.variantIdentifier}`);
          }
        }),
      );
      if (active) setUnavailable(flagged);
    })();
    return () => {
      active = false;
    };
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sf-ink-soft">Ваш кошик порожній.</p>
        <Link href="/" className="mt-4 inline-block rounded-xl bg-sf-primary px-6 py-3 font-bold text-white">
          До каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 font-display text-2xl font-extrabold">Кошик</h1>
      <ul className="flex flex-col gap-3">
        {lines.map((l) => {
          const out = unavailable.has(`${l.groupId}::${l.variantIdentifier}`);
          return (
            <li key={`${l.groupId}-${l.variantIdentifier}`} className="flex gap-3 rounded-2xl border border-sf-hairline bg-white p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/laptop/${l.groupId}`} className="font-medium hover:text-sf-primary">{l.title}</Link>
                <p className="text-sm text-sf-ink-soft">{l.specSummary}</p>
                {out && <p className="mt-1 text-sm font-medium text-sf-danger">Немає в наявності — видаліть позицію</p>}
                <p className="mt-1 font-semibold">{formatUah(l.price)}</p>
              </div>
              <button type="button" aria-label="Видалити" onClick={() => remove(l.groupId, l.variantIdentifier)} className="size-11 text-sf-danger">
                <Trash2 className="mx-auto size-5" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex items-center justify-between border-t border-sf-hairline pt-4">
        <span className="text-sf-ink-soft">Разом</span>
        <span className="font-display text-2xl font-extrabold">{formatUah(total)}</span>
      </div>
      <Link
        href="/checkout"
        aria-disabled={unavailable.size > 0}
        className={`mt-4 block rounded-xl py-3 text-center font-bold text-white ${unavailable.size > 0 ? "pointer-events-none bg-sf-ink-soft/40" : "bg-sf-primary"}`}
      >
        Оформити замовлення
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run build && npm run lint`, then `npm run dev`. Add items, open `/cart`, confirm list, total, remove, and that the checkout CTA disables when a line is flagged unavailable. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(storefront)/cart"
git commit -m "feat(storefront): cart page with soft availability check"
```

---

### Task 8: Checkout (`/checkout`) + success page

**Files:**
- Create: `src/app/(storefront)/checkout/page.tsx`
- Create: `src/app/(storefront)/checkout/success/page.tsx`

**Interfaces:**
- Consumes: `useCart`, `createPublicOrder`, `formatUah`.
- Produces: a client checkout form (pib, phone, contactChannel, deliveryCity, deliveryBranch, note) that submits one grouped order, clears the cart, and routes to `/checkout/success?ref=<orderRef>`.

- [ ] **Step 1: Checkout page**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "../lib/cart";
import { createPublicOrder } from "../lib/catalog-api";
import { formatUah } from "../lib/format";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, total, clear } = useCart();
  const [form, setForm] = useState({
    pib: "",
    phone: "",
    contactChannel: "phone" as "phone" | "telegram",
    deliveryCity: "",
    deliveryBranch: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [name]: e.target.value })),
  });

  const valid =
    form.pib.trim() && /^\+?\d{9,15}$/.test(form.phone.trim()) && form.deliveryCity.trim() && form.deliveryBranch.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const { orderRef } = await createPublicOrder({
        pib: form.pib.trim(),
        phone: form.phone.trim(),
        contactChannel: form.contactChannel,
        deliveryCity: form.deliveryCity.trim(),
        deliveryBranch: form.deliveryBranch.trim(),
        note: form.note.trim() || undefined,
        items: lines.map((l) => ({ groupId: l.groupId, variantIdentifier: l.variantIdentifier })),
      });
      clear();
      router.push(`/checkout/success?ref=${encodeURIComponent(orderRef)}`);
    } catch {
      setError("Не вдалося оформити замовлення. Спробуйте ще раз або зателефонуйте нам.");
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-sf-ink-soft">Кошик порожній.</div>;
  }

  const input = "w-full rounded-xl border border-sf-hairline bg-white px-3 py-3 text-base";
  const label = "mb-1 block text-sm font-medium";

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 font-display text-2xl font-extrabold">Оформлення</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className={label}>Імʼя та прізвище</label>
          <input className={input} required {...field("pib")} />
        </div>
        <div>
          <label className={label}>Телефон</label>
          <input className={input} required inputMode="tel" placeholder="+380…" {...field("phone")} />
        </div>
        <div>
          <label className={label}>Звʼязатися через</label>
          <select className={input} {...field("contactChannel")}>
            <option value="phone">Телефон</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>
        <div>
          <label className={label}>Місто</label>
          <input className={input} required {...field("deliveryCity")} />
        </div>
        <div>
          <label className={label}>Відділення Нової Пошти</label>
          <input className={input} required {...field("deliveryBranch")} />
        </div>
        <div>
          <label className={label}>Коментар (необовʼязково)</label>
          <textarea className={input} rows={3} {...field("note")} />
        </div>

        <div className="rounded-xl bg-sf-panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-sf-ink-soft">{lines.length} товар(и)</span>
            <span className="font-display text-xl font-extrabold">{formatUah(total)}</span>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-sf-danger">{error}</p>}

        <button type="submit" disabled={!valid || submitting} className="rounded-xl bg-sf-primary py-4 font-bold text-white disabled:opacity-40">
          {submitting ? "Надсилаємо…" : "Підтвердити замовлення"}
        </button>
        <p className="text-center text-xs text-sf-ink-soft">
          Оплата не онлайн — ми звʼяжемося з вами для підтвердження та доставки.
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Success page**

`src/app/(storefront)/checkout/success/page.tsx`:

```tsx
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto size-14 text-sf-primary" />
      <h1 className="mt-4 font-display text-2xl font-extrabold">Замовлення прийнято!</h1>
      <p className="mt-2 text-sf-ink-soft">
        Дякуємо. Ми звʼяжемося з вами найближчим часом для підтвердження та доставки.
      </p>
      {ref && <p className="mt-2 text-sm text-sf-ink-soft">Номер замовлення: <span className="font-mono">{ref}</span></p>}
      <Link href="/" className="mt-6 inline-block rounded-xl bg-sf-primary px-6 py-3 font-bold text-white">
        До каталогу
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Verify end-to-end**

Ensure the server endpoint from the server plan is reachable (set `NEXT_PUBLIC_API_URL=http://localhost:3000` and run `kuzco-server` locally, or point at a deploy that has it). Run `npm run build && npm run lint`, then `npm run dev`. Add items → `/checkout` → fill the form → submit → land on success with an order ref → cart is empty. If the endpoint is not yet deployed, verify the form validation + error path instead and note it.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(storefront)/checkout"
git commit -m "feat(storefront): checkout form + success page"
```

---

### Task 9: Info pages + retire kuzco-catalog cutover note

**Files:**
- Create: `src/app/(storefront)/about/page.tsx`
- Create: `src/app/(storefront)/delivery/page.tsx`
- Create: `src/app/(storefront)/warranty/page.tsx`
- Create: `src/app/(storefront)/contact/page.tsx`
- Create: `src/app/(storefront)/_components/Prose.tsx`

**Interfaces:**
- Produces: four static Ukrainian content pages sharing a `Prose` wrapper.

- [ ] **Step 1: `Prose.tsx`**

```tsx
import type { ReactNode } from "react";

export function Prose({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold">{title}</h1>
      <div className="flex flex-col gap-4 text-sf-ink-soft leading-relaxed">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Four pages**

`about/page.tsx`:

```tsx
import { Prose } from "../_components/Prose";
export const metadata = { title: "Про нас — KUZCO" };
export default function About() {
  return (
    <Prose title="Про нас">
      <p>KUZCO — магазин перевірених вживаних ноутбуків. Кожен пристрій проходить повну діагностику перед продажем.</p>
    </Prose>
  );
}
```

`delivery/page.tsx`:

```tsx
import { Prose } from "../_components/Prose";
export const metadata = { title: "Доставка — KUZCO" };
export default function Delivery() {
  return (
    <Prose title="Доставка">
      <p>Доставляємо Новою Поштою по всій Україні. Менеджер звʼяжеться з вами для підтвердження відділення та способу оплати.</p>
    </Prose>
  );
}
```

`warranty/page.tsx`:

```tsx
import { Prose } from "../_components/Prose";
export const metadata = { title: "Гарантія та обмін — KUZCO" };
export default function Warranty() {
  return (
    <Prose title="Гарантія та обмін">
      <p>На кожен ноутбук діє гарантія. Обмін можливий протягом 14 днів за умови збереження товарного вигляду.</p>
    </Prose>
  );
}
```

`contact/page.tsx`:

```tsx
import { Prose } from "../_components/Prose";
export const metadata = { title: "Контакти — KUZCO" };
export default function Contact() {
  return (
    <Prose title="Контакти">
      <p>Телефон: +380 XX XXX XX XX</p>
      <p>Telegram: @kuzco</p>
    </Prose>
  );
}
```

(Replace placeholder phone/Telegram with real values during this step — ask the shop owner if unknown.)

- [ ] **Step 3: Verify**

Run: `npm run build && npm run lint`, then `npm run dev` and confirm all four pages render and footer/header links reach them.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(storefront)"
git commit -m "feat(storefront): info pages (about, delivery, warranty, contact)"
```

- [ ] **Step 5: Cutover note (no code)**

`kuzco-catalog` retirement is an ops step outside this repo: once the storefront is verified in production, repoint the public domain/DNS (or the reverse proxy) from `kuzco-catalog` to the `kuzco-gui` deployment, then archive the `kuzco-catalog` repo. Track this as a separate ops task — do not delete `kuzco-catalog` from disk as part of this plan.

---

## Self-Review Notes

- **Spec coverage:** Task 1 (Warm Trust theme §8), Task 2 (rendering/data layer §2), Task 3 (cart logic §5), Task 4 (layout shell §3), Task 5 (browse-first home + URL filters §2/§4), Task 6 (product detail + metadata + mobile sticky bar §4/§9), Task 7 (cart page + soft availability §4/§5), Task 8 (checkout → grouped order §4/§6), Task 9 (info pages §4 + cutover §11). Mobile-first (§9) is a per-task verification step.
- **No test runner:** verification is typecheck (`npm run build`) + `npm run lint` + dev-server visual checks, per the project's stated no-testing convention. Logic-heavy units (cart reducer, mappers, filter parsing) are pure functions and could get a lightweight test harness later if one is introduced.
- **Live-type reconciliation:** Tasks 2 (Step 5) and 6 (Step 6) include explicit grep-and-adjust steps because exact `LaptopGroup`/`Laptop` field and label-map names must match the live `@/shared/domain` files.
- **Images:** uses plain `<img>` (with eslint-disable for `@next/next/no-img-element`) since S3 URLs are external and `next/image` would need remote-host config; switching to `next/image` + `next.config` `images.remotePatterns` is an optional later optimization.
- **Pagination caveat:** depends on the server honoring `pageIndex`/`pageSize` on `/laptopGroup/list/public`. If it does not paginate server-side yet (spec §10 API-1), `Pagination` will show one page; add server pagination or client-slice as a follow-up.
