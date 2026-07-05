# The standards list · modern SaaS admin QA

The bar the back office is measured against, checked honestly.
Pass means shipped and verified; Partial means some rooms; Missing
means not built yet. Update the verdicts as passes land.

## Data display

| Item | Verdict |
|---|---|
| Search on growing lists | Pass (customers, orders by name; no-JS GET forms) |
| Filters (status, family) | Pass (orders by status chips; stockroom by family tiers) |
| Pagination on unbounded lists | Pass (customers, settled orders, landed deliveries, fresh enquiries all paged; active work shows whole) |
| Sort control | Pass (customers Newest or A to Z; stockroom shelf order, by name, low first, inside each range; debts stay oldest-first by law) |
| Result counts shown | Pass (customers total, settled count, range book/window counts) |
| Empty states teach | Pass (every room) |
| Loading states | Pass (panel loading.tsx breath) |
| Error states | Pass (panel error.tsx, calm sentence) |
| Zero-data charts degrade | Pass (insights panels teach when empty) |
| Long-text truncation | Pass (truncate on enquiry lines, notes capped) |
| Relative and local dates | Pass (en-NG formats everywhere) |
| Money formatting | Pass (kobo integers, naira() single formatter) |

## Forms and actions

| Item | Verdict |
|---|---|
| Inline validation with sentences | Pass |
| Pending states on submit | Pass (Saving..., disabled) |
| Optimistic where safe | Pass (order status, delivery steps, enquiry clears; adds stay confirmed by design) |
| Server-side auth on every action | Pass (hasSession first line) |
| Server-side input validation | Pass (enums, ints, hex, uuid guards) |
| Idempotent seeds and migrations | Pass |
| No destructive actions | Pass (no hard deletes anywhere, by law) |
| Unsaved-changes warning | Pass (piece record: browser reload and in-app links both ask) |
| Failures keep typed values | Pass (onSubmit transition sidesteps the action auto-reset; add-forms clear on success only) |
| Saves answer accessibly | Pass (Sentence takes focus, role=status; successes fade, failures stay) |
| Keyboard submit (Enter) | Pass (native forms) |

## Navigation and IA

| Item | Verdict |
|---|---|
| Current location visible | Pass (ink + aria-current, gold dot tabs) |
| Primary rooms one tap away | Pass (tab bar, top nav) |
| Back links on subpages | Pass |
| Deep links stable | Pass (slugs, uuids) |
| 404s handled kindly | Pass (uuid guards, maison 404) |
| Badge for attention items | Pass (Owed count) |

## Performance

| Item | Verdict |
|---|---|
| Static where possible, dynamic where honest | Pass (site static, admin force-dynamic) |
| Grouped queries, no N+1 | Pass (sum maps stitched in JS) |
| Images optimised | Pass (AVIF/WebP, Blob host allowed) |
| No client fetch waterfalls | Pass (server components read) |
| Query count per page reasonable | Partial (glance runs 5; layout adds owed count; acceptable at scale, tracked in NEXT-STEPS) |

## Accessibility

| Item | Verdict |
|---|---|
| Labels and aria on inputs | Pass |
| aria-current, aria-pressed, role=status | Pass |
| Focus visible | Pass (house focus rings) |
| Contrast AA | Pass (measured, both suns, four houses) |
| Touch targets 44px | Pass (h-11+, capsules) |
| Reduced motion respected | Pass (global block) |

## Security and trust

| Item | Verdict |
|---|---|
| Signed httpOnly session, timing-safe check | Pass |
| Placeholder password refuses itself | Pass |
| Secrets out of git | Pass (.env ignored, template clean) |
| robots/noindex on admin | Pass |
| Public endpoint hardened | Pass (/api/enquiry: caps, validation, 204 always) |
| Rate limiting | Pass (the door rests after 8 refusals in 10 minutes; the funnel sheds past 30 fresh rows in 10 minutes, still 204; both fail open while schema healing settles) |
| Audit trail | Pass (append-only audit_log; every action signs a sentence; read at Settings, The book's history) |
| Staff accounts | Pass (named keys, HMAC-hashed, owner-only rack; master key stays in the environment; old cookies still verify) |

## PWA and resilience

| Item | Verdict |
|---|---|
| Installable, scoped manifest | Pass |
| Offline fallback | Pass (calm room) |
| Never-stale admin pages | Pass (network-first) |
| Database-down behaviour | Pass (calm panels, badge stays home) |

## Insight quality

| Item | Verdict |
|---|---|
| Business metrics from source of truth | Pass (orders, payments, stock) |
| Trends over time | Pass (six months billed) |
| Actionable warnings | Pass (leak sentence, stock pressure, debt aging) |
| Export (CSV) | Pass (orders.csv and debts.csv, session-guarded GET links, integer-kobo naira, BOM for Excel) |
| Date-range control | Pass (billed window: three months, six months, a year; URL-carried chips) |

## The feel list · the merged UI/UX review

The senior review's ten and the owner's seven, merged, deduplicated,
and tiered by ship order. This is the UI/UX sprint board; move items
up as they land, never delete them.

### Now (the Feel sprint) · SHIPPED, all seven

| # | Item | Size |
|---|---|---|
| 1 | SHIPPED. Sticky Save bar in thumb reach on long forms (piece record first), like the site's piece-bar | M |
| 2 | SHIPPED. Haptics on every mutation: save, status move, delivery step, enquiry clear (buzz pattern from the visualizer) | S |
| 3 | SHIPPED. Press states on every tappable: chips, cards, links; nothing is inert under the finger | S |
| 4 | SHIPPED. Per-room skeletons that mirror the real layout, fade in after 250ms so fast loads never flash, sweep shimmer, reduced-motion safe | M |
| 5 | SHIPPED. Stock filters: desktop chip row (All, Tiles, Materials, Running low, hue dots); mobile glass bottom sheet; all URL-carried | M |
| 6 | SHIPPED. Tabular numerals on all money and counts so naira align digit for digit | S |
| 7 | SHIPPED. Designated CTA law: glance gains New order; the oldest debt wears the ledger's one gold; read-only archives exempt | S |

### Next · SHIPPED, all nine

| # | Item | Size |
|---|---|---|
| 8 | SHIPPED. Doherty threshold: optimistic deliveries and enquiry clears join the status chips; every mutation answers inside 100ms | M |
| 9 | SHIPPED. Success sentences take focus (VoiceOver hears them) and fade after four seconds; failures always keep typed values (submits ride onSubmit transitions so the action auto-reset never eats a field) | S |
| 10 | SHIPPED. Search consistency: type=search everywhere (native clear) | S |
| 11 | SHIPPED. Insights visualisation: inline SVG sparkline on the month bars, delta sentences in words, trailing-3-month pace, honest projection, Steady or Watch chips on the four panels that carry a state (billed, leak, debts, stock) | M |
| 12 | SHIPPED. Zeigarnik open loops: "No lines yet" on enquiry-stage order cards, draft count in the stockroom | S |
| 13 | SHIPPED. Recognition over recall: the glance lists the last three records he touched (his device remembers, the database is never asked) | M |
| 14 | SHIPPED. Refresh affordance in the installed app: "Updated 9:41 · refresh" line on the glance | S |
| 15 | SHIPPED. Functional micro-icon set, six house-drawn inline SVG verbs: back, eye, filter, close, share, refresh; typography stays the identity | S |
| 16 | SHIPPED, both doors. Unsaved-changes guard on the piece record: beforeunload for reload and close, a capture-phase ask on in-app links, saving clears it, choosing to leave is asked once | M |

### Later and ongoing

| # | Item | Size |
|---|---|---|
| 17 | SHIPPED. Sort controls where the fixed sort stopped being enough: customers Newest or A to Z, stockroom shelf order, by name, low first | M |
| 18 | Onyx-night eye pass: photo-slot hints and gold-on-shell pairings in the darkest house | S |
| 19 | Von Restorff guard, standing rule: the gold singleton's isolation is absolute; every new screen is audited against it | ongoing |
| 20 | Peak-end, standing rule: every flow ends on a small satisfying note (tick plus sentence), never on silence | ongoing |

## Error boundaries · the audit (checklist 1, done)

| Item | Verdict |
|---|---|
| Office error room offers a way home | Pass (Try again in gold, Back to the glance, For-the-engineer panel with room, message, digest) |
| Site error room exists | Pass (added this pass: calm line, gold Try again, WhatsApp close; details whisper to the console, never a stack trace) |
| Site 404 | Pass (maison 404: Back to the house, Ask us directly) |
| Office 404 stays in the office | Pass (added this pass: That page is not in the book, gold Back to the glance; uuid guards land here instead of the shop window) |
| Offline room | Pass (calm room, network-first pages, tab bar stays home) |
| Root layout crash fallback (global-error) | Pass (root global-error now carries its own html, body, global styles, calm copy, Try again, and WhatsApp close) |
| Boundaries never swallow auth redirects | Pass (redirect and notFound throw on purpose and live outside every try; the panel layout re-checks the door on every render, so Try again walks back through it) |
| Raw driver shapes normalised at every execute | Pass (one rowsOf, owned by src/db, imported at all four call sites: insights, panel layout, digest; no room maps the envelope itself) |
| Actions answer in sentences, never throw at the UI | Pass (every action catches and returns ok/message; the boundary is the last resort, not the pattern) |

## The API contract · the audit (checklist 2, done)

What each endpoint promises, verified in code. Server actions are
POST endpoints whatever the UI hides; every one re-checks the
session on its first line, validates enums, ints, uuids, and hex,
and answers in a sentence instead of throwing.

| Endpoint | Promise |
|---|---|
| POST /api/enquiry | Always 204, no body, whatever happens: the funnel never feels the back office. Caps: source 40 chars, path 120, sid kept only when it reads as a uuid. Sheds floods past 30 fresh rows in 10 minutes, still 204. Stores no name, number, or message. |
| GET /api/digest | 401 without the cron bearer; {"sent": boolean} with it. Never errors loud: a broken morning answers {"sent": false} and the glance still tells the truth. |
| GET /admin/export/orders.csv, debts.csv | 302 to the login without a session. With one: UTF-8 CSV with BOM, CRLF lines, integer-split naira (never floats), no-store, dated filename. Negative balances print as negatives here on purpose: the accountant wants the credit. |
| GET /admin/compose | 302 everywhere: to login without a session, to the orders room on a bad kind or id, to the order on a missing phone, and to wa.me with the message written when all is well. Signs the history on the way out. |
| GET /admin/share | A page behind the door (layout redirects without a session). Reads title, text, url; matches any 234 or 0-prefixed number; never stores anything until he taps keep. |
| Server actions (all rooms) | hasSession first line, refuse in a sentence. Inputs guarded: enums for statuses and methods, parseNaira for money, uuid regexes for ids, caps on audit strings. redirect and notFound throw outside every try. |

## The domain truths · the audit (checklist 3, done)

| Truth | Verdict |
|---|---|
| Nothing is ever deleted | Pass (zero .delete() calls against the database in the whole tree; statuses and active flags only) |
| Billed is always sum of lines, paid always sum of payments, computed fresh | Pass (no stored balances anywhere; every open recomputes; "never stale by construction") |
| Balance never negative in display | Pass (order page says Settled in full past zero; customer cards say Paid in full; debts filters balance > 0; the glance now clamps its Outstanding at zero, fixed this pass; the CSV alone shows negatives, deliberately, for the accountant) |
| Money is integer kobo, always | Pass (parseNaira is the only entry, naira the only exit, nairaPlain splits digits for CSV; no float arithmetic anywhere on money) |
| Order lifecycle is an enum walk | Pass (five statuses guarded by enum on write; optimistic chips walk back on failure with a sentence) |
| Stock moves only at the door | Pass (crossing into delivered or settled subtracts each line's quantity, clamped at zero; walking back out returns it; delivered to settled moves nothing twice; enquiry to deposit never touches a shelf) |
| Stock movements are audited and speak | Pass (per-line history sentences: taken for a delivery, returned to the shelf; a reorder crossing answers in the save sentence and taps the phone once, guarded by the before-above, after-at-or-below test) |
| Returns correct beside the sale | Pass (a return writes a mirrored line tied to the original line, cannot exceed what remains, restores delivered stock, and settles as customer credit or a negative refund payment) |
| Deliveries walk one step, server-verified | Pass (the action reads true status first; a stale screen cannot push a delivery two steps) |
| Enquiries convert themselves | Pass (opening an order marks that customer's new and replied enquiries converted; attach ties a name without touching status) |
| Settled orders leave the ledger | Pass (debts and the glance exclude enquiry and settled everywhere, including the owed badge) |

## Consequence and confirmation · the audit

Reversible-by-design is the house rule: statuses walk back, archives
reopen, nothing deletes. A confirm is earned only when an action has
physical consequence, stock or money leaving a shelf, and it names
the exact movement in one sentence. Never ceremony.

| Action | Consequence | Verdict |
|---|---|---|
| Order into Delivered or Settled | Stock leaves the shelf | Pass (the house asks first, naming every line: "This takes 20 sheets of Classic pool blues off the shelf. Deliver it?"; gold proceeds with the verb, Not yet stays, Escape stays; the optimistic chip moves only after the yes) |
| Order back out of Delivered or Settled | Stock returns to the shelf | Pass (same card: "This returns 20 sheets of Classic pool blues to the shelf. Move it back?") |
| Order moves with free-text lines only | Nothing physical moves | Pass (no confirm, by design: consequence, never ceremony) |
| Enquiry to Quoted to Deposit | Nothing physical moves | Pass (one tap, reversible, no confirm) |
| Record a payment | Records money that already moved; the row cannot be deleted | Accepted without confirm (a wrong entry is corrected beside it, per law 8; a confirm here would tax every honest entry to guard a rare slip) |
| Record a return | Writes a correction line, restores stock if the order has left, and may record a refund | Accepted without extra confirm (the dedicated form names the line, quantity, and credit or refund choice; the original sale remains beside it) |
| Piece stock edited by hand | Sets the count directly | Accepted without confirm (his own number typed by his own hand, undone by typing the old one; the threshold confirm stays reserved for bulk edits if they ever arrive) |
| Delivery walks a step | The van moves, the shelf does not (stock moves on the order) | Pass (one step forward, server-verified, optimistic, no confirm) |

## The missing list · CLOSED

All six named gaps shipped: pagination at volume (landed deliveries,
fresh enquiries), sort controls, CSV export for the accountant,
the insights date window, rate limiting on the door and the funnel,
and the audit trail that arrived with staff accounts, per CRM law 8.
The unsaved-changes guard shipped earlier with feel item 16. New
gaps join a new list when they earn a name.

Schema healing retired the db:push errand. staff, audit_log,
push_subscriptions, media_assets, and card slots ride with the deploy
through instrumentation. If healing cannot reach the book, the rooms
fail open and teach rather than crashing.
