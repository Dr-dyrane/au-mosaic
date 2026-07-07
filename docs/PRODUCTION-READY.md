# Production readiness, the push to real

Status: landed and deployed. The production substrate and the shell UI on
top of it are both shipped, on `origin/main`, and live. Types and lint are
green (2026-07-06: `npx tsc --noEmit` and `npx eslint src --max-warnings=0`
both clean across the project). What remains is owner-run and operational,
not code: apply the schema on the live database if it has not been, and, if
wanted, run the one-off purge of demo and test data.

Owner decision recorded: the "nothing is ever lost" rule is relaxed. The book
allows select, archive, and permanent delete, with archive as the safe default
and delete guarded by a clear confirmation that names the rows. This amended
the CRM law and `docs/DESIGN.md` G10.

How the destructive work stays safe. The app owns the everyday reversible move
(archive, restore); permanent delete sits behind a consequence confirmation;
the one-off cleanup is a script the owner runs, not a deletion done for him.
Schema changes are run by the owner. The admin shell is shared with CODEX, so
shell wiring landed one hand per file through `docs/AGENT-HANDSHAKE.md`.

## What shipped

### A. A door to the chat reader

A quiet "From WhatsApp" entry now reaches the reader from Home and People, so
the flow no longer depends on the Android share sheet or a typed URL. The path:

    Home -> From WhatsApp -> paste the chat, or add the exported .zip
         -> Read the chat -> check the draft -> Create the quote -> the order

The zip path is one tap: the reader takes the WhatsApp `.zip`, opens it, and
reads `_chat.txt` out of it. On Android the share sheet skips straight to the
draft. The review itself is adaptive: a detent sheet on the phone, an inline
inspector beside the intake on a wide screen, one state feeding both.

### B. Select, archive, delete

Every list room (Orders, People, Deliveries, and enquiries within People) has a
select mode with a floating action bar: Archive, Restore, Delete. Archived rows
drop out of the default lists and the totals; an Archived view brings them back.
Permanent delete confirms in a sheet that names the rows, and every archive and
delete signs the audit log. The data layer adds a nullable `archived_at` to
customers, orders, enquiries, sales_motions, deliveries, and media_assets, with
the customer foreign keys cascading and piece links setting null.

### C. Clear the history, start clean

Settings, then History, carries Clear history, which empties the log after a
confirmation, plus clearing entries older than a chosen date. The clear no
longer logs its own action, so the empty state is truly reachable (the earlier
loop, where clearing wrote a "cleared the history" line and left one row behind,
is fixed). A maintenance script, `scripts/reset-book.ts`, purges the demo and
test data for a clean day one; the owner runs it.

### D. Hardening

The reader flags loose matches: a slug under 0.75 confidence wears "check this
one", and the system prompt reserves high confidence for an unmistakable naming
of the catalogue piece, so a substitute or a guess is never passed unseen. The
three accessibility fixes landed (accessible names on phone tabs, the dead top
nav removed, the duplicate `stock-filter-panel` id split). An admin error
boundary, `src/app/admin/error.tsx`, gives the admin a way back. The copy pass
cut words and plain-named the trade terms, since Nonso reads little.

## Migration note

`drizzle/0011_secret_dazzler.sql` (the `archived_at` columns and the cascade
foreign keys) was applied to the live database with `npx drizzle-kit push`, not
`migrate`. Push does not write drizzle's `__drizzle_migrations` ledger, so a
later `migrate` would try to replay 0011 and fail on a column that already
exists. To make replay harmless, 0011 is now idempotent: every `ADD COLUMN` is
`ADD COLUMN IF NOT EXISTS`, and every `DROP CONSTRAINT` is `DROP CONSTRAINT IF
EXISTS` (the constraints are dropped-if-present then re-added, so the pair is
safe to run twice). This is correct on a fresh database too, where migrate runs
0000 through 0011 in order.

Owner check, if you want the ledger clean: on the Mac, confirm the live schema
has the columns (the admin lists work, so it does), and optionally record 0011
as applied so a future `migrate` skips it rather than replaying the idempotent
version. Not required for correctness now that the SQL is safe to replay.

## Keeping git in sync

The sandbox cannot write git's lock files, so Claude's commits reach
`origin/main` by an object-push (build a tree, commit-tree, push the object)
that advances the remote but not the owner's local ref. After such a push, the
owner's local `main` sits behind origin until synced.

When the tree is otherwise clean, sync with:

    git fetch origin
    git reset --hard origin/main

Do not run `reset --hard` while CODEX has uncommitted work in the tree: it would
discard that work. When both hands have changes in flight, commit only your own
files first (`git add <your files>`, never `add -A`), then `git pull --rebase`.

For this pass specifically, Claude did not object-push, because CODEX had an
uncommitted entry open in `docs/AGENT-HANDSHAKE.md`. The migration hardening and
this doc are left in the working tree for a normal local commit that will not
disturb CODEX:

    git add drizzle/0011_secret_dazzler.sql docs/PRODUCTION-READY.md
    git commit -m "Harden 0011 migration to idempotent; refresh production-ready doc"
    git push origin main

## Coordination

Two hands, one tree. Claude drove the CRM lanes (the AI order reader, archive
and delete, history tools, the adaptive share review); CODEX drives the
visualizer and the public site. Lanes are claimed and released in
`docs/AGENT-HANDSHAKE.md`, newest on top, and neither hand edits the other's
open files. `docs/QA.md` is CODEX's; Claude does not touch it.
