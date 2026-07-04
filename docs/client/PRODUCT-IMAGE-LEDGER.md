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

The batch now follows the app's two-sun pattern: day images are candidates
for `DAY`, night images are candidates for `OWN`.

| Product role | Day file | Night file | Verdict | Notes |
|---|---|---|---|---|
| Pool blues, small seed, big seed, deep, light, mixed blue | `pool-blue-seed-samples-day.png` | `pool-blue-seed-samples-night.png` | Strong pair | Day and night hold the same ledge, boards, and Lagos showroom feel. |
| Gold, silver, rose gold mirror | `metallic-mirror-trio-day.png` | `metallic-mirror-trio-night.png` | Strong pair | Night is richer; day reads cleanly for light mode. |
| Chess board mosaic | `chess-board-mosaic-study-day.png` | `chess-board-mosaic-study-night.png` | Usable pair | Night is stronger than day. Consider a calmer day retake before wiring. |
| Crystal mosaic, stone mosaic, custom blend | `crystal-stone-custom-table-day.png` | `crystal-stone-custom-table-night.png` | Strong pair | Best bridge between product truth and maison craft. |
| Pool materials, filter tank, pump, fittings, ladder | `pool-materials-counter-day.png` | `pool-materials-counter-night.png` | Strong pair | Practical stock image with enough luxury restraint. |
| Sample flow, quote journey, samples to you | `sample-visit-tray-day.png` | `sample-visit-tray-night.png` | Strong pair | Clean after the first rejected take with number marks. |
| Batch review | `contact-sheet.png` | `contact-sheet-pairs.png` | Reference only | Pair sheet is the useful review surface now. |

Every current day and night draft is 1122 by 1402, a 4:5 portrait. Two
night outputs arrived taller and were cropped into the batch ratio; the
raw originals remain in the generator cache.

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

## Two-sun rule for product images

Each product image needs two files before it can be wired:

- `*-night`: the dark-mode image. This is the `OWN` candidate.
- `*-day`: the light-mode image. This is the `DAY` candidate.

Night is not a filter. It is blue hour, lamps just lit, warm near-black,
and product detail still readable. Day is not a washed copy. It is
mid-morning Lagos daylight, pale warm ivory surroundings, and honest
material colour.

When creating a twin, preserve the subject, layout, crop rhythm, and
product count as much as the generator allows. The site can tolerate
natural photographic drift, but not a different product promise.

## Generated prompts, compact archive

The exact generator prompts used the house format. These are the reusable
briefs after cleanup.

### Pool blue seed samples

Premium showroom ledge with four pool mosaic sample boards: small seed
blue, big seed blue, deep blue, and light blue. Mixed blue blend loose in
the foreground. Glass tesserae and pale grout readable. Lagos showroom,
soft tropical daylight, warm stone, no text, no people.

Night twin: same ledge and boards, blue hour outside, lamps just lit,
warm architectural light across the glass, product still readable.

### Metallic mirror trio

Three metallic mirror sample boards on a dark warm stone plinth: gold,
silver, rose gold. Blue hour showroom, warm grazing lamp, controlled
reflections, quiet dark negative space above, no labels, no logos.

Day twin: same product arrangement in mid-morning daylight, pale warm
stone, controlled reflections, no jewelry-ad energy.

### Chess board mosaic study

Black and white chess board mosaic sheet on a warm stone counter. Loose
black and white tesserae in a disciplined line. Lagos apartment showroom,
soft daylight, no chess pieces, no text.

Night twin: same product, darker architectural interior, warm lamp across
the glass, feature wall receding into shadow.

### Crystal and stone custom table

Overhead showroom worktable. Crystal glass sheets on one side, stone
mosaic sheets on the other. A custom blend strip is being assembled between
them. Loose tesserae in ceramic bowls. Warm work lamp plus daylight.

Night twin: same worktable, blue hour window, one warm work lamp, bowls
casting soft shadows, glass glints held under control.

### Pool materials counter

Pool materials counter with filter tank, pump, skimmer basket, floor
drain, nozzles, stainless ladder section, hose, and turned-away bags of
gum cement. Mosaic sample shelves behind. No readable text or logos.

Night twin: same practical counter after closing, warm overhead lamp,
near-black shelves, equipment still clear.

### Sample visit tray

Open matte black presentation tray with pool blue, aqua, black, gold,
silver, rose gold, crystal glass, and stone sample boards. Clear pouch of
loose tesserae, blank ivory card, plain unmarked brass straightedge. No
numbers, no labels, no brand plates.

Night twin: same tray, shelf lights glowing, cool palm window, blank card
still blank, no labels or hardware marks.

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
