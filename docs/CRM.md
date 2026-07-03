# The back office · the law

DESIGN.md governs the flagship. This governs the CRM. Every Phase 2
screen is measured against this document before it ships.

## Why this exists

Nonso's voice note asked for one thing: to manage his mosaic gallery
himself. His discovery record named the quiet losses: debts forgotten
on paper, discounts given too deep, records that live in notebooks.
So the CRM has one heart and two duties. The heart is the gallery.
The duties are to make the two losses visible.

## The heart: the piece record

The main feature of this CRM is the piece. Not a row in a table: a
record with a face, treated with the same respect the flagship gives
it. Everything about one piece lives in one place:

- Identity: name, slug (the same key the site has used since day one),
  the words on its page.
- The look: photographs (night and day), tile colours, how it renders
  when there is no photo yet.
- The stockroom: sheets in stock, warn-me-at level, when the next
  container lands.
- The money: price note today; price bands when he is ready.
- Presence: on the site or off it, one switch.
- Provenance, eventually: which orders sold it, which projects used
  it, so a piece carries its own history.

Customers, orders, debts, and deliveries all orbit the piece. When an
order line is written, it points at a piece. When a project is
published, it lists its pieces. The gallery is not a module of the
CRM; the CRM is the gallery's back room.

## The ten laws

1. The morning glance answers one question: is the house okay? Five
   numbers in three seconds, phone in one hand. Detail is behind a tap.
2. One room, one job. Never a mega-table. Card, then detail, then
   action: the same progressive disclosure as the flagship.
3. One gold button per screen. If a screen needs two, it is two
   screens. Everything else whispers in link-hair.
4. Shop-floor language, never database language. Sheets in stock,
   warn me at, container lands, who owes what. If the owner needs a
   manual, the screen failed. Empty states teach their own rooms.
   Forms answer back in sentences.
5. WhatsApp is the bloodstream; the CRM is the memory. Enquiries flow
   in from the site's taps, every customer opens into their chat,
   updates compose as prefilled messages. It remembers what the chats
   forget. It never replaces how he sells.
6. The invisible losses become numbers. List price beside given price
   on every order line: the discount leak, on screen. Payments against
   balances: forgotten debts, on screen. This is how the CRM pays for
   itself.
7. Same skin, same laws. Maison tokens, the type ramp, no borders,
   concentric geometry, both suns, all four houses. Walking from the
   gallery into the back room of the same building.
8. Nothing is ever lost. No hard deletes anywhere. Pieces go off the
   site; records archive. A man moving off paper must never fear the
   machine ate his book. An audit trail arrives when staff do.
9. Speed is the luxury. Saves answer instantly and in words. Money is
   integer kobo, so arithmetic is exact. Every open shows fresh truth.
10. One source of truth, eventually. The seam flips, the flagship
    reads what he edits, photos upload from his phone, real projects
    replace the concept studies. Site and back office become one
    organism.

## The roots (five whys, run on our own laws)

Beneath the ten laws sit three roots. When a future decision is not
covered by a law, it is judged against these.

**Attention stewardship.** Every law above is the same law: spend as
little of the owner's attention as possible per decision. His
attention is the business's scarcest asset; the UI exists to protect
it. This cuts both ways: notifications are capped at one morning
digest plus true threshold crossings. The app must never nag. A
feature that costs more attention than it saves is refused, however
impressive.

**Complete WhatsApp, never compete with it.** Trust lives in his
chats and does not migrate. The CRM wins as memory, not as channel.
Standing refusals: no in-app chat, ever; no customer-facing accounts;
no message inbox inside the back office. The bridge (share in,
compose out, attach to a name) is the permanent ceiling of ambition
in that direction.

**Quality is a loop, not a gate.** Build green proves nothing a user
feels. Every change closes the loop: lint, ledger, deploy, and an eye
or a log on production. The digest panel, the runtime logs, and
"evidence before errands" are this root wearing tools.

## The rooms

| Room | Job | Status |
|---|---|---|
| The door | Master key plus named staff keys, signed cookie, rests after 8 refusals | Open |
| The morning glance | Five numbers, is the house okay | Open |
| The stockroom | Pieces grouped by range, filters, sorts | Open |
| The piece record | One form, one Save: words, look, stock, presence | Open |
| Customers | People, their chats, their history, fresh enquiries | Open |
| Orders | Lines with list and given price, the pipeline, CSV | Open |
| Who owes what | Balances, oldest first, CSV | Open |
| Deliveries | Address, driver, status, landed archive paged | Open |
| Insights | The business in bars, sentences, and windows | Open |
| The key rack | Named staff keys, owner only, nothing deleted | Open |
| The book's history | Append-only audit in sentences, per law 8 | Open |
| Invoices | A PDF from an order | Planned |
| Photos | Phone upload to Vercel Blob, night and day | Open |
| The seam flip | Flagship reads the database | Last, deliberately |

## Guardrails for builders

Any builder (human or agent) shipping a room obeys these. They exist
so several rooms can be built in parallel without collision, and so
every room comes out of the same house.

**Read before building.** This document top to bottom. Then
src/db/schema.ts (the contract; never edit it). Then the stockroom as
canon: src/app/admin/(panel)/pieces/page.tsx, [slug]/page.tsx,
[slug]/PieceForm.tsx, and actions.ts. Your room copies those shapes.

**Stay in your room.** Write only inside your room's directory under
src/app/admin/(panel)/. Never touch: the panel layout, the morning
glance page, schema.ts, globals.css, package.json, docs, the public
site, or another room. Nav wiring, dashboard tiles, the QA ledger,
builds, and commits happen centrally after integration review.

**The pattern is law.**
- Pages: server components, `export const dynamic = "force-dynamic"`,
  data via getDb() from "@/db", drizzle query builder only.
- Mutations: server actions in your room's actions.ts. The first line
  of every action awaits hasSession() and refuses without it. Server
  actions are public endpoints regardless of what the UI hides.
- Forms: client components with useActionState, defaultValue inputs,
  one action per form, the action answers in a sentence.
- After a write: revalidatePath your room's pages and /admin.
- Money: integer kobo in the database, always. Format and parse with
  src/lib/backoffice.ts (naira, parseNaira). Never float arithmetic.
- No hard deletes. Status fields and archive flags only.
- No new dependencies. No API routes. No client fetch. No localStorage.
- WhatsApp deep links to a customer's own number: waChat from
  src/lib/backoffice.ts.

**The voice is law.** Shop-floor labels, Apple-terse sentences, no em
dashes or arrows anywhere, ever. Empty states teach the room. Errors
stay calm: "The database did not answer. Try again." One gold button
(btn-gold) per screen; secondary actions are link-hair. Existing
primitives only: panel, eyebrow, btn-gold, link-hair, chip-glass, the
field input style from PieceForm. No borders, rings, or hairlines.
Type sizes from the ramp already in use.

**Finish clean.** Before reporting done: every import resolves, every
form field name matches what the action reads, aria-labels on inputs,
no console.log, no TODO. Report the files written and any judgment
calls made, so integration review can check them fast.

**Debugging is law.** Written after the stockroom bug cost the owner
two dashboard errands for a theory that was wrong. (1) Logs before
theories: when production errors, read the runtime logs first; the
error room's digest exists to be looked up, not admired. (2) The page
that just shipped is suspect number one; a crash that begins with a
deploy points at that deploy. (3) Never send the owner to repeat a
step he already did unless new evidence emerged. (4) Build green
proves nothing about runtime for force-dynamic pages; they never
render at build. (5) A server component may render a client component
but must never call a function exported from a "use client" module;
shared helpers live in neutral files (see pieces/stock-filters.ts).

## The measure of done

The owner opens his phone at the market and answers a customer's
"do you have the midnight blend, and how much" in under ten seconds,
from the stockroom, without leaving WhatsApp for more than one tap.
That is the bar every room must clear.

End state in one sentence: he runs a ten-year import business from
his phone with the same calm as browsing his own gallery.

## The handoff · session memory (2026-07-03)

Assistant memory folders are session-scoped and unreliable across
sessions; this section is the durable copy. Any session continuing
the CRM reads this whole document first, then SAAS-QA.md, then QA.md,
and recites the ordered plan once at session start, for the record.

STANDING YES (Dyrane, 2026-07-03): the CRM is a goal, not a list of
requests. Work the queue CONTINUOUSLY, item after item, without
pausing to ask permission between items. Stop only for three things:
(a) a domain decision the boards do not cover, (b) steps that need
Dyrane's machine or accounts (git push, db:push, Vercel env,
recordings, Google profiles), listed for him in one batch at the end,
(c) context running out, in which case update this handoff and close
cleanly so the next session continues without a word. Per item, the
ritual is unchanged: build, lint (max-warnings=0), ledger row in
QA.md, story commit, continue. Move board verdicts as things land;
never claim a pass that was not verified.

**Where things stood at handoff.** CRM live at www.aumosaic.com/admin,
password auth, installable PWA. Rooms open: glance (Today and
Insights faces, New order gold, refresh line), stockroom (two
families, filters with hue dots, bottom sheet), orders (list beside
given, optimistic status, step filters), people (search, enquiry
strip), debts (oldest wears the gold), deliveries, insights (pace
sentences), settings (house facts table). Feel sprint shipped;
another session was mid-flight on feel items 9 and 15 (Sentence,
keepValues, icons components exist).

**Execution order.**
1. DONE 2026-07-03: Vercel runtime logs read; both error clusters
   (makeStockHref, k.map) ended exactly at their fix deployments and
   nothing new has erred since, including the day's later pushes.
2. DONE 2026-07-03: feel Next tier closed (c93d6ef), and the missing
   list closed after it (65901bf, 3ad468a): pagination at volume,
   sorts, CSV, insights windows, staff keys, audit trail, rate
   limiting. One owner errand stands: npm run db:push for staff and
   audit_log; everything fails open until then.
3. DONE 2026-07-03: the WhatsApp bridge, both halves: share_target
   plus /admin/share (phone matched, offers prefilled, keep-as-
   enquiry, iPhone caveat in copy) and /admin/compose (quote and
   receipt read fresh, audited, straight into the chat). Original
   spec follows for reference: share_target
   in admin.webmanifest (GET, action /admin/share, params title, text,
   url) plus an auth-guarded /admin/share page matching a customer by
   any 234 or 0-prefixed phone in the shared text, offering prefilled
   New order or New enquiry; iOS caveat in the UI copy (share_target
   is Android/Chrome only). And compose-from-the-book: "Send the
   quote" and "Send the receipt" link-hair actions on the order record
   via waChat with lines, prices, billed, paid, balance; gold budget
   respected; wa_compose tracked.
4. DONE 2026-07-03: full-flow tracking, first-party only. Beacon
   carries the localStorage uuid; enquiries.session_id landed
   (migration 0004, in the same db:push errand); attach mechanic on
   the enquiry rows (Tie them); createOrder auto-converts that
   customer's open enquiries; Insights draws From tap to settled
   with the two honest rates. No fingerprinting, no third parties.
5. CODE HALF DONE 2026-07-03: title audit (search-plain titles, H1s
   untouched), Product and BreadcrumbList on pieces, enriched
   LocalBusiness (honest fields only; Instagram joins sameAs when the
   real handle lands in site.ts), and the Journal: five SSG guides
   from the Phase 6 queries, FAQ on page and in schema, WhatsApp
   closes with journal-slug sources, sitemap and footer. STILL OPEN,
   no-code errands: Nonso claims Google Business Profile; Dyrane
   verifies Search Console and submits /sitemap.xml; the real
   Instagram handle into site.ts.
6. DONE 2026-07-03: onboarding, both halves. The word-for-word
   script lives at docs/client/VIDEO-SCRIPT.md, under three minutes,
   covering glance, new order, list versus given, payment, who owes
   what, stockroom edit, photos, and the window switch; Dyrane
   records it as a WhatsApp video. The tour shipped as built law:
   Tour.tsx in the panel, seven steps of selector, page, title, one
   line; box-shadow cutout that follows its element; glass card,
   gold Next, dot progress; walks Home, Orders, Owed, People, Stock
   and home again by router; Escape leaves; aumosaic.toured retires
   the first-login offer on the glance; a permanent Take the tour
   link sits in the rooms list; tour_start, tour_step, tour_done,
   tour_skip all tracked.

7. DONE 2026-07-03, built as decided. (a) Crossing into delivered
   (or settled) takes each line's quantity off its piece, clamped at
   zero; walking back out returns it; every movement signs the
   history per line. Enquiry to deposit never touches stock. (b) The
   sentence learned arithmetic: crossings answer "Delivered. {piece}
   is running low: {qty} {unit} left." (c) Web Push shipped as the
   one justified dependency: push_subscriptions (migration 0005,
   inactive not deleted), lib/push fails silent and open, sw push
   and notificationclick handlers, Notify this phone in Settings
   with the iPhone caveat. (d) vercel.json cron knocks /api/digest
   at 07:00 UTC (08:00 Lagos), CRON_SECRET guarded, one house-voice
   digest plus immediate crossings, taps open the glance. OWNER
   ERRANDS: npx web-push generate-vapid-keys, then set
   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET in
   Vercel; npm run db:push covers migrations 0003 through 0005.

**Phase 3 quotes, not builds:** payments inbox via Mono or Okra bank
feed (unmatched inflows, tap to attach, suggest by amount and open
balances); WhatsApp Business API tier (real automation, but a number
on the Cloud API cannot stay in the normal WhatsApp app).

**Cautions, paid for.** (1) Logs before theories: Vercel connector has
all-projects access; project prj_dmD1XEPckHlIPOuvNIjsLXJn8HdA, team
team_70YXvaKwtM0RJFRGtXT3hI5R; read runtime errors before proposing
user-side actions, and never send Dyrane to repeat a step without new
evidence. (2) neon-http db.execute returns an object with a rows
property, not an array; rowsOf normalisers exist in insights and the
panel layout. (3) Servers may render client components but never call
functions from a "use client" module; shared helpers live in neutral
files (pieces/stock-filters.ts is the example); build green proves
nothing for force-dynamic pages. (4) Commands for Dyrane: bare, one
per line, never with hash comments (zsh ate them twice). (5) Git in
the mounted folder: move .git lock files aside before and after git
add, commit with no-verify, unlink warnings are noise; npm work
happens in a container copy, rsync both ways. (6) The environment
files: .env holds real secrets and is gitignored; .env.example ships
placeholders only. (7) House voice in all repo content: no em dashes,
no arrows, Apple-terse, one gold per screen, no hairlines, nothing
ever deleted.

**The human context.** Nonso funded Phase 2 (NGN 500,000). Dyrane
thinks in boards and checklists; keep them current and honest. The
measure of done stands at the top of this document.
