# Offline, the field kit

The back office should work when the network does not. Nonso is often in the
field: a site visit, a delivery, a showroom with a customer standing in front
of him and one bar of signal. This is how the installed app shows last-known
facts and captures a few safe actions while offline, then syncs when the network
returns, without ever quietly showing a stale number as if it were current.

Scope delivered: read plus queued safe writes (Tier 2), with loud last-known
labels. Phases 1 through 4 landed. Status is built and verified, types and lint
clean. The one owner step to make writes live is noted at the end.

## The reality this had to fit

The admin is 26 rooms, 24 of them dynamic server components that read Neon
directly, with about 71 server-action mutations and no client-side data layer.
The server component is the data fetch. So offline is not a switch on the
existing pages; it is a second, client-readable path that fills while online
and is read when the network is gone. The public shop window stays out of this
entirely; the service worker scope is `/admin` only, as it is today.

The law we keep: online is authoritative and unlabeled; offline is shown as
last-known, stamped with the time it was saved, and no write that depends on a
precise current figure finalizes offline. Staleness is made loud, not hidden.

## The pieces

### 1. The snapshot (what we cache to read)

A single auth-gated route handler, `GET /admin/api/snapshot`, returns a compact
JSON of the field-critical facts, each carrying a server `capturedAt`:

- Customers who matter: name, phone, area, current balance owed, last order date.
- Open orders: customer, status, billed, balance, created date.
- Deliveries in a window: customer, status, scheduled date, address.
- Stock low list, plus a light catalogue (slug, name, last given price) so a
  draft can be built.
- Fresh enquiries: customer, message snippet, date.

It is bounded on purpose: open orders plus a short tail of settled, active
customers, deliveries in a near window. For this business that is hundreds of
rows, comfortable for IndexedDB. It inherits the same admin auth as every other
admin route; nothing more sensitive than the rooms already show is cached.

### 2. The mirror (filling the cache while online)

A small client module and a mounted client component, sibling to the existing
`AdminSw`, fetch the snapshot into IndexedDB on admin load, on focus, on an
interval, and after a reconnect. It records `capturedAt`. IndexedDB, not the
Cache API, because this is structured data we render, not cached responses. The
wrapper is thin and hand-rolled to match the no-dependency house style; the
service worker and the zip reader are both hand-rolled too.

### 3. The last-known view (reading offline)

The `/admin/offline` page, once a calm empty "Offline" room, is now the field
kit: a client view that reads the last snapshot from IndexedDB and renders Owed,
Orders, Deliveries, and Contacts as last-known, under a loud gold header,
"Last known, saved 9:14am." When the network is gone and any `/admin`
navigation fails, the service worker serves this one shell rather than each
room. The 26 rooms stay unchanged; we did not rewrite them to be offline aware.
Numbers appear with their last-known stamp, honoring the decision to label
rather than blank.

One gotcha handled: a client shell needs its own JS chunks cached to render
offline. On first online load the mirror pre-warms the shell, fetching
`/admin/offline` so the worker caches its HTML and static chunks, on top of the
worker's existing cache-on-success for `/_next/static/`.

### 4. The outbox (capturing safe writes offline)

An IndexedDB `outbox` store holds queued actions: each entry is a client-made op
id, a type, a payload, and a created time. The safe-write set is deliberately
just two actions, the two that are both safe and valuable while offline:

- Record a payment against an open order. The amount is a delta the server
  balance absorbs at sync time, never a stale cached total.
- Mark an out-for-delivery delivery as landed. An idempotent state move.

Offline, the safe-write control writes to the outbox instead of calling the
server action, and the item wears a gold "pending" mark with a count, "2
waiting to sync." The mirror replays the outbox on reconnect.

### 5. What stays online only, and why

Two actions that live near the safe set were kept online only, as a considered
decision, not a gap:

- Adding a note. A text-field append has no idempotent home without a dedicated
  notes table, and a replay would duplicate the text. It stays where it already
  works, online.
- Drafting an order from a chat. The extraction needs the model over the
  network, so it cannot run offline at all. It stays online.

Destructive or precision-dependent controls (delete, archive, price edits) are
online only for the same family of reasons and disable offline with a quiet
"needs connection" note.

### 6. Idempotency (why a replay cannot double apply)

The two safe writes reach the server through auth-gated sync routes that wrap the
same logic as their server actions. Each is made safe to retry through a flaky
reconnect in the way that fits it:

- Record-payment is idempotent by a client op id. The payments table gained a
  nullable `client_op_id` column with a unique index. Nulls stay distinct under
  that index, so online payments, which carry no op id, are unaffected. The sync
  route inserts with `ON CONFLICT DO NOTHING`, so replaying the same id is a
  no-op and a payment cannot double apply.
- Mark-delivered is idempotent by state. It only lands a delivery that is still
  "out", read from the database at sync time, so it needs no id ledger at all.

The correctness principle in one line: we only ever queue an append or a state
move, never a computed total, so a queued action is correct whatever the server
balance turns out to be at replay.

### 7. The sync (replaying on reconnect)

A client flush runs on load, on focus, and on the `online` event. That is the
universal baseline, and it is what iOS Safari uses, since Safari has no
Background Sync. This matters because Nonso may be on an iPhone.

Where the Background Sync API exists, on Android Chrome, queuing also registers a
sync so the service worker can flush after reconnect even if the app is closed.
The idempotent routes make the overlap between the worker flush and the client
flush safe: if both fire, the second is a no-op.

### 8. When a replay cannot apply

If the target changed while offline (an order was settled or removed), the sync
route returns a clear per-op result rather than failing silently or guessing.
The field kit is honest about the two outcomes and keeps them apart: "N waiting
to sync" is one line, "N could not apply" is another. The full review of the
could-not-apply items, with a way to dismiss them or sync now, lives in
Settings, reachable online. Nothing is lost; the owner decides.

## Phases, as shipped

1. Read path: the snapshot endpoint, the IndexedDB wrapper, the mirror, and the
   field-kit view with loud last-known stamps. Ships offline reading on its own.
2. Outbox plus record-payment: queued offline, its idempotent sync route, flush
   on reconnect, the pending and synced states. Proves the whole pattern.
3. Mark-delivered on the proven pattern; note and draft-order settled as online
   only, for the reasons in section 5.
4. Hardening: Background Sync with the iOS fallback, the could-not-apply review
   in Settings, the `client_op_id` unique index, and the green gate.

Each phase was gated by types, lint, and a dash scan.

## The one owner step to make writes live

Run `npx drizzle-kit push` on the Mac to add the `client_op_id` column and its
unique index. Until that runs, queued payments hold and retry safely; nothing is
lost. drizzle-kit could not run in the build sandbox because the mounted esbuild
binary is macOS-native, so no migration file was generated. Push reads
`schema.ts` directly, which is the owner's established workflow, so this is a
push, not an applied migration file.

## Coordination

The service worker `public/admin-sw.js` is shared admin infra, so the offline
lane was claimed in `docs/AGENT-HANDSHAKE.md` before its code changed, and the
worker edit landed one hand at a time. CODEX's visualizer and public-site lanes
are untouched by any of this; the scope stayed `/admin`.
