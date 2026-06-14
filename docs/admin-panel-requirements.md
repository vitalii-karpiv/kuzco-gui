# Kuzco GUI — Admin Panel Requirements

> Status: Draft for review · Last updated: 2026-06-14
> Scope: **Admin panel only.** The public storefront is specified separately (follow-up document).

## 1. Context

Kuzco is a used-laptop shop. Today, staff use the **kuzco-crm** app (React 18 + antd 5) and customers
browse the **kuzco-catalog** app (React 19 + antd 6 + Tailwind). Both are separate frontends on top of
the **kuzco-server** NestJS API, which is and remains the source of truth for all domain data and
business rules.

We are replacing both frontends with a single new app, **kuzco-gui**, containing:
- a public **storefront** (catalog + checkout), and
- a protected **admin panel** (the CRM, this document).

The goal is not a screen-for-screen port. It is a faster, more coherent operations tool that mirrors
how laptops actually move through the business — **procure → service → test → photograph → publish →
sell → deliver** — with less screen hopping, a consistent UI, and clearer financial visibility.

### 1.1 Foundational decisions

| Area | Decision |
|---|---|
| **Backend** | Reuse `kuzco-server` as the source of truth. Propose new/changed endpoints only where the current contract is genuinely awkward, and flag each one explicitly (see §10). |
| **Stack** | Single **Next.js (App Router)** project. Storefront renders SSR/SSG for SEO; admin is a protected client area. |
| **Code sharing** | Shared code lives in `src/shared/`: API client, domain types/enums, state-tag & label maps, money/date formatters, and UI primitives. |
| **UI** | **Tailwind CSS + a headless component kit** (e.g. shadcn/Radix), shared across storefront and admin. Admin grids use a data-table library (e.g. TanStack Table) layered on the kit. |
| **Access model** | **Flat** — every authenticated staff user is a full admin. No RBAC for now, but the design must not preclude adding it later. |
| **Scope** | **Reimagine the CRM** — cover all current capability, but improve the workflows. |

### 1.2 Terminology

- **Carried-over** — capability that exists in kuzco-crm today and must be preserved.
- **Reimagined** — a deliberately new/improved workflow replacing how it's done today. Marked 🆕.

---

## 2. Domain & lifecycle reference

The admin panel is a client of all `kuzco-server` domains: `auth`, `user`, `customer`, `order`,
`laptop`, `laptop-group`, `sale`, `stock`, `finance`, `image`, `kuzco`.

Lifecycles must be centralized in `src/shared` (mirroring the server's `common/enum/`) with one
display-label + color map per lifecycle:

| Lifecycle | States |
|---|---|
| **Order** | `inUsa` → `waitingForPayment` → `delivering` → `requireDocument` → `taxPayed` → `delivered` → `sold` |
| **Laptop** | `new` → `toService` → `toTest` → `toPhotoSession` → `toPublish` → `selling` → `waitingForApproval` → `waitingForDelivery` → `delivering` → `done` |
| **LaptopGroup** | `service` → `preparing` → `published` |
| **Sale** | `new` → `toApprove` → `delivering` → `done` · `rejected` |
| **Stock** | `free` → `booked` → `sold` (derived from `laptopId` + linked laptop state) |

Supporting enums (also centralized): laptop condition (`a+/a/b/c`), battery condition
(`excellent/good/fair/poor`), resolution (`hd/fhd/qhd/uhd`), panel type (`tn/ips/oled`), refresh rate
(`60/120/144/240`), stock type (`ram/hdd/ssd/battery/screen/flex-cable/keyboard/motherboard/matrix/charger`),
sale source (`olx/inst/telegram/tiktok/prom/website`), delivery (`novapost/ukrpost/meest/pickUp`),
expense type (`delivery/purchase/advertisement/stock/tax/other`), counterparty
(`revasevych/karpiv/glukhan`), marketplace (`instagram`).

---

## 3. Architecture & cross-cutting requirements

### 3.1 App shape
- **AR-1** Two App Router route groups: `(storefront)` (public, out of scope here) and `(admin)`
  mounted under `/admin` (protected).
- **AR-2** Admin is primarily client-rendered behind auth; storefront is SSR/SSG. The build must not
  leak admin-only bundles into public pages.
- **AR-3** Shared layer in `src/shared/`: typed API client, domain types/enums, state-tag/label maps,
  money/date formatters, and Tailwind + headless UI primitives.
- **AR-4** Admin grids built on a data-table library (sorting, filtering, pagination, column search);
  forms use one shared form + validation pattern.

### 3.2 Authentication & session
- **AUTH-1** Email/password login via `POST /auth/login`. Store the access token; auto-refresh via
  `GET /auth/refresh` (httpOnly refresh cookie) on a 401, mirroring the current axios interceptor.
- **AUTH-2** Route guard (equivalent to today's `PrivateRoutes`): unauthenticated users hitting
  `/admin/*` are redirected to `/admin/login`.
- **AUTH-3** `GET /user/whoami` hydrates the current user into a shared context (used for assignee
  defaults and "my items").
- **AUTH-4** Logout via `POST /auth/logout` clears the token and refresh cookie.

### 3.3 System state (Kuzco singleton)
- **SYS-1** Read `GET /kuzco` on load. When `state === readonly`, show a persistent read-only banner
  and disable/withhold all mutating actions in the UI (the server's `StateCheckerMiddleware` rejects
  them regardless — the UI must prevent the dead-end).
- **SYS-2** Provide an admin control to toggle `active ↔ readonly` via `PUT /kuzco`.
- **SYS-3** If a mutation is rejected for read-only state, surface a clear "system is read-only"
  message rather than a generic error.

### 3.4 Error handling & feedback
- **ERR-1** Honor the server error contract `{ statusCode?, message, paramMap }`. Show `message` to
  the user; map `paramMap` to field-level errors where applicable.
- **ERR-2** Consistent feedback patterns app-wide: toasts for action results, inline errors on forms,
  empty/loading/error states on every list and detail view.

### 3.5 Acting-user identity
- **ID-1** The server derives `userId` from the Bearer token via `IdentityMiddleware`; the client must
  **not** send it explicitly. State changes and deletions are auto-attributed to the logged-in user
  for audit trails.

### 3.6 Reimagined cross-cutting features
- **CC-1** 🆕 **Global command palette / search:** jump to any laptop, order, sale, group, or stock
  item by code or name from anywhere (keyboard-triggered).
- **CC-2** 🆕 **Unified list framework:** every list view (laptops, orders, sales, stock, groups,
  expenses, investments) shares the same filter + sort + pagination + column-search UX, backed by the
  relevant `POST /<domain>/list` endpoint with server-side pagination.
- **CC-3** 🆕 **Shared state-tag component:** one color-coded tag per lifecycle, replacing the six
  separate tag components in today's CRM.
- **CC-4** Centralized money and date formatting; pricing tiers (cost / limit / sell) presented
  consistently everywhere they appear.
- **CC-5** Preserve current language usage (Ukrainian domain terms such as counterparties); centralize
  all labels so future i18n is possible without touching feature code.

---

## 4. Functional requirements

Each requirement maps to the backing `kuzco-server` endpoint(s). 🆕 marks reimagined behavior.

### 4.1 Dashboard & work queues 🆕
Replaces today's "my assigned items" dashboard with **work queues organized by the laptop lifecycle**,
so staff see what needs doing next.
- **DASH-1** Queue cards with counts for each actionable laptop state: `toService`, `toTest`,
  `toPhotoSession`, `toPublish`, `waitingForApproval`, `waitingForDelivery` (each links to a filtered
  laptop list).
- **DASH-2** **My items:** laptops and sales assigned to the current user (`assignee`).
- **DASH-3** **Procurement watch:** orders grouped by counterparty and state (replaces
  `counterparty-order-list`).
- **DASH-4** **To-buy:** laptops with non-empty `toBuy`, linking directly to the stock-booking flow.
- **DASH-5** **KPI strip:** open sales count and revenue/earnings for the selected period
  (`POST /finance/revenueAndEarnings`).

### 4.2 Orders (procurement)
- **ORD-1** List with filter/search by name, state, and counterparty — `POST /order/list`.
- **ORD-2** Create order (code, name, eBay URL, shipping URL, date of purchase, items in lot, note) —
  `POST /order`.
- **ORD-3** Edit order fields — `PATCH /order`.
- **ORD-4** Change state with audit history — `POST /order/setState`.
- **ORD-5** Delete order (cascades to related laptops; confirm destructive action) —
  `DELETE /order/:id`.
- **ORD-6** Set counterparty (`revasevych` / `karpiv` / `glukhan`).
- **ORD-7** Detail view: order info, **state-history timeline**, related laptops, linked order
  expenses (→ Finance), and per-order COGS — `GET /finance/costPrice/order/:id`.

### 4.3 Laptops (inventory lifecycle — core)
- **LAP-1** List with rich filters (state, assignee, brand/model, pricing) and sort —
  `POST /laptop/list`.
- **LAP-2** 🆕 **Pipeline board view:** laptops grouped in columns by `LaptopState`, with state
  transitions via drag or action — `POST /laptop/setState`. Available as an alternative to the table.
- **LAP-3** Create a laptop from an order — `POST /laptop`.
- **LAP-4** Edit characteristics, assignee, and pricing — `PATCH /laptop`.
- **LAP-5** Change state with history; delete (confirm) — `POST /laptop/setState`, `DELETE /laptop/:id`.
- **LAP-6** Detail view, reorganizing today's blocks into a cleaner layout:
  - **Characteristics:** processor, GPU, RAM, SSD, screen size, resolution, panel type, refresh rate,
    touch, key light, battery condition, transformer mode.
  - **Tech check** (🆕 as a completable checklist): keyboard, camera, mic, sound, display, battery
    charge/hold, ports, cooler, AIDA stress test, mem test.
  - **Complectation / parts:** linked stock items; add/remove; a "buy" flow that books stock.
  - **Defects** list.
  - **Finance:** cost/limit/sell prices + computed COGS — `GET /finance/costPrice/laptop/:id`.
  - **Images:** upload/manage — `POST /image/upload`, `POST /image/list`, `DELETE /image/:id`.
  - **Group & sale:** the laptop's group/variant and the sale it belongs to (cross-links).
- **LAP-7** Bulk operations: add/remove laptops to/from groups; copy specs to clipboard; export to
  Excel.

### 4.4 Laptop groups (catalog & publishing)
- **GRP-1** List with marketplace publish status — `POST /laptopGroup/list`.
- **GRP-2** Create group (starts in `service`) — `POST /laptopGroup`.
- **GRP-3** Edit metadata/specs — `PATCH /laptopGroup`; delete (confirm) — `DELETE /laptopGroup/:id`.
- **GRP-4** State transitions to `preparing` / `published` — `POST /laptopGroup/setState`.
- **GRP-5** Detail: title/description/note editing, spec summary, and **variants** (identifier, RAM,
  SSD, touch, battery condition, price, member laptop IDs) with add/remove laptop —
  `POST /laptopGroup/addLaptop`, `POST /laptopGroup/removeLaptop`.
- **GRP-6** Image management for the group (→ Images module).
- **GRP-7** **Marketplace block:** generate a description —
  `POST /laptopGroup/marketplace/generateDescription`; toggle Instagram publish —
  `POST /laptopGroup/marketplace/togglePublished`.
- **GRP-8** Note: published groups are the bridge to the storefront catalog.

### 4.5 Sales
- **SAL-1** List with filter/sort by date, state, and source — `POST /sale/list`.
- **SAL-2** Create sale (laptop, price, date, source, delivery) — `POST /sale`.
- **SAL-3** Edit fields — `PATCH /sale`; delete (confirm) — `DELETE /sale/:id`.
- **SAL-4** Change state with history — `POST /sale/setState`; assign handler —
  `POST /sale/setAssignee`.
- **SAL-5** 🆕 **Approval queue:** storefront-submitted sales (created via public
  `POST /sale/create/public`, arriving in `new`/`toApprove`) are surfaced as a first-class inbox for
  staff to approve or reject — not buried in the general list.
- **SAL-6** Detail: customer card (name/phone), laptop info, finance breakdown
  (cost/revenue/profit), source, delivery type + TTN, and "other sales by this customer".

### 4.6 Customers (light CRM)
- **CUS-1** View a customer — `GET /customer/:id`.
- **CUS-2** Create/upsert a customer inline during sale creation — `POST /customer`.
- **CUS-3** Show a customer's sale history. (Customers have no login — phone + name only.)

### 4.7 Stock / parts inventory
- **STK-1** List with filter/sort by code, name, price, state, and type — `POST /stock/list`.
- **STK-2** Create stock, possibly in bulk — `POST /stock`.
- **STK-3** Edit stock — `PATCH /stock` (linking a laptop recomputes `free`/`booked`); delete —
  `DELETE /stock/:id`.
- **STK-4** Detail with laptop linking; integrate with the laptop complectation "buy" flow (§4.3).

### 4.8 Finance
- **FIN-1** **Expenses:** list/create/edit/delete — `POST /finance/expense`, `POST /finance/expense/list`,
  `PATCH /finance/expense`, `DELETE /finance/expense/:id`. Types
  (delivery/purchase/advertisement/stock/tax/other). Link to order —
  `POST /finance/expense/setParent`. Bulk import — `POST /finance/expense/sync`.
- **FIN-2** **Investments:** list/create/edit/delete — `POST /finance/investment`,
  `POST /finance/investment/list`, `PATCH /finance/investment`, `DELETE /finance/investment/:id`.
- **FIN-3** **Balances:** list + sync external accounts — `POST /finance/balance/list`,
  `POST /finance/balance/sync`, `POST /finance/balance`. Balance cards.
- **FIN-4** **P&L:** revenue & earnings for a date range — `POST /finance/revenueAndEarnings`; COGS per
  laptop/order — `GET /finance/costPrice/laptop/:id`, `GET /finance/costPrice/order/:id`.
- **FIN-5** 🆕 **Consolidated finance overview:** a single screen combining balance cards, period P&L,
  and the expense/investment tables with shared date filtering (replaces today's scattered cards and
  tables).

### 4.9 Images
- **IMG-1** Reusable image manager used by laptops and groups: upload — `POST /image/upload`; list by
  entity — `POST /image/list`; delete — `DELETE /image/:id`; link to group —
  `POST /image/linkGroup`.

### 4.10 Users (staff)
- **USR-1** List — `POST /user/list`; view — `GET /user/:id`; create — `POST /user`; edit —
  `PATCH /user`; delete — `DELETE /user/:id`; current user — `GET /user/whoami`.
- **USR-2** Drives assignee pickers across laptops and sales.

### 4.11 System administration
- **ADM-1** Kuzco state control (`active ↔ readonly`) — `GET /kuzco`, `PUT /kuzco` (see §3.3).
- **ADM-2** Optional advanced/maintenance action: trigger an event —
  `POST /kuzco/publishEvent` (laptop lifecycle events). Surface only in an admin/maintenance area.

---

## 5. Reimagined-workflow highlights

1. **Lifecycle-first navigation** — dashboard work queues + a laptop pipeline board replace
   screen-by-screen hunting.
2. **Unified list/filter/search framework** — instead of bespoke filter bars per page.
3. **Sales approval queue** — storefront orders become a first-class inbox.
4. **Consolidated finance overview** — instead of scattered cards/tables.
5. **Global command palette** — instant navigation by code/name.
6. **One shared design system** — state tags, money/date formatting, tables, forms — for consistency
   and faster future development.

---

## 6. Non-functional requirements

- **NFR-1 Performance:** list views paginate server-side; pipeline/board columns lazy-load.
- **NFR-2 Reliability:** graceful handling of read-only mode and the standard error shape.
- **NFR-3 Maintainability:** shared types/enums mirror `common/enum/`; one API client; code organized
  by feature.
- **NFR-4 Security:** access token in memory + httpOnly refresh cookie; no admin code in public
  bundles.
- **NFR-5 Accessibility & responsiveness:** usable on laptop and tablet widths (staff are both at
  desks and in the warehouse).
- **NFR-6 Extensibility:** access model is flat now, but auth/UI structured so RBAC can be layered on
  later without rework.

---

## 7. Assumptions

- `kuzco-server` remains the single source of truth and stays running unchanged except for the
  minimal, explicitly-flagged adjustments in §10.
- Storefront-submitted orders arrive as Sales via `POST /sale/create/public` in an early state for
  staff approval.
- Existing domain enums and business rules (state machines, stock free/booked/sold derivation,
  cascade-on-order-delete) are authoritative and reproduced — not reinvented — on the client.

---

## 8. Out of scope (this document)

- The public **storefront** (catalog browse, product page, checkout via `POST /sale/create/public`) —
  specified in the next document.
- Any backend rewrite. We reuse `kuzco-server`.
- Implementing RBAC.

---

## 9. Open questions

1. Is anything in today's kuzco-crm **dead/unused** and better dropped than reimagined? (Resolve
   during implementation review.)

---

## 10. Proposed API adjustments (minimal, to flag)

These are proposals only; all requirements above remain implementable against today's API.

- **API-1** A combined dashboard/work-queue **summary endpoint** would avoid many parallel `list`
  calls. Fallback: the client aggregates counts client-side.
- **API-2** Confirm `POST /sale/list` can filter by state/source to drive the **approval queue**.
  Fallback: filter client-side.

---

## 11. Verification (this deliverable)

- This file exists at `kuzco-gui/docs/admin-panel-requirements.md` and:
  - covers every domain and lifecycle in §2 with concrete, testable requirements,
  - maps each functional requirement to its backing `kuzco-server` endpoint(s),
  - clearly marks reimagined workflows (🆕) vs. carried-over capability,
  - lists assumptions, out-of-scope items, and open questions.
- User reviews and approves this content before we proceed to the storefront requirements.
