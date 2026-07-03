# The standards list · modern SaaS admin QA

The bar the back office is measured against, checked honestly.
Pass means shipped and verified; Partial means some rooms; Missing
means not built yet. Update the verdicts as passes land.

## Data display

| Item | Verdict |
|---|---|
| Search on growing lists | Pass (customers, orders by name; no-JS GET forms) |
| Filters (status, family) | Pass (orders by status chips; stockroom by family tiers) |
| Pagination on unbounded lists | Partial (customers paged; settled orders paged; enquiries capped at 12; deliveries unpaged) |
| Sort control | Missing (fixed sensible sorts only: newest first, oldest debt first) |
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
| Optimistic where safe | Partial (order status only, by design) |
| Server-side auth on every action | Pass (hasSession first line) |
| Server-side input validation | Pass (enums, ints, hex, uuid guards) |
| Idempotent seeds and migrations | Pass |
| No destructive actions | Pass (no hard deletes anywhere, by law) |
| Unsaved-changes warning | Partial (piece record, browser-level) |
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
| Rate limiting | Missing (acceptable at current scale; revisit with traffic) |
| Audit trail | Missing (arrives with staff accounts, per CRM.md) |

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
| Export (CSV) | Missing |
| Date-range control | Missing (fixed windows for now) |

## The feel list · the merged UI/UX review

The senior review's ten and the owner's seven, merged, deduplicated,
and tiered by ship order. This is the UI/UX sprint board; move items
up as they land, never delete them.

### Now (the Feel sprint)

| # | Item | Size |
|---|---|---|
| 1 | Sticky Save bar in thumb reach on long forms (piece record first), like the site's piece-bar | M |
| 2 | Haptics on every mutation: save, status move, delivery step, enquiry clear (buzz pattern from the visualizer) | S |
| 3 | Press states on every tappable: chips, cards, links; nothing is inert under the finger | S |
| 4 | Per-room skeletons that mirror the real layout (stock as range headers plus card pairs, record as photo panel plus form blocks), fade in after 250ms so fast loads never flash, sweep shimmer, reduced-motion safe | M |
| 5 | Stock filters: desktop chip row (All, Tiles, Materials, Running low, hue dots bucketed from first colour); mobile Filter chip opens a glass bottom sheet with big touch rows; all URL-carried | M |
| 6 | Tabular numerals on all money and counts (font-variant-numeric) so naira align digit for digit | S |
| 7 | Designated CTA law: Title (what), one line (why), one gold (do), content (explore). Glance gains New order; Who owes what gains gold on the oldest debt's reminder; read-only archives exempt | S |

### Next

| # | Item | Size |
|---|---|---|
| 8 | Doherty threshold: every mutation answers visibly inside 100ms; optimistic deliveries and enquiry clears join the status chips | M |
| 9 | Success sentences take focus (VoiceOver hears them) and fade after a few seconds; failures always keep typed values | S |
| 10 | Search consistency: type=search everywhere (native clear), pending affordance while the page answers | S |
| 11 | Insights visualisation: inline SVG sparklines, delta sentences in words ("June up 34% on May"), trailing-3-month pace, honest projection ("If the pace holds: ₦X this month"), Steady or Watch state chips per panel | M |
| 12 | Zeigarnik open loops: "No lines yet" badge on enquiry-stage order cards, draft count in the stockroom; unfinished work pulls him back | S |
| 13 | Recognition over recall: the glance lists the last three records he touched, so morning starts where yesterday ended | M |
| 14 | Refresh affordance in the installed app: quiet "Updated 9:41 · refresh" line on the glance (standalone hides the browser reload) | S |
| 15 | Functional micro-icon set, six at most, house-drawn inline SVG (back, eye, filter, close, share, refresh); typography stays the identity; icons only for verbs the thumb knows | S |
| 16 | Unsaved-changes guard on long forms | SHIPPED at browser level on the piece record (beforeunload when dirty, cleared by Save); in-app nav guard remains | M |

### Later and ongoing

| # | Item | Size |
|---|---|---|
| 17 | Sort controls where the fixed sort stops being enough | M |
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

## The missing list, prioritised

1. Pagination for deliveries and enquiries when volume demands it.
2. Sort controls where the fixed sort stops being enough.
3. CSV export (orders, debts) for his accountant.
4. Date-range picker on insights.
5. Unsaved-changes guard on long forms.
6. Rate limiting and audit trail, with staff accounts.
