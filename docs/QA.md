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
