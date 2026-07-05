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
| Invoices | Paper from an order: in-app print sheet, and the exclusive document via scripts/invoice.py | Open |
| Photos | Phone upload to Vercel Blob, night and day | Open |
| The seam flip | DONE, law 10: the window reads the book (catalog.ts, tag-cached, updateTag on every stockroom save); the repo catalogue stands behind it, so no database can blank the window and the site still builds anywhere. Facts too: footer and contact read settings. Deploys heal their own schema (instrumentation, src/db/heal.ts): db:push retired as an errand; future schema passes append DDL there beside the drizzle file | Open |

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
Dyrane's machine or accounts (Vercel env, recordings, Google profiles),
listed for him in one batch at the end,
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
   limiting. Later schema healing retired the db:push errand; these
   tables now ride with deploys and still fail open while healing.
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
   carries the localStorage uuid; enquiries.session_id landed through
   the same schema-healing channel; attach mechanic on
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
   verifies Search Console and submits /sitemap.xml. The real
   Instagram handle already landed, corrected in the book by the
   heal channel at boot.
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
   Vercel. Schema healing covers the old migrations.

8. DONE 2026-07-03, built as specced. Tour.tsx is chapters now, zero
   dependencies. The basics keeps the seven cross-room steps. The
   stockroom deeply walks 28: families, desk filters with hue dots
   and sorts, the phone sheet opened and closed by the owner's own
   thumb (steps carry when: phone or desk, filtered at start), drafts
   count, card truths, then the walks: New piece field by field,
   Back, into a piece record for photos, words, colours, unit, stock,
   warn me at, container lands, the window switch, the sticky Save.
   Orders deeply (8 steps, ends on Move the step), People deeply (5,
   ends on the attach). Point steps advance on gold Next; do steps
   open a real window in the blocker (four panels, not one) and a
   capture-phase listener on the target advances only on the true
   tap; the card says Your turn. optional steps skip kindly when
   their data never paints; optional gateways end kindly. Chapters
   menu opens from Take the tour (data-tour-start="menu"); stockroom,
   orders, and people each carry Learn this room. Finishing writes
   aumosaic.toured.<chapter> plus the legacy key that retires the
   offer; tour_start, tour_step, tour_done, tour_skip all carry the
   chapter. COLLISION NOTE, resolved: two sessions shared one .git
   this day; the seam-flip session committed the whole verified tree
   as 2d84e8c, so the code for items 8 and 9 rides inside that
   commit, acknowledged in its message. The ledger rows and this
   handoff carry the item stories.
9. DONE 2026-07-03, built as specced. StatusForm asks before the
   door: any move that crosses into or out of Delivered or Settled
   while the order carries piece lines raises one glass card naming
   the exact movement ("This takes 20 sheets of Classic pool blues
   off the shelf. Deliver it?"); several lines list each with
   quantity and unit; the gold carries the verb (Deliver it, Settle
   it, Move it back), Not yet stays, Escape stays. The optimistic
   chip moves only after the yes, so the screen never lies even for
   a frame. Moves that touch no shelf keep their one tap, and the
   threshold confirm for bulk stock edits stays reserved:
   consequence, never ceremony. SAAS-QA carries the Consequence and
   confirmation audit with the accepted-without-ceremony reasons
   written.

10. DONE 2026-07-03, as specced. The welcome panel in Settings: a small row in the
    Settings page, house voice ("Begin again. The welcome returns on
    this device."), one link-hair button that clears every
    aumosaic.toured.* flag in localStorage on this device and answers
    in a sentence; the first-login offer returns on next visit to the
    glance. Client-only, no server action, no ceremony.

11. DONE 2026-07-03, both halves. (Dyrane reviewed: vertical
    stacks waste large screens; wants horizontal and zig-zag flow,
    progressive disclosure, animate-to-reveal, microinteractions).
    (a) Composition, lg and up: the piece record becomes two columns
    (photographs sticky on the left, the form on the right); the
    order record pairs lines-and-status left with payments right;
    Settings lays its panels as a two-column grid; Insights already
    grids, audit its balance; list rooms keep their card grids but
    long single-column strips gain the site's zig-zag offset rhythm
    (alternate sm:mt offsets) where scanning benefits. Phone layouts
    unchanged.
    (b) Motion, whisper-weight only: an admin Reveal (opacity plus a
    4px rise, 200ms, no stagger beyond 60ms, reduced-motion safe) on
    room sections and cards; panels already breathe via skeletons.
    The attention-stewardship root governs: motion in the office must
    never delay reading or reach the theatre of the flagship; no
    ken-burns, no parallax behind the door.
    (c) Progressive disclosure audit: card to detail stands; add
    collapsed-by-default for long secondary sections (the piece
    record's story field, order note history) with a one-line summary
    and a quiet More; never hide the gold or the money.
    (d) Microinteraction sweep on desktop: hover states on rows match
    the cards (name warms to gold), focus-visible ring audit behind
    the door, cursor affordances on do-anything elements.
    OUTCOME: composition shipped across the shell and desk passes
    (piece record, order record, settings, share, customers all
    pair; stockroom three columns at xl); photographs sticky at xl;
    room-rise 200ms via the translate property so sticky survives
    fill mode; story field folds behind a quiet More (order note
    stayed open, one short paragraph is not a fold); hovers and the
    gold focus ring were already true and are recorded; zig-zag
    declined with reason, the history ledger scans better straight.

12. DONE 2026-07-04, shipped then generalised to every piece: THE
    PIECE REVEAL, the window's piece page in four acts. Target named
    by the owner: shop.app's product-as-object, Apple's reveal
    ceremony, and the maison's museum cinematography, sequenced, not
    blended. Act one, the stage: a dark opening, the sheet standing
    alone under the spotlight vignette, the night stock board or the
    owner's blob upload as the object, image priority so the act
    paints first. Act two, the material: a light-sweep macro band
    across the tesserae, scroll-driven CSS only, close enough to
    touch. Act three, the dream: the pull-back into the piece's
    environment, the Seen-in scene elevated. Act four, the counter:
    the facts and the one gold Enquire, shop-crisp. Laws that bind
    it: theatre is lawful on the window only; reduced motion
    collapses every act to stills; phone-first act heights in svh;
    no new dependencies, the house already owns Reveal, TiltFrame,
    scrims, and scroll-driven CSS; the home page keeps its
    cinematography untouched per the owner's standing ruling, and
    pieces lacking a stock board simply skip act two. DISCIPLINE:
    prototype on ONE piece first, tiny-seed-gold, the reveal
    debuting on the king's own metal; the owner's eye gates the
    prototype in chat like the logo drafts; only then does the
    pattern generalise. Done means: prototype approved, AA measured
    on any new scrim text, LCP not regressed, lint and build green,
    ledger row, story commit.

13. DONE 2026-07-04, Oba shipped and gate-clean: THE HOUSES LEARN ATTITUDE.
    Palettes become characters with Lagos as the ground truth, and
    majesty speaks Yoruba, not Gulf pastiche: the gold king is OBA.
    Cast so far: Royal, the brand on its throne, already default;
    Oba, Lagos majesty, gold on warm midnight with coral fire, to
    build; Lagoon, water at rest; Terracotta, Agric earth; Onyx,
    the dark bath. The Oba build is one palette block in globals
    (nine tokens, both suns), a picker swatch, and the theme-check
    gate; whether Oba replaces Maison or joins beside it is the
    owner's call at build time. Attitude lives in tokens, names,
    and one-line characters recorded in THEMING.md; the media stays
    the shared maison photography per the theming contract, because
    costume imagery is where attitude dies. Done means: gate passed
    both suns for every house, swatch shipped, characters written,
    ledger row.

14. DONE 2026-07-04, grid tiles and reveal render both: THE PRODUCT
    DISCIPLINE, because one sample piece is not enough. Shop.app taught
    two lanes and they are different jobs. The grid is purchasable
    objects: every piece a clean card, the object filling the frame on
    a studio ground, warm off-white by day and near-black by night, no
    scene, no text, comparison fast because the camera barely moves. The
    detail page is large and quiet: the reveal, the four acts, which is
    exactly shop.app's product-detail discipline built the maison way.
    So the answer to "we did one, we need others" is two moves, not one.
    First the grid: the other session's Batch 07 exact SKU cards (the
    ten stocked trade names) plus the Batch 05 family plates give the
    catalogue its clean cards; wire them to the piece cards so every
    product reads intentional, not only tiny-seed-gold. The gap, named:
    a handful of the original eleven (aqua, deep-midnight, patterned-
    borders, gradient, container, custom-colours) still lack a clean
    card and keep their scene until one is drawn. Second the detail: the
    reveal generalises without hand-building each piece, because its
    acts already map to the lanes. The stage and counter object is the
    piece's SKU card; the material act is the same in macro; the dream
    act is a window frame chosen by a family map, pool to the pool edge,
    gold to the metallic room, glass to the showroom wall, art to the
    custom-art gallery, stone and neutral to the artisan table or the
    hammam. Un-gate the slug, add the family-to-dream map, and every
    piece page becomes its own reveal. RESTRAINT holds where it belongs:
    the five-pieces-then-explore law governs the grid and the home, not
    the detail page, so a rich reveal on every piece is on-brand, the
    way every shop.app product has a full page. DISCIPLINE: gate the
    Batch 07 cards by the owner's eye first because they are drafts,
    then wire the grid, then generalise the reveal with the map, gating
    two or three pieces one per family before the full roll. Done means:
    cards wired, reveal generalised, AA held on any new scrim text, LCP
    not regressed, lint and build green, ledger rows.

    STANDING DECISIONS, so these stop being chat questions:
    (a) plate-neutrals stays on the bench, converted but unwired, until
    a Speciality neutrals card or piece earns it; wire it the day a
    neutrals home exists, do not ask again.
    (b) Pool materials stay presentational, images on the page, until
    the owner asks the shelf be managed; then they become stockable
    records through the ranges family=pool enum and the insert-only
    heal channel, no new table, per the map already proven.
    (c) The reveal's dream is swappable per piece by the family map
    above; tiny-seed-gold's dream is the gold room, reversible to the
    gold vault.
    (d) Real project proof stays in the sales channels Nonso already
    trusts: WhatsApp and Instagram. The website remains the showroom
    promise, but it may still stage real projects as showroom proof:
    installed-context vignettes, product props, and quiet credibility.
    Do not turn it into a delivered-project archive with client files,
    dates, and case-study weight unless the owner reverses this ruling.

15. SHIPPED 2026-07-04: THE MEDIA BENCH. The piece record now has two
    more face slots, card_image_night and card_image_day, for the clean
    Shop-style product object. The old image_night and image_day remain
    the applied promise and hero face. A new media_assets table holds
    the bench: draft, approved, wired, and archived assets by batch,
    sun, role, linked piece, dimensions, source, notes, and original
    local path. /admin/media opens as a secondary room from Home and
    Stock, not the phone tab bar yet, because it is powerful but not
    daily for every hand. Batch 08 entered Blob and the bench: twelve
    card assets are wired into the six gap pieces, two kitchen frames
    are approved proof, and the contact sheet stays draft. catalog.ts
    now prefers the book's card slots and falls back to src/lib/images.ts
    CARD; PieceReveal reads the piece card fields too, so grid and detail
    share the same backend truth. The rollback is surgical: clear the
    six card_image slots, move the media rows back from wired or approved
    to draft, and the old scene photos return because image_night and
    image_day were never touched.

16. SHIPPED 2026-07-04: THE APPLIED PROMISE BAND. The home page now has
    the bridge between the dream rooms and the product cards. catalog.ts
    owns `getAppliedPromises`: first it looks for approved Batch 08 proof
    in `media_assets`, then it falls back to owned scenes in images.ts.
    The kitchen backsplash pair therefore enters the showroom as proof,
    not as a product card and not as a delivered-client archive. The
    remaining frames point to the pool edge, gold room, and custom wall,
    keeping the promise visual without inventing case studies. Rollback
    is small: remove the home band and the `getAppliedPromises` export,
    or move the kitchen proof rows from approved to draft so the band
    returns to the fallback aqua scene.

**2026-07-04, the night everything held.** Every outside seam proven
live, not assumed: the book under every room, the public blob store
under the photographs (first real upload landed), the window serving
the book, the funnel counting real people, the digest door opening to
its secret and sending, and the owner's word that it all works. The
engineering board is closed; what remains is his errand list and the
facts for the proof band (founding year, honest count, named work).

**The brand, harvested (2026-07-04, owner's Instagram screenshots).**
The client built the identity himself while the site guessed: the
tesserae au avatar on near-black, the lowercase serif mosaic wordmark
in sky blue, navy and glass-blue flyers, ENTERPRISES tracked beneath
the lockup. Facts read off the page and its flyers, with provenance:
handle instagram.com/aumosaic (current; older flyers say @aumosaics);
t.me/aumosaics in the bio; phones 0707 755 0283 (current flyers, same
as the book) and 0816 725 4287 (older flyers, bio lists both);
positioning "NO.1 MOSAIC TILES IN NIGERIA", category Building
Materials; the flyer triad Premium Mosaic Tiles, Swimming Pool
Solutions, Mosaic Art and Installation; a standing promise "we bring
the samples to you"; 96 posts, 1,216 followers. Trade names his
customers already speak: Small Seed and Big Seed (plain blue),
Crystal Mosaic, Stone Mosaic, Gold, Silver, Rose Gold mirror.
Addresses in three eras, newest first: Shop 17A, Block 7, Agric
Market Complex, Odunade Bustop, Orile, Lagos (current flyers); Block
C Shop 3-4, Odunade Plaza, Agric Market, Orile (mid); Block 5 Suite
12, 1st Floor, Agric Market, Badagry Exp Way, Orile (oldest). OPEN
QUESTIONS for the owner: which address is the shop today; does 0816
725 4287 still answer; does the paper sign ENTERPRISES or AU Mosaic
and Pool Materials; should the trade names join the book's piece
names. The royal house, the blue mark, the lockup, the icons, and
the og card all come from this harvest.

**Unplanned, on the record (owner's note, 2026-07-04): returns
management.** No phase has planned it. When a customer brings sheets
back, today the office can only edit the order lines and counts by
hand, which loses the story. A real returns room would touch four
laws at once: stock (returned sheets walk back onto the shelf the
way delivered ones walked off), money (a refund is negative kobo
that must keep the ledger honest without hard deletes), the order
(a status or a mirrored line, never an erasure), and the history
(every return signs itself). Scope it against the Instagram data
the owner is now collecting; trade returns at Agric Market are
routine, so this likely earns a place ahead of some Phase 3 quotes.

**The mark landed (2026-07-04): the owner drew the logo.** Masters
live in assets/brand (au-logo-master.png, au-logo-3d.png, never
served); the chrome derivative is public/media/logo/mark.png, 41KB
quantized. Canonical everywhere the company faces outward: icons,
favicon, PWA tiles, invoice paper, all generated from his file by
scripts/brand-icons.py. Final ruling (updated same day): the file in EVERY house and both
suns; the token mark and its two-voice CSS retired to git history.
A logo does not change clothes with the room. The sign is his.

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
happens in a container copy, rsync both ways. Since 2026-07-03 the
session pushes for itself: a fine-grained PAT (contents read-write,
this repo only) lives in .env as GIT_PUSH_TOKEN, and a repo-local
credential helper in .git/config reads it via git rev-parse, so
plain git push works from sandbox and Mac alike. The token expires;
when a push starts asking for a username again, mint a new one and
replace the .env line. Deploys follow pushes by themselves; close
the loop with the Vercel connector afterwards. (6) The build ritual can lie two ways, both survived on 2026-07-03:
rsync -a raced the mount and copied a stale globals.css, so the green
was last night's log; and the sandbox now reaps background jobs
between calls, so a kicked-off build dies unless the same bash call
sleeps through it. The cure, both halves: rsync -c (checksum), then
grep a string you just added in the /tmp/bm copy before building, and
run kickoff plus sleep plus log-read inside one call. (7) The environment
files: .env holds real secrets and is gitignored; .env.example ships
placeholders only. (8) Vercel Blob stores choose public or private at creation and never change: a private store refuses put with public access, and the window needs public. The first store was private; the cure was a new public store, connected in the dashboard, carried by the next deploy. Proven end to end 2026-07-04: refine on the phone, blob in the store, URL in the book, photograph in the window. (9) House voice in all repo content: no em dashes,
no arrows, Apple-terse, one gold per screen, no hairlines, nothing
ever deleted.

**The human context.** Nonso funded Phase 2 (NGN 500,000). Dyrane
thinks in boards and checklists; keep them current and honest. The
measure of done stands at the top of this document.
