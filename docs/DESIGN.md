# The Mosaic Maison · design system

AU Mosaic's digital flagship. Not an ecommerce store, not a catalogue: a
house. SICIS direction, Apple HIG discipline, Dyrane philosophy. Luxury
whispers; it never screams.

## Laws

1. Story first, products second. Environments open every journey; the
   materials that made them follow.
2. Photography creates separation. No borders, no hairlines, no lines of
   any kind. Whitespace, imagery, and lucent surfaces do the structural
   work; a soft inner glow stands where an edge would have been.
3. Progressive disclosure. Five pieces, then "Explore the collection."
   Never five hundred.
4. Motion glides. 240 to 500ms, opacity and 0.985 to 1 scale, one slow
   ken-burns on the hero. Nothing flies. Reduced motion is respected.
5. Copy whispers. "Designed for water, light, and time." Never
   "Premium tiles." Dyrane copy rules hold: few words, no em dashes.
6. Commerce stays human. Every enquiry lands in WhatsApp, the way the
   house actually sells. No cart, ever.

## Palette · night gallery (default)

Warm near-black, not blue-black. Stone and brass, one breath of water.

| Token | Dark (default) | Light |
|---|---|---|
| sand (canvas) | #0C0B09 | #F6F3EC |
| shell (surface) | #16130F | #FFFFFF |
| ink (text) | #F3EFE6 | #17150F |
| dusk (secondary) | #A79E8F | #5D564A |
| mist (tertiary) | #837A6B | #746C57 |
| gold (accent) | #C2A15C | #856A30 |
| gold-deep | #8F7434 | #8F7434 |
| water (reserved) | #7FD0DB | #2E7E8C |

Gold is for eyebrows, actions, and the words that matter. Water appears
only where water is the subject. No saturated fills, no gradient washes.

## Geometry and glass

Concentric or nothing: never a sharp rectangle inside a rounded parent.

| Element | Shape |
|---|---|
| Interactive chrome (buttons, chips, island, bar, toggle) | capsule (999px) |
| Panels and menus | squircle 28px |
| Card and inline media | squircle 22 to 26px |
| Inset section bands, footer | squircle 40px |
| Heroes and scenes | full-bleed, square: they are screens, not elements |

Two lucent materials, defined once in globals.css:
glass (floating chrome): sand at 42%, blur 28 saturate 1.6, inner glow.
panel (resting surface): shell at 62%, blur 20 saturate 1.3, inner glow.
Tinted sections are inset bands: shell at 70%, radius 40, floating in the
canvas rather than striping it edge to edge.

Every text token clears WCAG AA (4.5:1) on sand in both themes; the exact
ratios live in docs/QA.md. The gold button is brass hardware: #C2A15C with
near-black text in both themes, like a door handle that ignores daylight.
Keyboard focus is a 1px gold outline, 4px offset, on :focus-visible only.

## Typography

Headlines: native luxury serif stack, largest first.
`Didot, "Bodoni 72", "Playfair Display", Georgia, "Times New Roman", serif`
Apple devices render true Didot; everywhere else falls to Georgia, which
carries the tone. No webfont download, instant on any connection.

Body: the native sans stack (SF Pro on Apple, Segoe/Roboto elsewhere).
Eyebrows: 11px, uppercase, 0.25em tracking, gold.
Hero: clamp(2.8rem, 8vw, 5.5rem), serif, tight leading.
Section titles: clamp(1.9rem, 4vw, 3rem), serif.

## Layout

Content 1200px, wide scenes full-bleed. Section padding 96 to 140px
vertical. Margins are generous; whitespace is the product. Magazine,
not dashboard.

## Motion

`--ease-glide: cubic-bezier(0.22, 0.61, 0.36, 1)`
Reveal on scroll: opacity 0 to 1, translateY 14px to 0, scale 0.985 to 1,
via IntersectionObserver (components/Reveal.tsx). Hero image: 14s ken-burns
scale 1.0 to 1.06, once. Hover: images scale 1.03 over 700ms; captions and
glass chips rise 10px into place (cap-reveal). Pages glide in on every
navigation (app/template.tsx, page-enter, 500ms). All of it stands down
under prefers-reduced-motion. That is all.

## Navigation and floating surfaces

Island nav: a fixed glass pill (rounded-full, sand at 75%, backdrop blur,
hairline ring), centred, floating over the page. It condenses past 24px of
scroll and opens its menu from the island on small screens. Heroes run
full-bleed beneath it.
Piece bar: on piece pages, a second glass island rises from the bottom
once the hero action scrolls away, carrying the piece name and the one
gold action. The Apple buy bar, the house way.
Hover to reveal: environment captions live on the image; the materials
line and its link surface on hover or focus, and are always present where
hover does not exist (touch).

## Components

Environment: full or half-bleed image, eyebrow, serif line, one sentence,
"The materials behind it" hairline link.
Piece (product): ProductCard in components/ui.tsx, reused on home and in
every range grid. Image or tile sheet, optional collection eyebrow, serif
name, "Enquire" hairline link straight into WhatsApp. Cards with a slug
link into their piece page.
Piece page (/piece/[slug]): the Apple reveal. Full-screen image, no
borders, no containers; collection eyebrow, serif name, and the gold
action sit on the image. Quiet facts and a WhatsApp close follow. Slugs
are stable ids: the CRM product table keys off them later.
Buttons: gold rectangle (2px radius) for the single primary action per
screen; hairline-underline text links for everything else.

## Assets

Imagery: verified Pexels hotlinks (src/lib/images.ts is the only home),
replaced by the house's own photography as it arrives. Wide angle, natural
light, dusk and golden hour, minimal people. Icons and OG: gold tessera
mark on night, generated in-repo.
