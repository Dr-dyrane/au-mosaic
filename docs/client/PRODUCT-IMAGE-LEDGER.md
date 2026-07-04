# AU Mosaic product image ledger

Source date: July 4, 2026.

This is the working ledger for product images drawn from the Instagram
harvest and the house camera. It exists so the window and the back office
can be upgraded without losing the reason behind each image.

## Rule of the pass

Instagram gives the product truth. The maison gives the camera.

The site should not copy Instagram flyers or Instagram CDN images. It
should render the product families in owned photography, then let the CRM
replace concept studies with Nonso's real stock photos as they arrive.

Generated images stay in the dream lane until wired and labelled. Real
stock and finished project photos are the proof lane.

## Source limits

The durable harvest is in `docs/BRAND.md`. It records the public profile,
the visible bio, highlights, first 12 post links, and media alt text from
the earlier Instagram pass.

A fresh logged-out HTTP check on July 4, 2026 returned Instagram's shell,
not the richer public profile data. No new post evidence was added from
that check. The ledger below therefore uses the durable harvest already in
the repo.

## Product inventory from Instagram

| Product signal | Instagram evidence | Current site or office home | Image need |
|---|---|---|---|
| Pool mosaic | Pool tiles, Big Seed, deep blue, light blue, mixed blue | `classic-pool-blues` and Pool mosaics range | Sample boards and waterline scenes |
| Aqua colour mosaic | Aqua colour mosaic post | `aqua-turquoise-blends` | Interior and pool-use frame |
| Metallic mirror mosaic | Gold, silver, rose gold reel | `gold-metallic-accents` | Premium metallic sample study |
| Chess board mosaic | Black and white chess board post | `solid-colour-glass` variant | Pattern sample study |
| Black mosaic | Black mosaic bathroom post | Dark Bath environment and glass mosaics | Bathroom application frame |
| Crystal mosaic | Trade name in owner harvest | `solid-colour-glass` variant | Close material and custom blend frame |
| Stone mosaic | Trade name in owner harvest | `solid-colour-glass` variant today, possible future range | Matte stone material frame |
| Pool materials | Complete swimming pool materials reel | Pool materials page and stockroom family | Counter with equipment and fittings |
| Filter tanks | Filter tank carousel | Filtration and circulation group | Equipment-led product card |
| Samples to you | Flyer promise and Telegram sample room | Contact, WhatsApp prompts, CRM photo workflow | Sample preparation or visit frame |
| Pool construction | Bio service and pool posts | Pools page and projects | Lagos residential pool environment |
| Building tiles | Pinned timeless building tiles campaign | Open question | Do not invent a catalogue range yet |

## Draft image batch

Folder: `public/media/product-ledger-2026-07-04/`

This folder is ignored by git on purpose. It is a draft batch, not a
shipped media set. Nothing here is referenced from `src/lib/images.ts`.

| File | Product role | Verdict | Notes |
|---|---|---|---|
| `pool-blue-seed-samples.png` | Pool blues, small seed, big seed, deep, light, mixed blue | Strong draft | Lagos daylight, clear glass, good category image. |
| `metallic-mirror-trio.png` | Gold, silver, rose gold mirror | Strong draft | Premium and direct. Good material card candidate. |
| `chess-board-mosaic-study.png` | Chess board mosaic | Usable draft | Product reads clearly. Could use a darker architectural retake later. |
| `crystal-stone-custom-table.png` | Crystal mosaic, stone mosaic, custom blend | Strong draft | Best bridge between product truth and maison craft. |
| `pool-materials-counter.png` | Pool materials, filter tank, pump, fittings, ladder | Strong draft | Commercially useful. Says real stock without clutter. |
| `sample-visit-tray.png` | Sample flow, quote journey, samples to you | Strong draft | Replaces a first take that had number marks on a tape measure. |
| `contact-sheet.png` | Batch review | Reference only | Contact sheet for eye review. |

Earlier folders:

| Folder | Status | Reason |
|---|---|---|
| `public/media/brand-batch-01/` | Retire as mood only | Too literal with Italy and museum imagery. |
| `public/media/brand-batch-02/` | Retire as mood only | Useful material ideas, not the final Lagos lane. |
| `public/media/brand-batch-lagos/` | Keep as scenario draft | Better direction: Lagos villa, showroom, pool materials, aqua interior, black bath. |

## Prompt doctrine for the product set

Use this on every new product image:

```text
Ultra detailed photoreal still, premium architectural product photography.
Lagos latitude light. Medium format feeling. Natural light, with one warm
architectural lamp when useful.

Subject: the product family as Nonso sells it, shown clearly enough that a
buyer can recognize the material.

Depth: foreground, midground, background. The closest material is razor sharp.
The room recedes into soft blur.

Colour: royal blue, aqua, warm stone, ivory grout, warm black, brass, and
the product's real colour. No one-note palettes.

Avoid: people, hands, readable text, numbers, labels, logos, watermarks,
borders, flyer layouts, ecommerce cutouts, HDR glow, bloom, lens flare.

Mood: real stock, rendered with calm.

Output: 4K, portrait 4:5 unless a hero or journal header needs wide.
```

## Generated prompts, compact archive

The exact generator prompts used the house format. These are the reusable
briefs after cleanup.

### Pool blue seed samples

Premium showroom ledge with four pool mosaic sample boards: small seed
blue, big seed blue, deep blue, and light blue. Mixed blue blend loose in
the foreground. Glass tesserae and pale grout readable. Lagos showroom,
soft tropical daylight, warm stone, no text, no people.

### Metallic mirror trio

Three metallic mirror sample boards on a dark warm stone plinth: gold,
silver, rose gold. Blue hour showroom, warm grazing lamp, controlled
reflections, quiet dark negative space above, no labels, no logos.

### Chess board mosaic study

Black and white chess board mosaic sheet on a warm stone counter. Loose
black and white tesserae in a disciplined line. Lagos apartment showroom,
soft daylight, no chess pieces, no text.

### Crystal and stone custom table

Overhead showroom worktable. Crystal glass sheets on one side, stone
mosaic sheets on the other. A custom blend strip is being assembled between
them. Loose tesserae in ceramic bowls. Warm work lamp plus daylight.

### Pool materials counter

Pool materials counter with filter tank, pump, skimmer basket, floor
drain, nozzles, stainless ladder section, hose, and turned-away bags of
gum cement. Mosaic sample shelves behind. No readable text or logos.

### Sample visit tray

Open matte black presentation tray with pool blue, aqua, black, gold,
silver, rose gold, crystal glass, and stone sample boards. Clear pouch of
loose tesserae, blank ivory card, plain unmarked brass straightedge. No
numbers, no labels, no brand plates.

## Wiring plan

Do not wire all drafts at once.

1. Compress selected images below the still-image budget.
2. Copy winners into `public/media` with canonical names.
3. Whitelist only the winners in `.gitignore`.
4. Add paths only in `src/lib/images.ts`.
5. Map paths to catalogue or office records through `src/lib/products.ts`
   or the stockroom, never directly from pages.
6. Update this ledger with the final filename and the rejected draft it
   replaces.
7. Run the normal ritual: lint, build, QA row, story commit.

## Back office implications

The CRM heart is the piece record. These images suggest future stockroom
work, not just site work.

- Add or confirm variants for Small Seed, Big Seed, Deep Blue, Light Blue,
  Mixed Blue.
- Decide whether Crystal Mosaic and Stone Mosaic are variants or their
  own ranges.
- Keep Gold, Silver, and Rose Gold under one metallic range unless Nonso
  prices or stocks them separately.
- Pool materials deserve photos too. Filter tanks, pumps, ladders, and gum
  cement should not rely on tile imagery.
- Sample flow needs its own proof. If Nonso sends real photos of samples
  being prepared or delivered, that replaces the generated tray.

## Rollback notes

No live site references were changed in this pass.

To roll back the draft media, delete:

```text
public/media/product-ledger-2026-07-04/
```

To roll back the documentation, revert this file and the docs index or QA
row that mentions it. The canonical media list in `src/lib/images.ts` is
untouched.
