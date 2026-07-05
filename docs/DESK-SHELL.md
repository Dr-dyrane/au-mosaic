# The Desk Shell

Date: 2026-07-05.
Status: target law for the next back-office UI pass.
Scope: `/admin` shell, room navigation, context surfaces, responsive
behavior, and final QA gates.

This document exists before code changes. It freezes the UI/UX goal so
the next build has a measured target instead of taste drift.

## HIG Anchors Checked

Official Apple Human Interface Guidelines pages checked on 2026-07-05:

- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
  for adaptive structure across contexts and devices.
- [Navigation and search](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search)
  for clear wayfinding and retrieval.
- [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)
  for leading-side top-level rooms on wide screens.
- [Split views](https://developer.apple.com/design/human-interface-guidelines/split-views)
  for adjacent panes that keep related content together.
- [Disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls)
  for revealing related detail only when it earns attention.
- [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
  for depth, layering, and foreground-background hierarchy.

We adapt the principles, not the costume. The result must feel native
in calm, hierarchy, and response. It must still sound like AU Mosaic.

## North Star

The owner opens the back office and knows three things in one glance:

- Where am I?
- What is this room asking from me?
- What is the next honest action?

The shell is successful when desktop feels decluttered by context, tablet
feels balanced, and phone still feels one-handed and direct.

## Product Definition

The Desk Shell is an adaptive workspace with three possible surfaces:

- Rooms rail: where the owner is.
- Work canvas: what the owner is doing.
- Context rail: why this item matters now.

On phones, those surfaces collapse into one column. The context rail
becomes a sheet, a disclosure, or a lower section inside the active room.
The phone never carries desktop furniture.

## Non-Negotiables

- The piece record remains the heart.
- WhatsApp remains the channel.
- The CRM remains memory, not chat.
- The showroom remains a promise, not a client archive.
- One room does one job.
- One gold action owns each surface.
- Every visible word is shop-floor language.
- Technical setup never leaks into the owner UI.
- The shell must respect all six houses and both suns.
- Nothing in the shell may make the public site feel separate.

## Primary Users

| User | Context | Need |
|---|---|---|
| Owner, phone in hand | Market, customer chat open | Answer stock, price, debt, or order status in under ten seconds. |
| Owner, shop counter | Customer standing nearby | Create or update a record without breaking conversation. |
| Owner, desk or tablet | Quiet review time | See context without opening five pages. |
| Staff key | Narrow operational work | Do assigned room work without owner-only distractions. |
| New hand | First week in the app | Learn by labels, empty states, and the tour. |

## Responsive Doctrine

### Phone

- Keep the bottom room bar.
- Keep one column.
- Keep primary action near the thumb.
- Show record context as a sheet, disclosure, or later section.
- Hide the rail.
- Hide the inspector until requested.
- Avoid horizontal panes.
- Never require hover.

### Tablet

- Use a compact rail when width allows.
- Use two panes when the second pane reduces navigation.
- Let context become a drawer or a trailing panel.
- Keep forms readable with thumb-safe action bars.
- Avoid cramped three-pane layouts.

### Desktop

- Use a persistent leading room rail.
- Use the center as the work canvas.
- Use a trailing context rail only when it changes the decision.
- Keep the canvas calm and readable.
- Move house controls out of the footer into the shell.
- Avoid a top-row nav that grows with rooms.

## Pane Contract

### Rooms Rail

The rail is for places, not chores.

Primary rooms:

- Home
- Stock
- Orders
- People
- Owed
- Deliveries
- Photos
- Insights
- Settings

Secondary links may sit low in the rail:

- The site
- Take the tour
- Sign out
- House and sun controls

Badges are rare. Owed may carry a count. Fresh enquiries may carry a
small attention mark after the first shell pass proves it is calm.

### Work Canvas

The canvas is the page's job. It owns the title, filters, lists, forms,
and the one primary action for that room.

The canvas must not become a dashboard of unrelated panels. If a panel
does not help the room's job, it belongs in context or nowhere.

### Context Rail

The context rail is an inspector, not a second page.

It answers only three questions:

- Why does this record matter now?
- What is connected to it?
- What is the next quiet move?

It must never duplicate the canvas. It must never host bulk work. It
may carry one gold action only when the canvas has none.

## Context By Room

| Room | Context should show | Context should not show |
|---|---|---|
| Home | Today pulse, last touched, oldest open loop | A second dashboard |
| Stock | Stock pressure, live site state, photo state | Full edit form |
| Piece record | Window status, card photos, low-stock warning, recent orders | A miniature stockroom |
| Orders | Customer, balance, stock impact, quote and receipt exits | Every order in the pipeline |
| Order record | Payments, returns, delivery consequence, WhatsApp send-out | New customer management |
| People | Fresh enquiry, last order, outstanding balance | Full order history table |
| Customer record | WhatsApp, open motions, balance, recent orders | A message inbox |
| Owed | Oldest debt, reminder wording, recent payment | All settled history |
| Deliveries | Driver, address, order stock status | Order editing |
| Photos | Linked piece, use, light, live state, proof state | Storage keys |
| Insights | Metric explanation, next review action | Raw analytics |
| Settings | Key scope, house facts, audit trail route | Owner secrets |

## Visible Language Guardrail

These words must not appear in owner-facing UI:

- batch
- blob
- migration
- table
- row
- media asset
- schema
- canonical
- insert
- seed
- wire
- rollback

Allowed replacements:

| Internal idea | Owner-facing phrase |
|---|---|
| media asset | photo |
| live card slot | product display |
| window scene | room example |
| draft | draft |
| approved | approved |
| wired | live |
| blob upload | uploaded photo |
| linked piece | connected piece |
| batch | prepared set, only if the owner already sees it as a set |

If the visible phrase needs an explanation, the UI is still leaking.

## Use-Case Coverage

Every implementation pass must walk these flows at phone and desktop
widths.

| Flow | Entry | Required outcome |
|---|---|---|
| Stock answer | Stock or piece context | Owner can answer availability and price from one screen. |
| New order | Home or customer | Customer, lines, given price, payment, and WhatsApp receipt stay clear. |
| Debt reminder | Owed or customer | Oldest debt and reminder path are visible without hunting. |
| Fresh enquiry | People | Owner can tie, convert, clear, or open WhatsApp. |
| Product display | Photos or piece | Owner can see draft, approved, and live product photos in plain language. |
| Room proof | Photos or home bridge | Installed-context proof stays showroom proof, not a client archive. |
| Sample motion | Customer | Showroom visit, sample pictures, site sample, quote, and materials list are visible. |
| Delivery step | Delivery or order | Stock consequence is named before physical movement. |
| Offline or quiet database | Any room | The screen teaches and does not expose machinery. |
| Staff key | Any room | Staff can act without owner-only noise. |

## Visual Guardrails

- Use the existing type ramp only: 11, 12, 14, 16, 20, 26, and the
  three display classes.
- Use capsules for interactive chrome.
- Use 28px squircles for panels.
- Use 22 to 26px squircles for media.
- Use 40px inset bands only where a section needs its own ground.
- Use no borders, no hairlines, and no hard dividers.
- Use whitespace, imagery, and lucent material for separation.
- Use no nested cards.
- Keep one gold action per viewport or pane.
- Keep text short enough to survive phone widths.
- Keep native focus rings and AA contrast in every house.
- Respect reduced motion everywhere.

## Premiumness Checklist

Before a shell change can ship, every answer must be yes:

- Does this feel like one back room of the maison?
- Can a phone user do the main job without seeing a sidebar?
- Does desktop gain clarity from the context rail?
- Is every visible word something Nonso would understand?
- Is there exactly one primary action in the active surface?
- Does the layout avoid generic SaaS blocks?
- Does the context rail remove a tap or a scroll?
- Does the interface still breathe in Onyx night and daylight?
- Does the page feel native at 390, 768, 1024, and 1440 widths?
- Can the owner finish the flow without reading instructions?

## Implementation Guardrails

- Start with a shared room model.
- Build a shell component before redesigning rooms.
- Keep data access in `src/lib` or the room server component.
- Keep primitives in `src/app/globals.css`.
- Keep pages as composition.
- Do not change the database for shell chrome.
- Add context adapters one room at a time.
- Do not move product truth away from the piece record.
- Do not replace the phone tab bar until evidence says it hurts.
- Do not add a dependency for layout, motion, or disclosure.

## Build Order

1. Create the shared room model and shell skeleton.
2. Move house controls into shell chrome.
3. Keep the phone tab bar and prove no regression.
4. Add the desktop rail.
5. Add an empty context rail with home context.
6. Add piece and order context adapters.
7. Add people, debts, deliveries, and photos context adapters.
8. Run visual QA across widths, houses, and suns.
9. Update `docs/QA.md` with screenshots or measured evidence.

## Final Acceptance

The back office passes when a stranger can open it on an iPhone, iPad,
and Mac-sized viewport and feel one product, not a responsive website
trying to imitate three products.

It passes when a designer cannot point to a generic dashboard habit.

It passes when the owner can run the day's work from the phone and
review the day's context from the desk without learning two systems.

It passes when the only brand he feels is AU Mosaic, and the only platform
discipline he feels is Apple calm.
