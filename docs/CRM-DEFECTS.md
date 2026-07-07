# CRM defect register

A depth audit, not the capability audit. Three adversarial hunts (money and
integrity, security and auth, failure and reliability) went looking for real
bugs on the assumption they exist. They do. This is the deduped, severity-ranked
register with the fix and, where relevant, a flag for a decision or a migration
the owner runs. The capability benchmark said little was missing; this says
several things are wrong inside what exists. Both are true.

## Critical

### C1. Deleting a customer silently destroys their whole money history
`records/actions.ts` hard-deletes, and the foreign keys cascade: one customer
takes all their orders, payments, deliveries, enquiries, and sales motions with
them. The confirmation says only "Delete 1 for good?", the count of selected
customers, never the cascade. The owner deletes far more than the screen shows,
and the audit line records neither the name nor the magnitude.
Fix: before deleting, count the dependent orders, payments, and deliveries for
the selected ids and name them in the confirmation ("this also removes 4 orders
and 9 payments, cannot be undone"). Record the names and cascade counts in the
audit detail. Prefer routing owner-facing removal to archive; reserve hard
delete.

## High

### H1. Staff can permanently delete the ledger and wipe its trail
`deleteRecords`, `clearHistory`, and `clearHistoryBefore` gate on `hasSession()`,
not `ownerOnly()`. Any staff key can hard-delete records and then erase the audit
log. Worse, `clearHistory` writes no audit line at all, though its own docstring
promises the wipe signs its name, so a history erase leaves zero trace of who did
it. Decision needed: are staff meant to be limited here.
Fix: gate `deleteRecords`, `clearHistory`, and `clearHistoryBefore` with
`ownerOnly()`; have the clear write one line after emptying, so the fresh log
opens with the wipe itself. (This reconciles the earlier loop fix, which
over-corrected by removing the line entirely; the honest empty state is one
line that says he cleared it, not zero.)

### H2. The same customer shows different money in different rooms
"Owed" is recomputed in about eight places with divergent filters, so the ledger
disagrees with itself:
- Archived orders are excluded from the glance, digest, attention, and the
  offline kit, but included in the Debts room, the Debts CSV, and Insights aging.
  Archive one unpaid order and the debt vanishes from some rooms and persists in
  others.
- The customer's own record counts every status, including enquiry and settled
  and archived, so an enquiry with priced lines shows as owed on the record while
  the Debts room, digest, and glance show nothing.
- The home Outstanding nets credits globally: one customer's overpayment cancels
  another's debt, so Home can read zero outstanding while its own owing-customers
  count is one and the Debts room shows a real balance.
Fix: define the debt once. One shared balance rule (status not in enquiry or
settled, archived is null, clamp each order or customer positive before summing)
used by every surface. Highest-value correctness fix.

### H3. Online payments and returns are not idempotent
The offline sync path was made safe with a client op id and on-conflict-do-
nothing, but the everyday online `addPayment` and `addReturn` never got parity.
A double-tap on a flaky connection, or a retried action, records the payment
twice, so the order reads paid in full while the customer still owes. A double
return is worse: two return lines, two refund payments, stock restored twice.
Fix: give the online forms a client op id (a hidden UUID, regenerated on
success) and insert with on-conflict-do-nothing, mirroring the sync route. Wrap
`addReturn`'s writes in a batch.

### H4. Money overflows on a large job and the query crashes
Money columns are 32-bit integers, capped at about twenty-one million naira. The
balance queries compute given-price times quantity as 32-bit before the widening
cast, so a single large pool job (say a hundred sheets at a quarter million)
overflows to a Postgres integer-out-of-range error. On the read pages that
throws the room to the error boundary; on the glance it is swallowed and the
five numbers read all zeros, a falsely calm house. A single line over twenty-one
million naira cannot even be saved. Migration needed.
Fix: store money as bigint, and cast the multiplicands to bigint inside every
aggregate. Add an upper bound in `addLine` and `addPayment`.

### H5. The schema healer is frozen before the archive migration
`db/heal.ts` claims deploys heal their own schema, but its DDL stops at the
pre-archive era and adds none of the six `archived_at` columns from migration
0011, and its probe never checks for them. A fresh Neon branch or preview
database relied on the healer would be missing all six columns, and the probe
would still report the book current. Then attention, the glance, orders,
customers, records, and the snapshot all throw, several of them silently.
Fix: append the six add-column-if-not-exists statements and an archived_at probe
check, or keep running drizzle migrations and drop the heal-replaces-push claim.

### H6. One failed attention query hides every overdue item
`attention.ts` wraps all four "needs your eye" queries in one try that returns an
empty list on any error, and the glance shows the strip only when the list is
non-empty. So a single failing query (for example the schema drift in H5) hides
overdue debts, waiting enquiries, and past-due deliveries with no error, the
falsely calm house again.
Fix: guard each query independently so one failure drops only its own item.

## Medium

### M1. Multi-step money writes are not atomic
`addReturn` (return line, refund payment, stock, order touch) and `setStatus`
(status then the per-piece stock loop) are separate writes with no transaction.
A connection drop mid-sequence leaves a return with no refund, or a delivered
status with only some stock moved, and the generic catch hides the partial
write. Fix: group each action's writes with `db.batch`.

### M2. A refund is not clamped to what was paid
A return settled as refund inserts a negative payment for the full return value
with no check that the money was ever received. Refund a return on an unpaid
order and paid goes negative, the balance inflates, and the invoice shows a
phantom refund. Fix: clamp the refund to the current paid balance, or block
refund when nothing was paid.

### M3. Unbounded queries that grow with every order line
The offline snapshot loads every order line into memory on each pull; Insights
top-pieces and leak are all-time full scans on every load; the Debts and Orders
lists group all-time on every view. These grow forever with `order_items`. Fix:
window the insights scans, precompute or limit per-order balances, and use a
distinct-on lookup for the snapshot's last given price.

### M4. Login throttle fails open and is global
The eight-in-ten-minutes login brake reads a count that returns zero on any
audit-table error, so during a database hiccup owner-password guessing is
unlimited; and it counts all refusals globally, so eight bad tries lock out the
real owner. Fix: fail closed on the count error, and track attempts per address.

### M5. The visualizer AI endpoint is unauthenticated and unthrottled
`/api/visualizer/analyze` accepts anonymous posts and forwards each image to the
paid vision model with no rate limit. A loop of one-megabyte images runs up the
Anthropic bill. Fix: a per-address and global rate limit plus a small daily
budget kill-switch.

### M6. CSV exports are open to formula injection
The export cells do not neutralize a leading equals, plus, minus, or at sign, and
customer names and notes flow in from the public share target and AI-parsed
chats. A crafted name executes when the accountant opens the file in a
spreadsheet. Fix: prefix any cell starting with those characters.

### M7. No customer de-duplication
Phone is the key, but there is no unique index and create paths insert blindly,
so one person readily becomes two records with a split balance. Fix: look up by
normalized phone on create and attach or warn; add a partial unique index.
Migration for the index.

### M8. A failed public enquiry is lost silently
`/api/enquiry` swallows a failed insert and returns success, so a real lead can
vanish with no trace. Fix: at least count the failure, or retry once.

## Low

- Legacy two-part owner cookie has no role or version binding; not forgeable
  without the secret, but add version prefixes and sunset it.
- The cron secret is compared non-constant-time; use a timing-safe compare.
- No upper bound on quantity or amount beyond positivity; cap them.
- The `rowsOf` neon-http convention is enforced only by discipline; one forgotten
  call site crashes. Consider a lint note.
- The public catalogue and `logAction` swallow errors by design; acceptable, but
  a missing audit line on a real payment is a provenance gap worth a retry.

## What is genuinely clean (checked, not assumed)

Stock movement uses a compare-and-swap so concurrent status changes cannot double
decrement, and returns never double-restore. The offline sync payment path is
properly idempotent, the model the online path should copy. SQL injection: none,
every raw interval is a code-supplied whitelist value and all user input is
parameterized. Secret handling: clean, nothing logged or bundled to the client.
Session HMAC and timing-safe compares are sound. Error boundaries cover every
room, so nothing white-screens. Server-to-client function props are currently
clean after the insights fix, with one latent landmine if `charts.tsx` ever
becomes a client component.

## Decisions the owner makes

- Staff permissions (H1): should staff be blocked from hard delete and history
  wipe. Recommended yes.
- Money to bigint (H4): a schema change plus a `drizzle-kit push`. Recommended,
  the business sells large pool jobs.
- Dedupe index (M7): a partial unique index, a push.

## Proposed fix order

1. Correctness and safety first, no migration: H2 (one balance rule), H3 (online
   idempotency), C1 (delete cascade surfacing), H6 and M1 (attention resilience
   and batched writes), H1 (owner-only on destructive actions plus the clear
   logs itself), M2 (refund clamp), M6 (CSV guard), H5 (heal catches up).
2. Then the migrations, on the owner's go: H4 (bigint money), M7 (unique phone).
3. Then hardening: M3 (bounded queries), M4 (throttle), M5 (AI endpoint limit),
   M8 (enquiry retry), and the first tests (money math, balance consistency,
   idempotency, the parser, the auth gate).
