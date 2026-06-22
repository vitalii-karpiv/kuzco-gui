# Kuzco Storefront — Design Spec

**Date:** 2026-06-22
**Project:** `kuzco-gui` (Next.js 16 App Router, React 19, Tailwind v4) + supporting changes in `kuzco-server`
**Status:** Design — approved direction, pending implementation plan

## 1. Goal

Build the public-facing storefront for Kuzco (used-laptop shop) inside `kuzco-gui`'s
`(storefront)` route group. It replaces the standalone `kuzco-catalog` Vite/antd SPA
at feature parity plus improvements. Once live, `kuzco-catalog` is retired.

**Core decisions (from brainstorming):**

| Decision | Choice |
|---|---|
| Where it lives | `kuzco-gui` → `src/app/(storefront)/`, separate from `(protected)` admin |
| Relationship to `kuzco-catalog` | Full replacement |
| Pages | Home (browse-first), Catalog, Product detail, Cart, Checkout, Info pages |
| Purchase flow | Full cart + checkout, **no online payment** (staff arrange offline) |
| Stock conflicts | **Staff de-dupe** — overbooking allowed, no reservation logic |
| Visual identity | "Warm Trust" — cream/forest-green/amber, distinct from dark admin |
| Language | Ukrainian only (no i18n framework) |
| **Priority constraint** | **Mobile-first** |

## 2. Rendering Architecture

The storefront is a public catalog where SEO matters, so it leans on Next.js Server
Components.

- **Server-rendered, crawlable:** Home/catalog and product-detail pages are Server
  Components that fetch public data server-side with `fetch()` and `next: { revalidate: 60 }`.
- **Metadata:** Product pages implement `generateMetadata` (title, description, Open
  Graph image from the laptop group's S3 image).
- **No admin axios client on the storefront.** `shared/api/client.ts` is tied to
  localStorage tokens + 401-refresh, which public pages don't need. Introduce a small
  server-side fetch layer (`(storefront)/lib/catalog-api.ts`) wrapping the public
  endpoints. (The cart's order submission, a client action, may use a thin `fetch`
  wrapper too — still no auth.)
- **Filters in the URL:** Catalog filters live in URL search params
  (`/?ram=16&ssd=512&priceTo=20000`). The Server Component reads `searchParams`, maps
  them to the `POST /laptopGroup/list/public` body, renders results. Client filter UI
  pushes new search params. This is shareable, bookmarkable, and SSR-friendly.
- **Client components:** filter UI, variant selector, cart, checkout form, gallery
  interactions, mobile drawers.

## 3. Route Map

```
src/app/(storefront)/
  layout.tsx                  # storefront shell: header, footer, CartProvider, scoped theme
  page.tsx                    # Home = browse-first (slim hero + trust band + filters + grid)
  catalog/page.tsx            # Optional: alias of home browse view (or redirect to /). See §4.
  laptop/[id]/page.tsx        # Product detail (Server Component + generateMetadata)
  cart/page.tsx               # Cart review (client)
  checkout/page.tsx           # Checkout form: contact + delivery (client)
  checkout/success/page.tsx   # Order confirmation (shows order reference)
  about/page.tsx              # Про нас
  delivery/page.tsx           # Доставка (Nova Poshta etc.)
  warranty/page.tsx           # Гарантія та обмін
  contact/page.tsx            # Контакти / FAQ
  lib/catalog-api.ts          # server-side fetch layer for public endpoints
  lib/cart.tsx                # CartProvider (client context, localStorage)
  lib/mappers.ts              # laptop-group → storefront view model
  components/...               # see §7
```

Route paths stay English; all visible copy is Ukrainian. The storefront theme is scoped
to `(storefront)/layout.tsx` so it never collides with the admin's dark "Graphite
Console" tokens (e.g. a wrapper class / `data-theme="storefront"` or a layout-scoped CSS
layer).

## 4. Pages

### Home (`/`) — browse-first
Slim hero with a search field, a trust band (Гарантія / Діагностика / Обмін 14 днів),
then the **filterable catalog grid** directly on the page. This is the primary browse
surface. Decision to confirm during planning: whether `/catalog` is a redirect to `/`,
or hosts the same browse component for a cleaner URL — default: keep one canonical browse
view at `/` and redirect `/catalog` → `/`.

- **Mobile:** single-column product grid; filters open as a bottom-sheet via a "Фільтри"
  button; sticky search.
- **Desktop:** left filter sidebar + 2–4 column product grid.
- Pagination via `pageInfo` from the list endpoint (page size from URL param).

### Product detail (`/laptop/[id]`)
- **Left/top:** gallery — large image + thumbnails (from `POST /image/list` by groupId).
- **Right/below:** title, processor/GPU/screen subtitle, condition + battery + warranty
  badges, **variant selector** (each RAM/SSD/condition combo with its own price + stock
  state; out-of-stock variants disabled), buy row (price + "Додати в кошик" + "Купити
  зараз"), then a full specs table.
- Selecting a variant updates price and the add-to-cart target.
- **Mobile:** gallery → info → specs stacked; **sticky bottom add-to-cart bar** showing
  selected variant price + button.

### Cart (`/cart`)
- Client-side list of cart lines (snapshots, see §5).
- Per line: thumbnail, title, variant summary, price, remove; line subtotal; cart total.
- **Soft availability check:** on load, re-fetch each line's group; if its variant now
  has 0 available units, flag "немає в наявності" and let the user remove it. Best-effort
  only — overbooking still allowed.
- CTA → `/checkout`.

### Checkout (`/checkout`)
- Form: name (pib), phone (E.164, UA format/validation), preferred contact channel
  (phone / Telegram), delivery city + Nova Poshta branch, optional note.
- No payment step. Submit → one bulk public order call (§6) → clear cart → redirect to
  `/checkout/success` with the returned order reference.

### Checkout success (`/checkout/success`)
- Confirmation, order reference, "we'll contact you to confirm" message, next steps.

### Info pages
Static Ukrainian content: About, Delivery, Warranty/exchange, Contact/FAQ. Server
Components, simple prose layout, linked from header/footer.

## 5. Cart Logic (client-side)

Because we chose *staff de-dupe* (no reservations), the cart is pure client state — no
server cart, no sessions.

- `CartProvider` (React context) persisted to `localStorage`.
- A cart **line** stores a snapshot:
  `{ groupId, variantIdentifier, title, specSummary, condition, battery, price, imageUrl, addedAt }`.
  Snapshotting price/specs means the cart shows what the customer saw and survives group
  edits.
- A line does **not** pin a specific `laptopId` — the server picks an available unit per
  variant at order time.
- Cart UI: header cart pill (count), slide-over **cart drawer** on add, full `/cart` page
  for review.
- "Купити зараз" adds the one line and routes straight to `/checkout`.

## 6. Server Changes (`kuzco-server`) — do first, per CLAUDE.md

The current `POST /sale/create/public` takes a single `laptopId` + `phone` + `pib`. A cart
needs a multi-item public order that (a) accepts **variant references** not specific
units, (b) lets the server pick an available `laptopId` per line, (c) captures delivery
info, and (d) groups the lines as **one customer order** (confirmed preference).

**Proposed new endpoint** (exact name/placement to confirm against existing `order`/`sale`
domain conventions and models):

```
POST /sale/order/public        # @Public()
{
  contact:  { pib, phone, contactChannel: "phone" | "telegram" },
  delivery: { city, branch },
  note?: string,
  items: [ { groupId, variantIdentifier } ]
}
→ { orderRef }                 # 201
```

Behavior:
- For each item, resolve the variant's `itemList` to an **available** unit and create the
  sale line.
- Group the lines into a single customer order so staff see "one customer, N laptops" as
  a unit in the admin. (Needs a look at the real `Sale`/`Order` models to decide: reuse
  an existing grouping, add a light order-grouping field, or a new collection.)
- **Overbooking permitted** — if a unit is already gone, staff reconcile in the admin.
- The existing single-item `/sale/create/public` can remain or be folded in.

**Open items for the implementation plan (resolve against real models):**
- Exact endpoint name & which module owns it.
- Sale-vs-Order data model for a grouped customer purchase.
- New DTOs (`dto/in`, `dto/out`) following the project's validation/error conventions.
- Update `documentation/<domain>/*.md` for the new endpoint.
- Admin (`kuzco-gui`) view for incoming public orders + reconciliation (may be a
  follow-up; flag scope).

## 7. Component Inventory (`(storefront)/components/`)

- **Shell:** `Header` (logo, nav, search, cart pill, mobile hamburger), `Footer`,
  `MobileNavDrawer`, `CartDrawer`.
- **Browse:** `FilterPanel` (sidebar on desktop, bottom-sheet on mobile), `ProductGrid`,
  `ProductCard`, `Pagination`, `SearchBar`, `ActiveFilters`/chips.
- **Detail:** `Gallery`, `VariantSelector`, `SpecTable`, `BadgeRow` (condition/battery/
  warranty), `StickyBuyBar` (mobile), `BuyRow`.
- **Tags:** `ConditionTag`, `BatteryTag`, `TouchTag`, `StockTag` (port/adapt from
  `kuzco-catalog`).
- **Checkout:** `CheckoutForm`, `CartLineItem`, `OrderSummary`, `NovaPoshtaFields`.
- **Primitives:** small Tailwind button/input/badge primitives in the Warm Trust theme
  (no antd; consistent with kuzco-gui's custom-component approach).

## 8. Visual Identity — "Warm Trust"

- **Palette:** cream paper `#fbf8f3`, panel `#efe7da`, hairline `#e7ddcb`, ink (dark
  green) `#1f3d2b`, primary `#2f6f4e` (forest green), accent `#c9892f` (amber), muted text
  `#6b5d49`. State colors: in-stock green, out-of-stock warm red `#b04a3a`.
- **Type:** Unbounded for display/headings, Geist Sans for body (already loaded in
  `kuzco-gui`).
- **Feel:** rounded (12–16px radius), comfortable spacing, soft shadows, trust-forward
  (warranty, diagnostics, exchange surfaced prominently).
- Defined as storefront-scoped Tailwind v4 tokens, isolated from admin tokens.

## 9. Mobile-First Requirements (cross-cutting)

- Design and build at the smallest breakpoint first; enhance upward.
- Product grid: 1 col → 2 → 3/4 across breakpoints.
- Filters: bottom-sheet/drawer on mobile, persistent sidebar ≥ `md`.
- Detail page: stacked sections + **sticky bottom buy bar** on mobile.
- Nav: hamburger drawer on mobile; cart as slide-over.
- Tap targets ≥ 44px; inputs sized to avoid iOS zoom; thumb-reachable primary actions.
- Test all flows at mobile width before desktop.

## 10. Out of Scope (YAGNI)

- Online payment / payment provider integration.
- Reservations / stock holds / cart expiry.
- User accounts / login on the storefront (purchases are anonymous lead-style).
- Multi-language / i18n.
- Wishlist, reviews, comparison tool.

## 11. Build Order (high level — detailed plan to follow)

1. **Server:** new bulk public order endpoint + DTOs + grouping + docs.
2. **Storefront foundation:** route group, scoped Warm Trust theme, layout shell
   (header/footer/cart provider), server-side `catalog-api` fetch layer.
3. **Browse:** home/catalog Server Component, filters (URL-driven), product grid/card,
   pagination — mobile-first.
4. **Detail:** gallery, variant selector, specs, buy actions, metadata, sticky mobile bar.
5. **Cart + checkout:** cart context/drawer/page, soft availability check, checkout form,
   submit to new endpoint, success page.
6. **Info pages** + footer wiring.
7. **Retire `kuzco-catalog`** (cutover, redirects/DNS as applicable).
