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
| Unsaved-changes warning | Missing |
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

## The missing list, prioritised

1. Pagination for deliveries and enquiries when volume demands it.
2. Sort controls where the fixed sort stops being enough.
3. CSV export (orders, debts) for his accountant.
4. Date-range picker on insights.
5. Unsaved-changes guard on long forms.
6. Rate limiting and audit trail, with staff accounts.
