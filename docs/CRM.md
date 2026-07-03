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
the CRM reads this whole document first, then SAAS-QA.md, then
QA.md, and RECITES THE ORDERED PLAN BACK TO DYRANE for a yes before
touching code. One item at a time: build, lint (max-warnings=0),
ledger row in QA.md, story commit, remind Dyrane to push. Move board
verdicts as things land; never claim a pass that was not verified.

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
1. Verify stockroom filters behave on production (a fix shipped at
   the very end; confirmation never arrived).
2. Feel-list remainders: optimistic deliveries and enquiry clears,
   last-three-touched on the glance, in-app half of the unsaved guard.
3. The WhatsApp bridge, approved by Dyrane ("implement"): share_target
   in admin.webmanifest (GET, action /admin/share, params title, text,
   url) plus an auth-guarded /admin/share page matching a customer by
   any 234 or 0-prefixed phone in the shared text, offering prefilled
   New order or New enquiry; iOS caveat in the UI copy (share_target
   is Android/Chrome only). And compose-from-the-book: "Send the
   quote" and "Send the receipt" link-hair actions on the order record
   via waChat with lines, prices, billed, paid, balance; gold budget
   respected; wa_compose tracked.
4. Full-flow tracking, agreed: first-party anonymous session id
   (localStorage, crypto.randomUUID) on the WaTracker beacon;
   enquiries gain session_id (migration); attach mechanic UI
   (enquiries.customerId and converted status already exist in
   schema); Insights funnel panel (sessions, enquiries, converted,
   billed, settled with stage conversion rates). First-party only, no
   fingerprinting, no third-party pixels.
5. SEO sprint, strategy agreed: no-code first (Nonso claims Google
   Business Profile; Dyrane verifies Search Console and submits the
   sitemap), then title-tag audit (H1 house voice, title search-plain),
   Product and BreadcrumbList and enriched LocalBusiness schema, then
   the Journal: five to eight SSG intent guides from PLAN Phase 6
   queries, each ending in WhatsApp, FAQ schema, in the sitemap.
6. Nonso onboarding: word-for-word 3-minute screen-recording script
   for a WhatsApp video (glance, new order, line with list versus
   given, payment, who owes what, stockroom edit, photos), and "The
   tour": hand-rolled spotlight walkthrough, no dependency (steps of
   selector, page, title, one line; overlay cutout via giant
   box-shadow; glass card; gold Next; dot progress; navigates across
   rooms; localStorage aumosaic.toured; offer on first login plus a
   permanent hallway link; tour_step events).

7. Stock movement and notifications (Dyrane asked how a running-low
   count reaches him; agreed): (a) PREREQUISITE, a domain decision
   made: moving an order to delivered decrements stockLevels per line
   with a pieceSlug (quantity times line quantity), never below the
   visible truth, recorded so it can be audited later; enquiry-to-
   deposit does not touch stock. (b) The moment: action sentences
   learn arithmetic; a delivered move that crosses reorderAt answers
   "Delivered. {piece} is running low: {qty} {unit} left." (c) The
   spine: Web Push. "Notify this phone" toggle in Settings,
   PushManager subscription stored in a push_subscriptions table,
   VAPID keys in env (.env.example placeholders), web-push as one
   justified dependency; works on Android and on iOS 16.4 plus when
   installed. (d) The rhythm: Vercel Cron at 08:00 Lagos sends one
   digest (pieces low, naira owed, fresh enquiries); crossings push
   immediately; tapping opens the glance. House voice in every
   notification body.

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
