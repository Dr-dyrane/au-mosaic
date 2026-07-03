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

## The CRM upgrade path

Ready. The seams are already cut:

- `slug` on every piece is the stable product key a database inherits.
- `PIECES` in `src/lib/products.ts` is the single swap point: replace the
  array with a table read and nothing above the data layer changes.
- Every enquiry deep link already carries the piece name into WhatsApp,
  so conversations map to products from day one.
- The dashboard (Phase 2) bolts onto the same data layer; pages, cards,
  and piece routes stay untouched.

## Imagery ledger

In use, verified live (Pexels, free licence, hotlink):

| Key | ID | Subject |
|---|---|---|
| poolBlueMosaic | 28287770 | blue pool mosaic, owner-picked |
| bluePatternTiles | 14579397 | blue and white patterned tiles |
| vibrantGlassMosaic | 28408521 | pixelated sunset glass mosaic |
| beetleMosaicArt | 32325318 | beetle mosaic artwork |
| fishMosaicPool | 10231663 | fish mural under water |
| rippledLaneWater | 6110597 | clear rippled pool water |
| villaDusk | 28054849 | villa pool at dusk (hero) |
| villaPalms | 30195980 | villa beside still water |
| infinityTerrace | 20975726 | infinity pool, mountain resort |
| hammam | 7031713 | warm stone hammam |
| darkBath | 35189678 | dark textured shower |

Verified alternates if any frame ever needs a stand-in: 30238914,
20329466, 10563429, 2672633, 30180996, 6127332.

At launch these swap for the house's own photography; `src/lib/images.ts`
stays the only home for image URLs.
