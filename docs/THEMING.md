# Theming contract · The Mosaic Maison

A theme is nine colour decisions, three scene decisions, and an
optional media set. Everything else is law and does not change with
the palette. When Nonso brings brand colours, this page is the whole
job.

## What a theme is

Nine tokens, one block in `src/app/globals.css`:

| Token | Role | Must satisfy |
|---|---|---|
| sand | the canvas | anchors everything below |
| shell | resting surfaces, bands | close to sand, one step apart |
| ink | primary text | 4.5:1 on sand and shell, aim 10+ |
| dusk | secondary text | 4.5:1 on sand and shell |
| mist | tertiary text, meta | 4.5:1 on sand |
| gold | eyebrows, accents, focus rings | 4.5:1 on sand (11px caps) |
| gold-deep | reserved deep accent | no text duty |
| water | water subjects only | decorative, no text duty |
| lift | the floating shadow | taste, not maths |

Plus three scene variables in `.scene-vars` and `.scene-vars.scene-day`
(scene ink, scene ink soft, scene gold): words that sit on imagery.
Night scene text must clear 4.5:1 on the dusk scrim; day scene text
on the ivory scrim. Current values and their measured ratios live in
QA.md.

## What never changes with a theme

The brass button (#C2A15C, near-black label): brand hardware, same
metal in both themes. WhatsApp green on the float: their brand, not
ours. The type ramp, the geometry law, the glass recipe, the motion.
A rebrand touches colour, not bones.

## The one derived spot

The four scrim voices (`scrim-hero`, `scrim-card`, `scrim-scene`,
`scrim-wash`) hardcode the sand rgb values for night (12 11 9) and
day (246 243 236). If a new palette changes sand, update the scrims
to match in the same pass. Ten minutes, listed so it is never a
surprise.

## The swap procedure

1. Put the candidate values into the theme block (dark, light, or
   both).
2. Run `python3 scripts/theme-check.py`. It reads globals.css and
   prints the full AA matrix. Anything under 4.5 fails the gate.
3. Update the scrim rgb values if sand moved.
4. Eye pass on hero, one product card, one piece page, both themes.
5. New QA.md rows with the measured numbers, commit.

If the media should follow the brand too (a different mood, not just
different chrome), the DAY pipeline already exists: generate twins
per MEDIA-BRIEF, drop, wire, done.

## The houses (the second axis, built)

The system is now two axes. Mode (night or day, `data-theme`) drives
media and scenes. Palette (which house, `data-palette`) drives the
tokens: Maison, Lagoon, Terracotta, Onyx, each defining both modes
plus its hardware (brass, the two scene golds, and the scrim sand
triplets). The footer picker sets it, localStorage keeps it, the
pre-paint script applies it before first paint, and the logo, glass,
scrims, and button all follow automatically because they read tokens.
Every house passes the gate in both modes before it ships. A new
house is one CSS block plus one swatch entry in PalettePicker.

Media stays the maison photography across palettes on purpose:
photographs do not recolour, and the warm water frames sit well under
every house. If a client palette ever demands its own mood, the DAY
pipeline shows the way: generate, gate, wire.
