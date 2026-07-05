# The Back Office — the standard we build to

Single source of truth for the admin redesign. We define the target
completely here, lock the guardrails, then build to it archetype by
archetype until a stranger cannot tell this from an Apple-owned app.

Read `docs/DESIGN.md` for the maison laws this inherits. This document
does not repeat them; it applies them to a working dashboard.

> **This aligns with `docs/DESK-SHELL.md`.** CODEX wrote that doctrine the
> same day, independently, and the two agree: three surfaces (rooms rail /
> work canvas / context rail = sidebar / content / inspector), the phone
> keeps its tab bar, the desktop gains the rail, the widest gains the
> inspector, no borders, one gold action, whisper copy, six houses, no
> hard deletes, one product not three. Read them as one contract.
> `DESK-SHELL.md` leads on the doctrine, the nine-room rail model, the
> Visible Language Guardrail (batch / blob / schema / wire become owner
> words), and the nine-step build order. This file leads on the
> route x size-class x state coverage matrix (section 4b), the state laws
> (section 5), the premiumness checklist, and the working prototype
> (`tmp/back-office-shell.html`). The live channel between the two hands
> is `docs/AGENT-HANDSHAKE.md`.

---

## 0 · Scope

- **In scope:** the back office (`/admin`) — the shell, navigation,
  every room, every record, every state, on every size class.
- **Held to the same bar (already most of the way there):** the shop
  window (`/piece`, the reveal, the palettes).
- **Out of scope here:** owner-truth and infra (business facts, Google
  profile, push secrets). Those are content and keys, not layout.

The front-of-house is a magazine. The back office is a dashboard — and
`DESIGN.md` says "magazine, not dashboard." That is not a contradiction:
the back office earns the one dashboard in the house by being the most
disciplined dashboard anyone has seen. Apple ships dashboards (Mail,
Reminders, Xcode, App Store Connect). We hold to how *they* do it.

## 1 · North star (one line)

> A back office a stranger would assume Apple shipped: one adaptive shell
> that reads the **size class, not the device** — a tab bar that becomes a
> sidebar, a detail that becomes an inspector — with every record and
> every state handled, every surface obeying the maison's own laws:
> lucent, borderless, concentric, tabular, quiet.

**The test is the squint test.** Blur any screen. Materials, spacing,
hierarchy, and restraint should read *Apple*. If it reads *web
dashboard*, it fails and does not ship.

## 2 · Guardrails — non-negotiable

These cannot break. They come from `DESIGN.md` and current Apple HIG
(iOS 26 / macOS Tahoe, Liquid Glass). A screen that violates one is not
done, regardless of how finished it looks.

| # | Law | What it means in the back office |
|---|---|---|
| G1 | **No borders, no hairlines** | Separation by whitespace, lucent surface, and soft inner glow. No `border`, no `divide-*` line, no ruled table. Liquid Glass agrees: floating translucent chrome, never an edge. |
| G2 | **Concentric geometry** | Capsule 999 for chrome (bar, sidebar rail, chips, buttons, toggles); squircle 28 for panels; 22–26 for cards and media; 40 for inset bands. Never a sharp rectangle inside a rounded parent. |
| G3 | **Two lucent materials only** | `glass` (floating chrome: sidebar, tab bar, inspector, sheets, filter sheet) and `panel` (resting surface: cards, form groups). Defined once in globals.css; nothing invents a third. |
| G4 | **The type ramp is closed** | Only the nine sizes and their fixed trackings (11 / 12 / 14 / 16 / 20 / 26 / display-section / -page / -hero). Serif display, native sans body (SF Pro on Apple — free Apple-native texture). No new size, leading, or tracking. |
| G5 | **Tabular everything countable** | Money via `naira()`, quantities and dates locale-formatted, all `tabular-nums`. Numbers must align down a column. |
| G6 | **Motion glides** | 240–500ms, `--ease-glide`, opacity + 0.985→1 scale only. Reduced-motion collapses to stills. Nothing flies, spins, or bounces. The inspector and sheets slide; the tab bar minimises on scroll; that is the vocabulary. |
| G7 | **Copy whispers** | Few words, no em dashes, Dyrane voice. Every label, every empty state, every error, every button is written to this bar. "Nobody owes you today," not "No outstanding receivables found." |
| G8 | **One gold thing** | Gold is the single primary action per screen, plus eyebrows and the words that matter (owed totals, alerts). Never gold noise; secondary actions are hairline text links. |
| G9 | **AA contrast, gold focus** | Every text token ≥ 4.5:1 on its ground in both suns (ratios in QA.md). Keyboard focus is the 1px gold ring, 4px offset, `:focus-visible` only. |
| G10 | **No hard deletes** | Archive, reverse, correct beside the original. Consequence confirmations gate door-crossing mutations (stock movement, settle, deliver). Every mutation lands in the audit log. |
| G11 | **Size class, never device** | Adapt to available width and input capability (`pointer`, `hover`), not to a guessed OS. Same content everywhere; the layout is what adapts. |

## 3 · The architecture — one shell, three forms

One navigation model. It renders differently by size class the way
Apple's `UITab`/`NavigationSplitView` do — automatically, not as three
separate builds.

**Compact (phone, < 768px) — Nonso's primary device, keep it excellent**
- Bottom **glass tab bar**: the five rooms, floating, safe-area aware,
  minimising on scroll (HIG 2025). This already exists; it stays.
- Single content column. Detail opens as a **pushed view**; quick actions
  (add payment, mark delivered, add line, filters) open as **detent
  sheets**, not new pages.

**Regular (tablet / laptop, ≥ 768px)**
- Leading **glass sidebar** replaces the top nav: the five rooms up top,
  the secondary rooms (Insights, Deliveries, Media, Settings, Share)
  grouped below, the palette and sun at the foot. Persistent, floating,
  content passes under its glass.
- Content column to its right. The header thins to a title + the one gold
  action.

**Wide + a dense record (≥ 1200px, on order / customer / piece detail)**
- The trailing **inspector** appears: the list or content stays, the
  record's detail and edit sit beside it. Selecting an order shows it in
  the inspector without leaving the ledger. Below 1200px the inspector
  becomes the pushed detail we already have, or a sheet.

**Liquid Glass alignment (the current HIG texture, already our DNA)**
- Sidebar, tab bar, inspector, and sheets are `glass`; content scrolls
  under them; the tab bar minimises on scroll; concentric radii
  throughout. Our "lucent, borderless, concentric" laws already *are*
  Liquid Glass, which is why this is a small reach, not a rebuild.

**Nav map**

| Tier | Destinations | Where |
|---|---|---|
| Rooms (primary) | Home · Stock · Orders · People · Owed | tab bar (compact) / sidebar top (regular) |
| Secondary | Insights · Deliveries · Media · Settings · Share | sidebar lower group / "More" sheet on compact |
| Chrome | Palette · Sun · Sign out | sidebar foot / header |

## 4 · Use-case coverage — the no-leak guarantee

Every route resolves to one of seven **archetypes**. The archetype fixes
the adaptive behaviour and state treatment once; the per-route table then
proves nothing is missed.

### 4a · Archetypes

1. **Glance** (Home, Insights) — metric/panel grid, read-only. Regular
   widens the grid; no inspector. Wall-monitor legible.
2. **Ledger** (Orders, Settled, People roster, Stock, Ranges, Deliveries
   lanes, Owed, Media, Audit history) — card grid or swimlane. Regular =
   sidebar + list. For the dense three (Orders, People, Stock) a row on
   wide opens the **inspector** instead of a full-page jump.
3. **Record** (Order `[id]`, Customer `[id]`, Piece `[slug]`) — the dense
   editors, the primary declog. Wide = list │ inspector. Compact = pushed
   detail + detent sheets for each action. This is where the current
   vertical tower becomes context-beside-content.
4. **Form** (Order/Customer/Piece/Range/Delivery `new`) — light create
   flows. Launched from a list "+", they open as a **sheet** on compact,
   in the inspector on wide. Gate states (no customers / ranges / orders)
   stay, as one quiet line + a link.
5. **Read-only** (Insights, Audit history) — panels and logs, no
   mutation, generous glance.
6. **Config** (Settings) — form + panels, owner-only sections gated.
7. **Bridge** (Share) — inbound intent → match → one action. Sheet-like.

### 4b · Every route mapped

| Route | Archetype | Compact | Regular / Wide | Key states to write |
|---|---|---|---|---|
| `/` Home | Glance | tab bar + stacked metric cards | sidebar + 3-col metrics | db-error fallback + retry, fresh-user tour, loading skeleton |
| `/orders` | Ledger | grouped cards + filter sheet | sidebar + list; wide: row → inspector | empty book, search miss, loading, status chips |
| `/orders/[id]` | Record | pushed detail; action sheets | list │ inspector (lines · payments · status) | no lines, no payments, settled read-only, owed/credit/paid, consequence sheet |
| `/orders/new` | Form | sheet from "+" | inspector / centered | no-customers gate |
| `/orders/settled` | Ledger | cards, paged | sidebar + list, read-only | empty, pager tail-back |
| `/customers` | Ledger | enquiries + roster + sheet | sidebar + list; wide: row → inspector | no customers, no results, enquiries block, dual pager |
| `/customers/[id]` | Record | pushed detail; motion sheets | detail │ inspector (owed · orders · motions) | no orders, no enquiries, balance states |
| `/customers/new` | Form | sheet | inspector / centered | phone prefill from share/new-order |
| `/pieces` | Ledger | family→range cards + filter sheet | sidebar + grid; wide: card → inspector | empty stockroom, stock-starter, drafts count, filter miss |
| `/pieces/[slug]` | Record | pushed detail; photo + stock sheets | photos │ inspector (form · stock · live preview) | published toggle, publish validation, stock/reorder/ETA |
| `/pieces/new` | Form | sheet | inspector / centered | no-ranges gate |
| `/ranges` | Ledger | cards | sidebar + list | empty |
| `/ranges/[slug]` | Record (light) | form + shelf list | form │ shelf inspector | no pieces on shelf |
| `/ranges/new` | Form | sheet | centered | — |
| `/deliveries` | Ledger (swimlane) | three lanes + step sheets | sidebar + lanes | nothing to ship, consequence sheet, landed pager |
| `/deliveries/new` | Form | sheet | centered | no open orders gate |
| `/debts` | Ledger | cards, oldest first | sidebar + list + owed summary rail | nobody owes, aging buckets |
| `/insights` | Glance / Read-only | stacked panels + window chips | sidebar + 2-col panels | no data yet, window switch |
| `/media` | Ledger (gallery) | 1-col photos + filter sheet | sidebar + 3-col + filters | getting-ready, empty, filter miss |
| `/settings` | Config | stacked form + panels | sidebar + 2-col | keys-not-migrated, missing-env note, owner-only |
| `/settings/history` | Read-only | log rows, paged | sidebar + log | no table yet, empty, pager |
| `/share` | Bridge | arrived + action, stacked | centered match card | nothing shared, matched, phone-found, no-match |

No route is unaccounted for. No archetype is undefined. That is the leak
check.

## 5 · State laws — every screen, every state

A screen is not done until all of these that apply are written and
styled to the guardrails:

- **Empty** — bespoke whisper copy in a `panel`, never a blank. "The book
  is open and empty."
- **Loading** — a skeleton that mirrors the room's own shape, fading in
  after 250ms so fast answers never flash it.
- **Error** — one quiet sentence with the gold icon *and a way back*
  (retry / refresh), never a dead end. (Fills the inventory's
  error-recovery gap.)
- **Dense / overflow** — scrolls, never truncates the meaning; long names
  ellipsis with the full value reachable.
- **Offline** — the office is a PWA; a disconnect shows the calm offline
  room or a cached view, not a crash. (Fills the offline-graceful gap.)
- **Pending** — the submit control disables and says its verb ("Saving…");
  optimistic chips walk back on failure.
- **Consequence** — door-crossing mutations confirm in a sheet that names
  the exact stock movement before the gold proceed.
- **Async announced** — an `aria-live` region speaks the result of a
  mutation for screen readers. (Fills the ARIA-live gap.)

## 6 · The premiumness checklist — run on every surface before "done"

Copy this per screen. All boxes, or it does not ship.

- [ ] **No edge** — zero borders/hairlines/ruled lines; separation is
      space, glow, material (G1).
- [ ] **Concentric** — every corner on the scale; no sharp rect in a
      rounded parent (G2).
- [ ] **Right material** — chrome is `glass`, surfaces are `panel`; blur /
      saturate / opacity from tokens (G3).
- [ ] **Ramp only** — type from the nine sizes with correct tracking;
      serif display, native sans body (G4).
- [ ] **Tabular** — money/qty/dates aligned, `tabular-nums`, `naira()`
      (G5).
- [ ] **Glide** — motion ≤ 500ms, ease-glide, opacity+scale; reduced-
      motion path; nothing flies (G6).
- [ ] **Whisper** — labels/empties/errors/buttons few-word, no em dash,
      Dyrane voice (G7).
- [ ] **One gold** — a single primary action; the rest hairline links
      (G8).
- [ ] **AA + focus** — text ≥ 4.5:1 both suns; gold `:focus-visible` ring
      (G9).
- [ ] **Safe mutations** — no hard delete; consequence confirmed; audit
      written (G10).
- [ ] **Adaptive** — tab bar ⇄ sidebar, detail ⇄ inspector by size class;
      input-aware; no device sniff (G11).
- [ ] **All states** — empty, loading, error+recovery, overflow, offline,
      pending, async-announced (§5).
- [ ] **Keyboardable** — focus order sane, `aria-current` on nav, labels
      present, sheets trap and restore focus.
- [ ] **Squint test** — blur it: does it read *Apple*? (materials,
      spacing, hierarchy, restraint).

## 7 · Definition of done — when we stop

1. Every route in §4b passes the §6 checklist on **compact, regular, and
   wide**.
2. The coverage matrix has **no empty cell**; every state in §5 exists
   where it applies.
3. `scripts/theme-check.py` and the QA.md contrast ratios pass in both
   suns and across the six palettes.
4. Lint and types clean; the build deploys green.
5. **The blind test:** shown the back office beside a reference Apple app
   (Reminders, App Store Connect), a stranger cannot say which is which.

## 8 · How we build toward it — gated phases

- **Phase 0 — this document, confirmed.** Nothing is built until the goal
  is agreed. (You are here.)
- **Phase 1 — the adaptive shell, prototyped for your eye.** Sidebar ⇄
  tab bar and an inspector scaffold, as a gated mock, before any wiring.
- **Phase 2 — migrate by archetype, densest first.** Records (Order,
  Customer, Piece) get the inspector — the biggest declog — each eye-gated
  and checklist-passed, then Ledgers, then the rest.
- **Phase 3 — the sweep.** States, motion, keyboard, screen reader,
  offline, contrast across all six palettes.

**Coordination:** the admin shell is CODEX's active lane. The rule holds —
I prototype and you gate; the wiring lands in coordination with CODEX so
two hands never fight one file. This document is the shared contract both
hands build to.

---

*Locked when the owner confirms. Changes to the goal are changes to this
file, gated the same way.*
