# Production audit, the /admin back office

Read-only punch list for a clean launch of the `/admin` back office. Each item is `path, problem, fix`. Priorities: P0 blocks launch, P1 should land before launch, P2 is polish. Verified against the working tree on 2026-07-06, not against the handshake, which has drifted. Lint (`npx eslint src --max-warnings=0`) passes clean, zero warnings. Types (`tsc --noEmit`) surfaced no errors in this pass.

Summary: the back office is in strong shape. Secrets are server-only (no P0 leak), state coverage is close to complete, and two of the three named accessibility issues are already fixed in code. What remains is one true duplicate DOM id, one missing error boundary for the invoice route, a stale doc punch list, and a small set of lower-risk finish items.

## P0, blocks launch

None found. The known blocker candidates were checked and cleared:

- Secret safety, all clear. No server secret is read inside a `"use client"` file. `CLAUDE_API_KEY` is read only in `src/lib/ai/client.ts` and `src/lib/visualizer-ai.ts` (plain server modules). `DATABASE_URL` only in `src/db/index.ts` and `src/db/heal.ts`. `BLOB_READ_WRITE_TOKEN` only in `src/lib/media-batch-08.ts` and the two `"use server"` action files (`(panel)/media/actions.ts`, `(panel)/pieces/actions.ts`). `VAPID_PRIVATE_KEY`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `CRON_SECRET` are all server-only. The only `process.env` in a client file is `src/app/admin/(panel)/settings/NotifyToggle.tsx:56`, which reads `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, a value that is public by design. Nothing to fix.

## P1, land before launch

- `src/app/admin/(panel)/pieces/FilterSheet.tsx:196` and `src/components/AdminContext.tsx:431`, duplicate DOM id `stock-filter-panel`. The compact `AdminSheet` and the desktop inspector panel both hardcode `id="stock-filter-panel"`, and the stock filter chip in `FilterSheet.tsx:177,186` points `aria-controls` at that same literal. Near the 1280px surface boundary both can be present, which is an invalid duplicate id and an ambiguous `aria-controls` target. Fix: give the desktop inspector panel a distinct id, for example `stock-filter-rail` in `AdminContext.tsx`, and make the chip point `aria-controls` at the id that is actually visible.

- `src/app/admin/invoice/[id]/page.tsx`, no error boundary for the invoice route. `error.tsx`, `not-found.tsx`, and `loading.tsx` live only inside `(panel)`, so the invoice route, which does live DB reads in render, has no admin-shaped error boundary. A thrown error there bubbles to `src/app/global-error.tsx`, the site wide "Something slipped" screen, which is off brand for a back office document. Fix: add a small `src/app/admin/error.tsx` (or an invoice-local one) so a failed invoice render lands in a calm admin recovery, not the public global error.

## P2, polish before or shortly after launch

- `docs/AGENT-HANDSHAKE.md:347,355` and `docs/QA.md:72`, stale punch list references two issues that are already fixed. The doc lists item E (unnamed phone tabs) and item G (dead `AdminTopNav`) as open, but E is fixed at `src/components/AdminNav.tsx:143` (`aria-label={r.label}` on every tab link, added 2026-07-05) and `AdminTopNav` does not exist anywhere in `src` (only these doc lines mention it). Fix: mark E and G done in the handshake and remove the `AdminTopNav` line from the QA list so the punch list matches the code. (Not edited here per the read-only guard on those files.)

- `src/app/admin/(panel)/ranges/page.tsx:28-34` and `:42`, possible two golds on the ranges sub page in compact. The page renders both an in body gold "New range" (line 42) and a hidden `data-admin-action` span (lines 28-34) that feeds the floating action the label "New range" in the stock room, so on a phone two gold "New range" controls can show at once. Both now point at the same target, so it is milder than a conflicting double action, but it still reads as two primaries on one screen against guardrail G8. Fix: let the ranges sub page suppress the room floating action, or drop the in body button in compact so only one gold shows.

- `src/app/admin/(panel)/orders/[id]/page.tsx` order action, DOM scrape fallback can go stale. The order screen's four state action rides a hidden `[data-admin-action]` span read by a MutationObserver in `src/components/admin-page-action.ts`; if the read misses, `adminRouteActionFor` (line 31-38) always falls back to "Add payment" at `#order-payment`, a form that is gone once an order is settled. Fix: make the route fallback state aware (no payment action on settled orders), or resolve the order action on the server and drop the DOM scrape.

- `src/components/AdminContext.tsx` inspector, live for only two of nine rooms. The desktop context rail becomes a real action or edit surface only for Stock filter and the media panels; the other rooms show passive text and hairline links, so on wide screens the inspector reads as unfinished against the goal's Record and Ledger inspector promise (BACK-OFFICE-GOAL.md section 4a). Fix: either extend the inspector pattern to the dense records (order, customer, piece) as the goal intends, or record in the goal that the inspector is filter and media only for launch so the empty cell is a decision, not a gap.

## State coverage, checked against BACK-OFFICE-GOAL.md section 5

Coverage is strong and largely complete. Notes below are for the record, not all are defects.

- Empty, complete. Every list, ledger, and gallery route renders bespoke whisper copy when empty, for example "The book is open and empty." (orders), "Nobody owes the house. Enjoy it." (debts), "The stockroom is empty." (pieces), "No shelves yet." (ranges), "Nothing is on the road." (deliveries), "No photos here yet." (media), "The history has not started." (settings history). No missing empty state was found.
- Loading, complete. A group skeleton at `src/app/admin/(panel)/loading.tsx` covers every panel route with `aria-busy`, plus route specific skeletons at `orders/[id]/loading.tsx` and `pieces/[slug]/loading.tsx`.
- Error with a way back, complete for the panel group. `src/app/admin/(panel)/error.tsx` gives a retry plus "Back to the glance" and a repair reference. The only gap is the invoice route outside the group, tracked in P1 above.
- Offline, complete. `src/app/admin/offline/page.tsx` is the calm offline room, wired through the service worker in `src/components/AdminSw.tsx` (mounted in `layout.tsx:21`, manifest at `layout.tsx:10`, `public/admin-sw.js` present).
- Pending, complete. Nearly every mutation form uses `useActionState` with a disabled submit and a verb, for example "Saving...", "Recording...", "Adding...", "Cutting...".
- Async announced, well covered. The shared `src/app/admin/(panel)/Sentence.tsx` save answer carries `role="status"` and takes focus so a screen reader hears each result; it is used across the order, payment, piece, range, customer, settings, delivery, and share forms. `InfiniteList.tsx:87` adds an `sr-only role="status" aria-live="polite"` for paged loads. This state law is met.
- Consequence, present. Door crossing steps (delivery status, settle, returns) confirm with named steps and disabled controls.

## Dead code and cruft

- No TODO, FIXME, HACK, XXX, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable` anywhere in `src`.
- No stray `console.log` in client or route code. The `console.*` calls that exist are `console.error` inside error boundaries (`error.tsx`, `global-error.tsx`) and server actions (media, pieces), plus `src/db/heal.ts` schema bootstrap logging. All are legitimate server or boundary logging, not debug leftovers.
- `AdminTopNav`, the component the older punch list asked to delete, is already gone from `src`; only the two doc lines above still name it.

## Broken links, checked

No broken admin links found. The `href="/admin/export/..."` links in `orders/page.tsx:74` and `debts/page.tsx:129` resolve to real route handlers at `(panel)/export/orders.csv/route.ts` and `(panel)/export/debts.csv/route.ts`. All other `/admin/*` hrefs map to existing routes.
