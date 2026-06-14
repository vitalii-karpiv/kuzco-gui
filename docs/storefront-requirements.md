# Kuzco GUI — Storefront Requirements

> Status: Draft for review · Last updated: 2026-06-14
> Scope: **Public storefront only.** The admin panel is specified in
> [`admin-panel-requirements.md`](./admin-panel-requirements.md).

## 1. Context

Kuzco is a used-laptop shop. Customers currently browse the **kuzco-catalog** app (React 19 + antd 6 +
Tailwind 4) — a small SPA: browse → filter → product detail → single-item "inquiry". That app is
obsolete and being **rebuilt completely** as the public half of the new **kuzco-gui** Next.js app.

The storefront and the admin panel share one Next.js (App Router) project. The storefront is the
public `(storefront)` route group, server-rendered for SEO; the admin panel is the protected
`(admin)` group. Both consume **kuzco-server** (the source of truth) and share code via `src/shared`.

The goal: a fresh, modern, conversion-focused commerce experience where customers can browse, compare,
favorite, build a multi-item cart, and submit an order with delivery details for staff to confirm.

### 1.1 Foundational decisions

| Area | Decision |
|---|---|
| **Checkout** | **Order form with delivery details** (delivery method, address/branch, contact, note). Staff confirm the order. **No online payment.** Requires backend additions (see §10). |
| **Features** | **Cart / multi-item**, **compare**, **favorites** (all client-side), and **content pages**. **No customer accounts or order tracking.** |
| **Language** | **Ukrainian only**; all copy via a centralized label module so i18n is possible later. |
| **Design** | **Fresh, modern, conversion-focused e-commerce look** (principles in §8; exact visuals settled in the design phase). |
| **Backend** | Reuse `kuzco-server`. Propose explicitly-flagged public-API additions where today's contract can't support the scope (multi-item order + delivery fields are the main ones). |
| **Stack** | Single Next.js (App Router) project; storefront = `(storefront)` route group; SSR/SSG. |

### 1.2 Terminology
- **Carried-over** — capability in the current kuzco-catalog that we preserve.
- **Reimagined / new** — capability that did not exist before. Marked 🆕.
- **Product** = a `LaptopGroup`. **Variant** = a purchasable configuration within a product.

---

## 2. Current public API contract (kuzco-server)

There is **no separate `/catalog/*` module**. The storefront uses these `@Public()` endpoints:

| Method | Endpoint | Purpose / notes |
|---|---|---|
| POST | `/laptopGroup/list/public` | Search/filter. **Returns only `state === published`.** Filters: `title`, `priceFrom`/`priceTo`, `ramList`, `ssdList`, `screenSizeList`, `resolutionList`, `panelType`. Variant filters use `$elemMatch`. **`pageInfo` exists but pagination is not implemented (zeros); results are cached per query.** |
| GET | `/laptopGroup/:id` | Single product. **Does NOT enforce published state — the client must guard.** |
| POST | `/image/list` | Product images by `groupId`/`laptopId` → `[{ id, s3Url }]`. |
| GET | `/image/:id` | 302 redirect to the S3 URL. |
| POST | `/sale/create/public` | **Single item only:** `{ laptopId, phone, pib }`. Upserts the customer, creates a Sale (`toApprove`), sets the laptop to `waitingForApproval`, emails staff. Returns an empty **201** (no order reference). |

**Product (LaptopGroup) public fields:** `_id`, `groupIdentifier`, `groupName`, `title`,
`groupDescription`, `imageUrl`, `processor`, `videocard`, `discrete`, `isTransformer`, `screenSize`,
`resolution` (`hd/fhd/qhd/uhd`), `panelType` (`tn/ips/oled`), `refreshRate` (`60/120/144/240`),
`variants[]`, `note`.

**Variant fields:** `identifier`, `ram`, `ssd`, `touch`, `keyLight`, `battery`
(`excellent/good/fair/poor`), `condition` (`a+/a/b/c`), `price`, `itemList[]` (laptop IDs —
`itemList.length` ≈ available stock).

**Semantics:** no top-level product price (show as a range across variants); no currency field (UAH
«грн» implied); availability inferred from `itemList.length > 0`. `/sale/create/public` is an async
inquiry — no order id returned, status not synced to the storefront.

**Gaps that drive the proposed API additions in §10:** no real pagination/sorting; single-item
checkout only; no delivery fields; no order reference; published state not enforced on `GET /:id`.

---

## 3. Architecture (shared with the admin panel)

- **AR-1** Storefront is the `(storefront)` route group of the single Next.js App Router project;
  public and **SSR/SSG** for SEO. Admin is the separate protected `(admin)` group.
- **AR-2** Reuse `src/shared`: typed API client, domain types/enums (resolution, panel type,
  condition, battery, delivery), label/format maps, money/date formatters, and Tailwind + headless UI
  primitives.
- **AR-3** Public pages must not pull admin-only bundles. Public requests hit only the `@Public()`
  endpoints above. The API base URL is **env-configured** (replacing the current
  comment/uncomment toggle).
- **AR-4** Cart, favorites, and compare are **client-side only**, persisted in `localStorage` (no
  customer accounts). They re-validate against live API data before checkout.

---

## 4. Information architecture / pages

| Route | Purpose |
|---|---|
| `/` | Home/landing: hero, featured published laptops, entry into catalog, trust/USP content. |
| `/catalog` | Product listing: filters, search, sorting, pagination. |
| `/laptop/[id]` | Product detail: gallery, specs, variant selector, add-to-cart / buy, favorite, compare. |
| `/cart` | Cart review; manage lines; proceed to checkout. |
| `/checkout` | Order form: contact + delivery details; submit. |
| `/checkout/success` | Order-received confirmation (no live tracking). |
| `/compare` | Side-by-side spec comparison of selected products. |
| `/favorites` | Saved products. |
| `/about`, `/contact`, `/delivery`, `/faq` | Content pages (delivery & warranty under `/delivery`). |
| `404` / error | Standard not-found and error pages. |

---

## 5. Functional requirements

🆕 marks capability new vs. today's catalog. Each requirement maps to a backing public endpoint or a
flagged API addition (§10).

### 5.1 Catalog listing (`/catalog`)
- **CAT-1** List published products via `POST /laptopGroup/list/public`.
- **CAT-2** Filters (carried over): title search, price range, RAM, SSD, screen size, resolution,
  panel type. Show active-filter count; apply/reset; mobile slide-in filter panel.
- **CAT-3** 🆕 **Sorting** (price asc/desc, newest). Depends on **API-1**; client-side fallback.
- **CAT-4** 🆕 **Real pagination / "load more."** Depends on **API-1**; client-side fallback over the
  full result set.
- **CAT-5** Product card: image (with fallback), name, key specs (processor/GPU/display), price shown
  as a from-range, availability indicator, and quick **add-to-cart** / **favorite** actions.
- **CAT-6** Loading, empty ("nothing found" + clear filters), and error (retry) states.

### 5.2 Product detail (`/laptop/[id]`)
- **PD-1** Fetch via `GET /laptopGroup/:id` and **guard on `state === published`** (404/redirect
  otherwise — see API-3).
- **PD-2** Image gallery from `POST /image/list`: thumbnails, fullscreen zoom, keyboard nav (carried
  over), with image fallback.
- **PD-3** Technical specs: processor, GPU, display (size / resolution / panel / refresh), transformer
  flag, plus variant-specific touch, key light, battery, and condition — rendered with the shared
  condition/battery/touch tag components.
- **PD-4** Variant selector (carried over, improved): choose RAM/SSD/touch/condition; price updates;
  only show columns that vary; surface per-variant availability (`itemList.length`).
- **PD-5** Actions: 🆕 **add to cart**, 🆕 **add to favorites**, 🆕 **add to compare**, and a direct
  **buy now** that seeds the cart and routes to checkout.
- **PD-6** SEO: per-product meta title/description/OG image (SSR) and Product structured data.

### 5.3 Cart (`/cart`) 🆕
- **CART-1** Add/remove lines; each line = a product + chosen variant, mapped to a specific `laptopId`
  from `variant.itemList`. Show per-line price and a total.
- **CART-2** Persist in `localStorage`; survive reloads.
- **CART-3** Re-validate items (availability + price drift) against the API before checkout; surface
  any changes to the customer.

### 5.4 Compare (`/compare`) 🆕
- **CMP-1** Select multiple products; side-by-side spec table highlighting differences. Client-side
  only; persisted in `localStorage`.

### 5.5 Favorites (`/favorites`) 🆕
- **FAV-1** Save/remove products; `localStorage`-backed; entry point in the header with a count badge.

### 5.6 Checkout (`/checkout`) 🆕
- **CO-1** Order form: contact (name «ПІБ», phone — keep the current `+38` / 10-digit validation),
  🆕 **delivery method** (Nova Poshta / Ukrposhta / Meest / pickup, mirroring the server `Delivery`
  enum), delivery address/branch, and an optional note. Show cart summary + total.
- **CO-2** Submit creates the order for **all cart items**. **Requires API-2** (multi-item + delivery
  public endpoint). Fallback until then: one `POST /sale/create/public` per item (loses delivery
  fields and atomicity).
- **CO-3** On success → `/checkout/success` with a clear "we'll contact you to confirm" message (no
  live tracking, since there are no accounts); clear the cart.
- **CO-4** Validation and errors follow the server `{ statusCode?, message, paramMap }` contract;
  read-only system state is handled gracefully (clear message rather than a dead-end).

### 5.7 Content pages 🆕
- **CNT-1** About, Contact (shop phone, Instagram, etc.), Delivery & Warranty, and FAQ — static, SSG,
  SEO-optimized. Copy sourced from the shop; placeholders until provided.

---

## 6. Cross-cutting requirements
- **CC-1 SEO/SSR:** SSG for home/content, SSR or ISR for catalog/product; sitemap, robots, canonical
  URLs, per-page meta + OpenGraph, Product structured data. `lang="uk"`.
- **CC-2 Performance:** image optimization (Next/Image over S3 URLs), lazy-loaded galleries, cached
  list queries; fast first paint.
- **CC-3 Money/format:** centralized «грн» formatting; price-range display when a product has multiple
  variant prices.
- **CC-4 Language:** Ukrainian throughout, all copy via a centralized label module (i18n-ready).
- **CC-5 Accessibility & responsiveness:** mobile-first; keyboard-accessible gallery, filters, and
  forms.
- **CC-6 Analytics/consent:** a placeholder hook for analytics and a cookie/consent note if analytics
  is later enabled (implementation out of scope now).

---

## 7. Mapping: requirement → backing endpoint

| Area | Endpoint(s) | Notes |
|---|---|---|
| Catalog list / filter | `POST /laptopGroup/list/public` | Sorting/pagination need API-1 (fallback client-side). |
| Product detail | `GET /laptopGroup/:id` | Guard published; ideally API-3. |
| Images | `POST /image/list`, `GET /image/:id` | Gallery + fallback. |
| Checkout submit | `POST /sale/create/public` (per item) | Multi-item + delivery need API-2. |

---

## 8. Design direction (fresh, modern e-commerce)
- Clean, conversion-focused commerce UI on Tailwind + a headless kit, sharing the design system with
  the admin panel.
- Clear product cards, prominent price + CTA, sticky add-to-cart on product detail, and trust signals
  surfaced prominently (condition grade, battery health, warranty, delivery).
- Replace the current glass-morphism aesthetic with a crisp, high-contrast, image-forward layout.
- Exact palette, typography, and components are finalized in the design phase — optionally via
  Figma/mockups before build.

---

## 9. Non-functional requirements
- **NFR-1** Public bundle excludes admin code; Lighthouse-friendly SEO/perf.
- **NFR-2** Graceful handling of an empty catalog, sold-out variants, image load failures, and
  read-only system state.
- **NFR-3** Shared types/enums stay in sync with `kuzco-server` `common/enum/`.
- **NFR-4** Anonymous browsing — no PII collected until checkout submission.

---

## 10. Proposed API additions (flagged; each has a fallback)
- **API-1 Pagination & sorting** on `POST /laptopGroup/list/public` (honor `pageInfo`, add a sort
  param). *Fallback:* client-side paginate/sort the full result set.
- **API-2 Multi-item public order + delivery fields:** a public endpoint accepting an array of
  `laptopId`s plus delivery method/address/note and contact, creating the linked Sale(s) and returning
  an **order reference**. *Fallback:* loop single-item `POST /sale/create/public` (loses delivery
  detail + atomicity, no reference).
- **API-3 Enforce published state on `GET /laptopGroup/:id`** (or a public-safe read) so unpublished
  products can't be deep-linked. *Fallback:* client-side `state` guard.

The storefront remains buildable against today's API via the noted fallbacks.

---

## 11. Assumptions
- Products surfaced publicly are `LaptopGroup`s in `published` state; variants with non-empty
  `itemList` are in stock.
- Orders are asynchronous inquiries: the customer is contacted by staff to confirm; there is no live
  order status on the storefront.
- Currency is UAH («грн»); prices come from `variant.price`.

---

## 12. Out of scope
- Customer accounts, login, and order-status tracking.
- Online payments.
- The admin panel (separate, already specified).
- Any backend rewrite (reuse `kuzco-server`; additions are flagged in §10).

---

## 13. Open questions
1. Final shop content/copy (About / Contact / Delivery & Warranty / FAQ, phone, socials) — needed to
   populate content pages; placeholders used until provided.
2. Commit to API-1/API-2/API-3 now, or ship with fallbacks first? Affects checkout fidelity (delivery
   details, atomicity, order reference) and catalog UX (pagination/sorting). Resolve with the backend
   before/early in implementation.

---

## 14. Verification (this deliverable)
- This file exists at `kuzco-gui/docs/storefront-requirements.md` and:
  - covers catalog, product detail, cart, compare, favorites, checkout (order form + delivery), and
    content pages, each mapped to the backing public endpoint(s) or a flagged API addition,
  - marks new features (🆕) vs. carried-over catalog capability,
  - records the chosen decisions (delivery-form checkout, no payments/accounts, Ukrainian, fresh
    design), the SSR/SEO requirements, assumptions, out-of-scope items, and open questions.
- User reviews and approves before implementation planning begins.
