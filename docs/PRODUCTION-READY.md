# Production readiness, the push to real

Status: substrate landed, on the owner's push to make the back office
production ready. A fleet of agents built the safe, additive base for all four
workstreams (2026-07-06): the reader door (A), the archive/delete data plus
actions plus migration (B, schema landed, selection UI pending), the
history-clear action plus purge script (C, tools landed, Settings button
pending), the confidence tuning, and the launch audit `docs/PROD-AUDIT.md` (D).
Types and lint are green. What remains is the shell UI wiring, coordinated with
CODEX, plus the owner running the migration and, if wanted, the purge script.

Owner decision recorded: the "nothing is ever lost" rule is relaxed. The book
will allow select, archive, and permanent delete, with archive as the safe
default and delete guarded by a clear confirmation. This amends the CRM law and
`docs/DESIGN.md` G10; both are updated to match when workstream B lands.

How this gets done safely. I build the tools; the owner runs the destructive
step. Wiping records or history is permanent, so the app gets a clear button and
any one-off cleanup gets a script the owner runs, rather than me deleting data
directly. Schema migrations are run by the owner. The admin shell and its list
screens are CODEX's lane, so shell wiring lands in step through the handshake.

## A. A door to the chat reader (the flow you asked about)

Today there is no visible path from Home to reading a WhatsApp chat or its zip.
The reader lives at `/admin/share` and is reached only two ways: the Android
share sheet (share the chat straight into the installed app), or by typing the
URL. On iPhone and desktop there is no button. That is the gap.

The fix: a quiet "From WhatsApp" entry, as a hairline link on Home and on
People, and as a secondary room in the sidebar's lower group. The flow becomes:

    Home -> From WhatsApp -> paste the chat, or add the exported .zip
         -> Read the chat -> check the draft -> Create the quote -> the order

The zip path is one tap: on the reader, "Or the exported file" takes the
WhatsApp `.zip`, opens it, and reads `_chat.txt` out of it. On Android, the
share sheet skips straight to the draft.

## B. Select, archive, delete

The everyday action is archive: the record leaves the working list but is not
lost, and can be restored. Permanent delete sits behind a consequence
confirmation that names what goes, for when a record must truly disappear.

- Data: add `archived_at` to customers, orders, enquiries, sales_motions,
  media_assets, and deliveries. Archived rows drop out of the default lists and
  the totals; an "Archived" filter brings them back. Permanent delete removes
  the row and its children (order items, payments, deliveries already cascade;
  customers gain a guarded cascade through their orders and enquiries).
- Screens: a select mode on each list (Orders, People, Stock, Media, Owed,
  Deliveries, Enquiries) with a small action bar: Archive, Restore, Delete.
- Guardrail kept: delete confirms in a sheet that names the exact rows and any
  children; every archive and delete signs the audit log. This is the shell's
  own consequence pattern, now applied to removal.
- Migration: a Drizzle migration the owner runs. The selection UI is the admin
  shell, so it lands in step with CODEX.

## C. Clear the history, start clean

The audit history has filled with build and test entries. Production wants a
clean book.

- In app: Settings, then History, gains "Clear history", which empties the log
  after a confirmation, plus an option to clear entries older than a chosen
  date.
- One-off: a maintenance script the owner runs once to purge the demo and test
  data (the "Sample" customers, the DEMO-tagged rows, the test chat order) and
  reset the log, so day one is clean. I write it; the owner runs it.

## D. Production hardening checklist

- Every room's states present: empty, loading skeleton, error with a way back,
  offline, pending, async-announced.
- The three open accessibility fixes: accessible names on phone tabs, remove the
  dead top nav, dedupe the stock filter id.
- Tune the reader's confidence so loose matches wear "check this one" (seen in
  testing: pool cement matched White cement at full confidence).
- Secrets present and server-only: DATABASE_URL, CLAUDE_API_KEY,
  BLOB_READ_WRITE_TOKEN, push keys. None in the browser bundle.
- A green gate before ship: tsc, eslint, theme-check, and a production build,
  across the six palettes and both suns.
- Remove dev-only cruft; confirm the manifest, icons, and offline shell.

## Sequence

1. The chat-reader door (A), small and high value.
2. Clear history and purge test data (C), so the book reads clean.
3. Select, archive, delete (B), the big one: schema first, then the screens with
   CODEX.
4. The hardening sweep (D), then the green gate.

Each step is verified by types and lint, and the destructive ones by the owner
running the migration or the button.
