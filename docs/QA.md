# QA ledger · The Mosaic Maison

Every checkpoint verified with evidence, not opinion. Updated each pass.
Last pass: 2026-07-02.

## The owner's checklist

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | Modularity | PASS | Clean layers: data in `src/lib` (site, products, images, wa), primitives in `globals.css`, components in `src/components`, pages only compose. No page owns data or raw hex. |
| 2 | Reusability | PASS | One `ProductCard` serves the home picks and every range grid. `Section`, `CtaRow`, `Reveal`, `TileSheet`, `MosaicMark` shared across all pages. |
| 3 | Complete design system | PASS | `docs/DESIGN.md`: laws, palette, typography, motion, components, assets. All colour flows from `@theme` tokens. |
| 4 | Theme based | PASS | Dark is the default; light is one tap, saved and applied before paint. Both palettes tokenised; `color-scheme` set per theme. |
| 5 | Contrast check | PASS | Measured (WCAG): dark theme ink 17.1, dusk 7.4, mist 4.65, gold 8.0 to 1 on sand; light theme ink 16.5, dusk 6.5, mist 4.71, gold 4.62. All AA. Button label 7.7 to 1 in both themes. |
| 6 | Typography | PASS | Native serif stack (Didot, Bodoni 72, Georgia fallback) for headlines, native sans for body. Zero webfont wait. Scale documented in DESIGN.md. |
| 7 | Hover to animate | PASS | Images glide (scale 1.03, 700ms), hairline links draw themselves, card names warm to gold, nav fades, WhatsApp float lifts and settles. |
| 8 | Animate to reveal | PASS | `Reveal.tsx` IntersectionObserver: opacity, 14px rise, 0.985 scale, staggered 80 to 180ms. Ken-burns on hero and piece pages. Reduced motion respected everywhere. |
| 9 | Microinteractions | PASS | Button lift and settle, active press states, gold focus rings, brass text selection, smooth anchor scroll with scroll margins. |
| 10 | Progressive disclosure | PASS | Five pieces then "Explore the collection". Environments before materials. Piece facts below the reveal. Never five hundred. |
| 11 | Focus view | PASS | One loud thing per screen. Hero, environment, lifestyle line, and piece reveal each own their viewport. |
| 12 | Product view, Apple reveal | PASS | `/piece/[slug]`: the image is the screen. Full-bleed, no borders, no containers, words and one gold action on the image. 11 pieces prerendered. |
| 13 | Modern product pages | PASS | SSG piece pages with per-piece metadata and OG image, colourway dots, stock and factory facts, WhatsApp close. |

## Added checks

| Check | Status | Evidence |
|---|---|---|
| Image quality | PASS | 12113234 (aged pool floor, caught by owner) replaced by 28287770, picked by the owner's eye, verified 1400x1867 and loading. All live images return 200; every rendered `img` has alt text. Trimmed 5 unused image URLs and the dead GALLERY export. |
| Accessibility | PASS | Skip link, `:focus-visible` gold rings, alt text on every image, aria labels on menu and float, AA contrast, reduced motion, semantic landmarks (`header`, `main#main`, `nav`, `footer`). |
| Performance | PASS | Every route static or SSG (24 routes). `next/image` with explicit `sizes`; `priority` on heroes only. No webfonts, no animation libraries, no client JS beyond header, theme, reveal. |
| SEO | PASS | Per-page metadata, OG and Twitter cards, JSON-LD LocalBusiness, `sitemap.xml` (all pages and pieces), `robots.txt`, canonical host via `metadataBase`. |
| Analytics | PASS | `@vercel/analytics` wired in the root layout. Fulfils the proposal's traffic analytics deliverable. |
| Copy protocol | PASS | Swept: no em dashes, no arrows, few words, human prose. |

## Step-up pass (SICIS benchmark)

| Pattern | Status | Evidence |
|---|---|---|
| Island navigation | PASS | Fixed glass pill, condenses on scroll, menu expands from the island. Heroes full-bleed beneath it. |
| Hover to reveal and expand | PASS | Environment captions on the image; materials and link rise on hover or focus; always visible on touch. Glass "View the piece" chip on collection cards. |
| Floating CTAs | PASS | Piece bar rises after the hero action leaves the viewport (IntersectionObserver); WhatsApp float site-wide. |
| Cinematic immersion | PASS | Home and piece heroes own the full viewport (min-h-svh). Piece pages add a full-bleed "Seen in" environment scene. Every navigation glides in via app/template.tsx. Zero animation libraries. |

## Geometry and glass pass

| Pattern | Status | Evidence |
|---|---|---|
| Element relationships | PASS | Concentric geometry law: capsules inside islands, squircle panels inside squircle bands, no rectangle ever sits in a rounded parent. btn-gold is a capsule everywhere. |
| No lines | PASS | Hairline token and classes deleted from the codebase. Separation by whitespace, imagery, lucent bands, and inner glow only. |
| Liquid glass and lucency | PASS | .glass (sand 42%, blur 28, saturate 1.6) for island, menu, piece bar; .panel (shell 62%, blur 20) for facts; chips at 32% with blur 18. All luminous, none lined. |
| Subpages at par | PASS | All five subpages open with a cinematic PageHero (full-bleed image, words on it, gold action). Fact triads are lucent panels; tint sections float as inset 40px bands; footer floats as a band. |

## Now tier (from the UX review)

| Change | Status | Evidence |
|---|---|---|
| Type ramp shipped | PASS | 21 sizes collapsed to 9 (11, 12, 14, 16, 20, 26 + three display classes), one display leading, three trackings. Census verified by grep. |
| Motion consistency | PASS | Ken-burns on every PageHero; piece bar now glides out as well as in (transition, not unmount). |
| Native details | PASS | Piece bar and WhatsApp float respect env(safe-area-inset-bottom); active press states on every capsule and icon button. |
| Wayfinding | PASS | /piece/* lights the Mosaic tiles tab, aria-current set; float names itself on hover. |
| Measurement | PASS | wa_tap event on every WhatsApp link with placement source (hero, cta, card, piece-hero, piece-bar, float, nav, menu, footer, close, craft) and path. |

## Cinematic media pass

| Change | Status | Evidence |
|---|---|---|
| Hero film | SHIPPED, EYE CHECK PENDING | Water loop 9507847 (URL captured from the Pexels player) fades in over the villa dusk still; poster is the same frame, so every failure mode shows the still. Owner confirms the loop's look on first visible deploy; swap is one line in FILM. |
| Museum reveal | PASS | Piece heroes hang like lit works: spotlight vignette plus TiltFrame pointer lean (hover devices, reduced-motion safe, overscaled edges). |
| Scroll depth | PASS | Lifestyle and Seen-in scenes drift via CSS animation-timeline: view() where supported; static elsewhere. Zero libraries, zero JS on scroll. |

## Regression check (after the glass, bleed, ramp, and film passes)

| Surface | Status | Evidence |
|---|---|---|
| Glass legibility, dark theme | PASS | Measured over the darkest imagery: ink 12.3:1, dusk 5.3:1 on 42% glass. |
| Glass legibility, light theme | FIXED | 42% light glass over a dark hero left dusk at 3.11:1. Daylight glass now 75%: dusk 5.0:1, ink 12.9:1. Night lucency untouched. |
| Mobile full-bleed overflow | PASS | Every -mx-5 grid sits inside a px-5 container; one column on phones means media equals viewport width exactly, no horizontal scroll. |
| Transform stacking | PASS | Tilt (wrapper), ken-burns (image), glide (hover), and parallax (scenes) each own a different element; nothing double-drives one transform. |
| Overlay hit-testing | PASS | Vignette and gradients are pointer-events-none where content sits above; CTAs and links all reachable. |
| Focus and keyboard | PASS | Gold focus rings and skip link unaffected by the glass pass; piece bar untabbable while hidden. |

## The CRM and CMS upgrade path

Ready, and now mechanical:

- `slug` on every piece is the stable product key a database inherits.
- `src/lib/catalog.ts` is the read path: every page and the sitemap ask
  it, never the file. Its four async functions keep their signatures and
  change their source; the Phase 2 swap touches one module.
- Every enquiry deep link carries the piece name into WhatsApp, and
  wa_tap events record which placements convert, so the dashboard opens
  with real data on day one.
- Still Phase 2, on purpose: the store (KV or Postgres), the editor UI,
  auth, media uploads, and on-demand revalidation. That is the paid
  dashboard, not the free site.

## Imagery ledger · CLOSED, WALL TO WALL OWNED

Every frame and the hero film generated for the house, eye-gated
before shipping, compressed under ~500KB, served from public/media.
Zero stock, zero external image hosts, remotePatterns removed from
next.config. Retired along the way: Pexels 28054849, 28287770,
28408521, 32325318, 10231663, 14579397, 30195980, 20975726, 7031713,
35189678, 6110597, 12113234.

| Key | Serves |
|---|---|
| heroDusk | the hero still: twilight villa, mosaic readable tessera by tessera. Replaced the 720p film by quality gate; the loop lives in git history and re-enters at 1080p+. |
| duskVilla | Dusk Villa env card, pool-mosaic scene, the OG card |
| poolBlues | best-seller card, piece reveal, Pool mosaic tile on home |
| glassJewels | Solid colour glass card, reveal, Glass mosaic tile on home |
| koiMural | the identity frame: Pattern and picture mosaics, Art mosaic tile |
| beetleMural | Custom murals card and reveal |
| borders | Patterned pool borders card and reveal, collection page hero |
| craftHands | Why our surfaces last: the trust story |
| terrace | Infinity Terrace env card, pools hero, bulk-order scene |
| hammam | Private Hammam env card, contact hero, feature-mosaic scene |
| darkBath | Dark Bath env card, glass-mosaic scene |
| villaPalms | the lifestyle breath on home, about hero |
| privatePool | pool materials hero: chrome ladder, brass outlet, quiet proof of equipment |

Nonso's real photography joins through the same gate: drop in
public/media, eye check, wire in `src/lib/images.ts`, whitelist in
.gitignore, ledger row here.

## Scene typography (found and fixed during the daylight work)

| Finding | Status |
|---|---|
| Light theme put dark theme gold (#856A30) on dark scrims, near invisible | FIXED: scenes carry their own vars; night scenes force brass #C2A15C in both themes, 6.9:1 |
| Day frames under night scrims would look like fog at morning | FIXED: scrims flip to ivory morning haze only when the day image is active; ink flips with them. Day: ink 15:1, sub 6:1, gold #7A6128 4.9:1 |
| Night frames in light mode | Keep full night treatment: image, scrim, and type stay together, contrast never depends on which pairs have shipped |

## The brand mark (client's au sign, professionalized)

| Item | Status |
|---|---|
| AuMark | Nonso's au sign in the house metals: theme-token fills so the mark relights itself per theme (brass, stone, ivory at night; deep gold and umber by day). au is the chemical symbol for gold. No period, sized to the wordmark, reads as one name. |
| No double AU | The mark says au; beside it, lowercase sans mosaic in the system stack (SF Pro on Apple), matching his logo type. Aria labels still read AU Mosaic in full. |
| Icons | favicon, icon, apple-icon regenerated from the same bitmap via scripts/brand-icons.py. One mark everywhere. |
| Colours | House blues until Nonso's correction arrives; any brand palette then enters through docs/THEMING.md and the theme gate. |

## Premium parity sweep (every page to the same bar)

| Page | Was | Now |
|---|---|---|
| Pool materials | 18 equipment cards rendered empty 4:5 grey frames, the weakest page on the site | Imageless products render quiet panels: name, variants, note, enquire. No empty frames anywhere. |
| 404 | Default Next error page | Maison 404: "This room does not exist," gold action home, WhatsApp aside, wa_tap tagged. |
| About | Legacy MosaicBand with hardcoded v1 colours, blind to the palette system | The owned craft scene (night and day pair) in a 21:9 band. MosaicBand and MosaicMark now have zero users. |
| Imageless piece reveals | Full-screen TileSheet | Accepted as systematic; upgrades when per-range photography arrives. TileSheet grout stays pale by intent: real sheets have pale grout in any theme. |

## The four houses (palette axis)

| Item | Status |
|---|---|
| Palettes | Maison, Lagoon, Terracotta, Onyx: each with night and day token sets, brass, scene golds, and scrim bases. All 64 text pairs plus 16 scene and button checks pass the extended gate. |
| Hardware follows | Logo tesserae, brass button, skip link, glass, scrims, and scene typography all read tokens, so every house restyles the whole site including the mark, no component edits. |
| Picker | Footer swatch row (radiogroup, labelled, ringed active state), persisted to localStorage, applied before first paint. Default remains Maison. |
| One failure caught | Lagoon day mist shipped at 4.30 on first draft; the gate refused it, darkened to 4.5+. The gate works. |

## External lockup review, adjudicated

A second opinion on the logo lockup, checked against the code rather
than the screenshot it was judging.

| Claim | Verdict |
|---|---|
| Wordmark is 700 to 800 weight | Disproved: it ships at 600 (font-semibold). |
| Wordmark is pure white, warm it to #F3EFE7 | Disproved: it ships as ink #F3EFE6, one digit from the reviewer's own suggestion. |
| Switch to Geist or SF Pro | Rejected on law: the stack already serves SF Pro on Apple; adding Geist means a webfont download, and the house ships none. |
| Icon 52px, container 88px, gap 14px | Rejected on architecture: the nav is a floating island, not an 88px bar; those numbers belong to a different layout. |
| Gap too wide | Disproved: it was 6px, tighter than the reviewer's own 12 to 16 range. Raised to 8px for breath. |
| Optical alignment off, drop the word 2 to 4px | Adopted: eye test confirmed the word floated high. Baseline now meets the mark's bottom row, word nudged 2px. |
| Tighten kerning 1 to 2 percent | Adopted: tracking moved from -2.5 to -1.5 percent. |
| The au icon is the strongest part, keep it | Agreed. Untouched. |

Two adopted, one partially, four disproved or rejected with reasons.
The eye test (three rendered variants) settled alignment, not opinion.

## The theme gate (scripts/theme-check.py)

The contrast matrix is now a script, not a ritual: it reads the token
blocks in globals.css and fails any palette under AA before it ships.
On its first run it caught two borderline pairs in our own palette:
night mist on shell at 4.37 (mist now #8A8172, 5.12 on sand, 4.82 on
shell) and night scene brass over a bright image patch at 2.99 (night
scrim bottoms deepened to 0.84 hero, 0.82 card; brass now 3.22 worst
case). Every future palette, including Nonso's brand colours, enters
through docs/THEMING.md and this gate.

## Default flipped to daylight (client feedback)

Nonso reviewed and asked for a lighter look, so daylight is now the
default and night is one tap away. Served HTML, server snapshots,
theme color, and the pre-paint script all flipped together; a saved
night preference still wins before paint. The logo request is parked
until a logo asset exists.

## The visualizer and the projects gallery

| Feature | Status |
|---|---|
| See it in your space | LIVE at /visualizer. Photo upload or sample pool, four draggable brass stones define the surface, true homography warp (subdivided triangles, no libraries), the piece's colourway laid with the photo's own light (multiply plus soft-light), tile size and grout and blend controls, all 11 pieces selectable. Ends in WhatsApp: Web Share with the composite file where supported, download plus prefilled chat elsewhere. viz_photo, viz_piece, viz_adjust, viz_share, viz_download events. Entry from every photo piece page and deep-linkable with ?piece=. |
| Projects gallery | LIVE at /projects plus four project pages. Concept studies composed from owned frames, labelled Concept study on card and hero, so the owner sees the format his real jobs will fill. Story, scope panel, frame gallery, materials linking back into the collection, WhatsApp close. Projects joined the catalog read path and the sitemap; nav gains Projects. |
| Honesty rule | Concept studies never claim clients or dates. Real projects swap in through the same Project shape, concept flag off. |
| Nav correction | Projects left the island; the nav stays five single words. The work surfaces through story instead: a two-card strip on the home page and two footer Explore lines (Projects, See it in your space). |
| Apple-grade polish | The loupe: while a corner stone is dragged, a 2.5x magnifier with brass crosshair rides above the finger, so precision survives the fingertip. Press and hold the photo (off the stones) to see the original; stones and lines fade while held, an Original chip confirms, release re-renders. Every re-render breathes with one soft light sweep (reduced-motion safe). Haptic ticks on stone grab and release, sliders, piece and grout changes where the platform supports vibration. The session is remembered: photo (downscaled), quad, piece, and controls restore from localStorage on return, ?piece= still wins over memory. viz_compare and viz_resume joined the events. |
| Piece rail correction | The active chip's ring broke the no-borders law; it is gone. Chosen now means risen: elevated surface, ink text, a 4 percent scale, shadow-lift. The rail gained breathing padding so scaled chips never clip, bleeds edge to edge on mobile, and hides its scrollbar entirely (no-scrollbar utility). |

## The back office begins

| Item | Status |
|---|---|
| Analytics | Already complete before the dashboard asked: @vercel/analytics wired in the layout with the /next import, wa_tap placements and the viz_* family tracking custom events. Data flows once the deployment is visited. |
| Environment hygiene | Real Neon credentials arrived in .env.example; moved to .env (mode 600, gitignored, never committed). .env.example is now a clean placeholder template and ships with the repo via a gitignore negation. |
| Database foundation | Neon Postgres plus Drizzle, per the Phase 5 spec. src/db/schema.ts models the two families: catalogue (ranges, pieces, stock) slug-keyed to match the public site's stable keys, and ledger (customers, enquiries, orders with list-versus-given price per line, payments, deliveries) uuid-keyed. Money is integer kobo. src/db/index.ts is a lazy client so the static flagship builds with no DATABASE_URL. drizzle.config.ts prefers the unpooled URL for DDL. Scripts: db:generate, db:push, db:studio. Build stays 30 routes; nothing public imports the db yet. |
| Connection probe | Blocked from the sandbox (network allowlist), as expected. First `npm run db:push` from the owner's machine creates the tables and proves the pipe. |
| Pipe proven | db:push from the owner's Mac (Node 24 via nvm): schema pulled, changes applied, nine tables live on Neon. |
| The door | /admin/login, one password field, Maison voice. HMAC-signed session cookie (AUTH_SECRET), timing-safe password check, httpOnly, 30 days, scoped to /admin. No auth dependency added. Guard lives on the (panel) route group so the login page cannot loop. Sign out is a server action. ADMIN_PASSWORD refuses its own placeholder: auth stays closed until a real password is set. |
| The morning glance | /admin (force-dynamic) reads five live numbers: pieces, stock warnings, open orders, outstanding balance (billed minus paid on open orders), new enquiries. Database unreachable renders a calm panel, and the public site is untouched either way. robots disallows /admin; the panel layout adds noindex. |
| Seed path | scripts/seed.ts (db:seed, tsx) upserts the flagship's own catalogue into ranges, pieces, and zeroed stock rows by slug. Idempotent. Day one of the CRM starts with every piece the site already sells. |
| Phase 2 agreed | Nonso approved the dashboard engagement. The CRM build is funded and underway. |
| The stockroom | /admin/pieces: every piece grouped by range, colour tiles, sheets in stock, Running low and Off the site states visible at a glance, phone-first cards. Empty state teaches db:seed. |
| The piece editor | /admin/pieces/[slug]: one form, one Save. Shop-floor labels (sheets in stock, warn me at, container lands), live colour preview, show-on-site toggle, price note defaults to Quote per job. One server action saves words plus stock together; every action re-checks the session because server actions are public endpoints; hex codes are validated; the save button answers back (Saved / error in Maison voice). revalidatePath refreshes list, editor, and morning glance. |
| Three rooms in parallel | Customers, Orders, and Debts plus Deliveries were built by three agents at once under the CRM.md guardrails, in disjoint directories, no shared-file touches (verified by git status). All fourteen admin routes compiled and linted clean on the first integration build. The guardrails did their job. |
| Customers | List with no-JS search (GET form, ilike on name and phone), new-customer form, and the customer record: their orders with billed and balance in naira, their enquiries, WhatsApp them via waChat, edit form. Malformed uuids 404 instead of 500. |
| Orders | The pipeline grouped by status, settled tucked away with a count. The order record is the centerpiece: five chip-solid steps, lines as stacked panels with List beside Given and the gap named in gold ("₦X below list"), billed sum, payments, serif Balance. Add line (piece select or free description, naira inputs, given defaults to list), record payment, move the step. No line deletes: "Wrong line? Add a corrected one; nothing is ever lost." |
| Who owes what | Read-only ledger. Owing orders grouped by customer, oldest debt first, grand total across everyone, per-order links, WhatsApp reminder prefilled in shop voice. Empty state: "Nobody owes the house. Enjoy it." |
| Deliveries | Grouped Waiting to go, On the road, Landed (last 10). One-step-forward status moves validated against the database (a stale screen refuses calmly), deliveredAt stamped on landing. New delivery hangs off an open order. |
| chip-solid correction | The orders agent caught a real cascade hazard: chip-glass hard-codes white ink in unlayered CSS and beats layered utilities, and it was designed for imagery, not panels. New chip-solid primitive (theme-aware, is-on state, shadow-lift when risen) replaced chip-glass everywhere in the back office, including the pieces list shipped earlier. |
| The hallway | Morning-glance stat cards now open their rooms (outstanding opens Who owes what). The sixth card is the room directory. Header nav stays terse: Pieces, Orders, Customers (desktop), Sign out. |
| Own clothes | The owner asked why the admin wore the island, the footer, and the WhatsApp float: because the root layout dressed everyone. Public chrome moved into a (site) route group with its own layout (island, footer, float, skip link, JSON-LD); the root keeps only html, theme script, and analytics. The back office now renders pure, URLs unchanged. |
| Wayfinding, HIG | AdminNav: on the desk, a quiet top row where the current room holds ink and aria-current; on the phone, a glass tab bar under the thumb (Home, Stock, Orders, People, Owed) with a gold dot on the active room and safe-area padding. Subpages keep their one back link. The owner should never have to ask where he is. |
| Book and window | The distinction the owner asked to see: the book (CRM) holds everything he stocks; the site is the shop window showing only what he puts in it. The stockroom is titled The book, ranges count "X in the book, Y in the window", and the new-piece form says "Put it in the window now" with drafts as the default. |
| Ranges CRUD | /admin/ranges: the shelves. Create (slug minted once from the first name, then fixed because pieces hang off it), edit name, line, and shelf position, see each shelf's pieces. A range shows in the window only when it holds a published piece. |
| New piece | /admin/pieces/new: birth certificate only (name, shelf, line, optional colours); slug minted unique (suffix -2, -3 on collision); stock row created at zero; enters as a draft unless the window switch is flipped; lands on its record page to grow. |
| The photographs | The missing images CRUD, found: a Photographs panel at the top of every piece record. Two slots, night and day, matching how the flagship renders both suns. Upload through a server action to Vercel Blob (8MB cap, type checked, calm "photo store not connected" until BLOB_READ_WRITE_TOKEN is set), thumbnail answers, Take it down clears the record but leaves the file in the store: nothing is ever lost. next.config gains the blob host and an 8MB action body. |
| One canonical home | NEXT_PUBLIC_URL drives SITE.url (localhost in dev, the domain in Vercel); the visualizer share line derives its host from SITE. The old domain left the codebase. |
| A real PWA | Not a bookmark: public/admin-sw.js, scope /admin only so the shop window never runs it. Network-first navigations (a back office is never served stale), cache-first for immutable build assets, and a precached calm offline room (/admin/offline, static, no auth, "The book needs a connection."). Registered by AdminSw in the admin root layout; with the scoped manifest this makes the office installable as its own app. |
| Apple dashboard checklist | Audited the back office against the house philosophy. Passing: one gold button per screen, shop-floor voice, empty states that teach, sentence feedback on every form, phone-first cards, tab-bar wayfinding with aria-current, book-versus-window language, no borders anywhere, chip-solid theme-aware states. Corrected in this pass: morning-glance stat numerals were 34px (off the ramp), now 26px serif like every other big number; (panel) gains error.tsx (a calm "That did not go through. Try again." instead of a stack trace) and loading.tsx (rooms open with a breath: quiet pulse panels, aria-busy). |
| The gaps, closed | Everything named in the audit shipped. Password field: an eye (inline SVG, aria-pressed) so a long password typed on a phone can be checked before Enter. The Owed room carries a quiet gold count of owing customers on both navs, computed per request in the panel layout and staying home if the database is quiet. Orders gained the customers-style no-JS search by customer name with its own teaching empty state. Order status is optimistic: the chip moves the instant he saves (useOptimistic), the server confirms behind it, failure walks it back with a sentence. |
| The funnel remembers | Every WhatsApp tap on the site now becomes an enquiry in the book: WaTracker sends a beacon (never delaying the chat) to /api/enquiry, which stores source, page, and the piece when the page was a piece, no personal data, always answers 204 so the funnel never feels the back office. The People room opens with "Fresh from the window": each tap with its piece and time, cleared with Replied or Close, nothing deleted. The morning glance's New enquiries number is now fed by real taps. |
| Colours by eye | Hex text fields left the piece forms. ColorsField renders the colourway as native colour tiles: tap to open the phone's own wheel, add and remove before Save, hidden comma-joined field so the server action never changed. Native swatch dressed in house geometry (color-dot). |
| The office footer | A quiet strip at the bottom of every panel page: the same PalettePicker (four houses) and ThemeToggle (two suns) as the shop window, sharing one theme store and one localStorage, so the back office wears whatever clothes the owner chose and remembers them everywhere. |
| The second family | The owner caught the miss: the book held mosaics only, and pool materials are half the business. ranges.family (mosaic or pool) and pieces.unit (sheets, bags, units) join the schema (migration 0001); the seed loads POOL_MATERIALS as pool-family ranges with minted slugs, counted in units. The stockroom now reads in two tiers, The tiles and The pool materials; range forms choose the side of the business; the piece editor counts stock in its own unit ("Counted in"). Orders could already line any piece; now every pump and bag of gum cement is a piece. Owner runs db:push then db:seed to apply. |
| Insights | /admin/insights, read-only, business data not traffic: billed month by month (CSS bars, no chart library), what sells the house (top five by revenue), the discount leak as one number with its warning sentence, debt aging in three buckets linking to Who owes what, where the WhatsApp taps come from by source, and stock pressure naming what is running low. Every figure from orders, payments, enquiries, and stock. Insights joins the rooms in both navs. |
| Settings | /admin/settings on a settings key-value table (migration 0002), seeded once from site.ts and never overwritten by reseeds (his edits win). WhatsApp number (normalised to 234), phone display, hours, location, Instagram. Honest copy: the site reads these when the seam flips; until then edits wait safely. The password deliberately does not live here (Vercel env). Settings link sits in the office footer and the hallway. |
| The standards list | docs/SAAS-QA.md: a long modern SaaS admin checklist with honest verdicts, indexed in the doc tree. First mechanics pass shipped against it: one Pager primitive (links, so the URL remembers), customers paginated at 24 with a total count in the intro line, settled orders paginated, and orders gained status filter chips (All open plus the four steps, chip-solid is-on, URL-carried) with a teaching line when a step stands empty. |
| The way back | One Back primitive, HIG manners: a chevron that names where it goes, full 44px thumb target, leans into the walk on hover, aria-labelled. Every subpage opens with it (piece record, new piece, ranges and range record, order record, new order, settled shelf, customer record, new customer). The bare text back-links retired; lateral links stay link-hair. |

## The collection, photo complete · both suns

Six remaining tile-sheet pieces became photography in one batch, each
eye-gated as a night and day pair: aqua blends (lamp-lit evening and
midday caustics), midnight blends (readable dark, warm in the
depths), the gradient wall (dusk made of tiles), gold accents (the
vault of the house), container orders (the night before the container
ships), and custom colours (the artisan's table). Every one of the
eleven catalogue pieces now carries owned photography in both themes.
The gate caught one filename mix-up along the way: files named gold
were the gradient wall; the eye wires, not the label.

## Daylight pairs (the theme follows the sun) · COMPLETE

Every night frame has its daylight twin, every twin eye-gated for
same scene, same tiles, believable morning. The toggle is a sunrise
across the entire maison.

| Pair | Status |
|---|---|
| hero-dusk + hero-day | PAIRED. Same villa, same tree, same grid; brass streaks become sky reflections. |
| glass-jewels + glass-day | PAIRED. The jewel case at noon: daylight transmission, ivory room behind. |
| koi-mural + koi-day | PAIRED. Same fish, same swirls, skylight morning; gold flecks glint in daylight. |
| beetle-mural + beetle-day | PAIRED. Iridescence shifts emerald to teal in daylight; gold glints. |
| hammam + hammam-day | PAIRED. The oculus pours morning; wet honey mosaic, no steam, the drip survives. |
| dusk-villa + dusk-villa-day | PAIRED. The same address before breakfast: gold horizon, mosaic through glassy water. |
| terrace + terrace-day | PAIRED. Swimming-hour midday: crisp caustics, white sparkle on the spill, true blue sea. |
| craft-hands + craft-day | PAIRED. Honest work at ten in the morning; the adhesive ridges throw crisp daylight shadows. |
| dark-bath | stays dark in both themes by identity |
| borders, villa-palms, private-pool, pool-blues | already daylight, no pair needed |
