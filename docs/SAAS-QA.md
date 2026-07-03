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
| Query count per page reasonable | Partial (glance runs 5; layout adds owed count; acceptable at scale, watch it) |

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
| Rate limiting | Pass (the door rests after 8 refusals in 10 minutes; the funnel sheds past 30 fresh rows in 10 minutes, still 204; both fail open before db:push) |
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

## Checklists to write next (owner's ask, stacked)

1. Error-boundary audit: every boundary offers a way home, never a
   dead end; boundaries never swallow auth redirects; raw driver
   result shapes (rows vs array) normalised at every execute call.
2. API contract checklist: response shapes, status codes, input caps,
   and what each public endpoint promises the funnel.
3. CRM domain checklists: order lifecycle edge cases, stock movement
   truths, money reconciliation (billed = lines, paid = payments,
   balance never negative in display).

## The missing list · CLOSED

All six named gaps shipped: pagination at volume (landed deliveries,
fresh enquiries), sort controls, CSV export for the accountant,
the insights date window, rate limiting on the door and the funnel,
and the audit trail that arrived with staff accounts, per CRM law 8.
The unsaved-changes guard shipped earlier with feel item 16. New
gaps join a new list when they earn a name.

One owner errand: run npm run db:push once, so the staff and
audit_log tables land. Until then the key rack and the history
teach the command, the door cannot count refusals, and every
logAction is a quiet no-op. Nothing errors either way.
