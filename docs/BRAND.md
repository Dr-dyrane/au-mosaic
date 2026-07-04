# AU Mosaic Instagram brand dossier

Source date: July 4, 2026.

Sources used:

- Public Instagram profile: `https://www.instagram.com/aumosaic/`
- Supplied screenshot: `Screenshot 2026-07-04 at 4.29.03 AM.png`
- Existing owner notes in `docs/CRM.md`

Limit of the harvest:

Instagram exposed the public profile, the visible bio, the four highlight
covers, the visible first grid, the first 12 public post links, and media
alt text for those visible posts. It did not expose all 96 posts without a
logged-in session. Treat this as the public storefront layer, not the full
brand archive.

## Executive read

AU Mosaic on Instagram is not quiet first. It is direct first.

The profile sells four things:

1. Mosaic tiles.
2. Pool tiles.
3. Swimming pool materials.
4. Pool construction.

The website should stay more premium than the Instagram flyers, but it
must preserve the same commercial path. A buyer who arrives from
Instagram should immediately recognize the categories, the sample flow,
the blue mosaic identity, and the Lagos market reality.

The brand voice has two layers:

- Public social voice: direct, confident, product-led, chat-led.
- Website voice: calmer, cleaner, more premium, still direct.

The website should not become an Instagram flyer. It should become the
clean, trusted showroom behind the Instagram page.

## Confirmed profile data

| Field | Retrieved value | Website decision |
|---|---|---|
| Handle | `@aumosaic` | Use in footer, contact, and brand dossier. |
| Display name | AU MOSAIC | Keep site name as AU Mosaic for readability. |
| Category | Building Materials | Use as a quiet proof cue, not a main nav item. |
| Posts | 96 | Record as social context only. Counts move. |
| Followers | 1,216 visible in page UI | Record as social context only. Counts move. |
| Following | 239 visible in page UI | Do not surface on the website. |
| Meta cache | 1,214 followers and 263 following in OG tags | Do not use. UI is fresher than cached meta. |
| Positioning | No. 1 mosaic tiles in Nigeria | Instagram flyer claim only. NOT the site tagline or hero: leading with it was tried and reverted to the maison voice (CODEX.md law 1). Kept as a brand fact, not site copy. |
| Bio categories | Mosaic tiles, pool tiles, swimming pool materials, pool construction | Homepage brand band and site routing. |
| Sample channel | `t.me/aumosaics` | Footer and contact page. |
| Instagram URL | `https://www.instagram.com/aumosaic/` | Footer, contact, JSON-LD sameAs. |
| WhatsApp | 0707 755 0283 | Already mapped as `+234 707 755 0283`. |
| Current address from flyer | Shop 17A, Block 7, Agric Market Complex, Odunade Bus Stop, Orile, Lagos | Fallback showroom fact and JSON-LD address. |

Spelling note:

The Instagram bio and some captions spell swimming as `Swimmimg`. The
site corrects this to `Swimming` everywhere.

## Logo description

### Avatar mark

The Instagram avatar is a black circular field with a lowercase `au`
drawn from small mosaic squares. The letterform is not a polished serif
or sans wordmark. It is a tile-built sign.

Observed visual details:

- Field: near-black or pure black.
- Shape: circular avatar crop.
- Letters: lowercase `a` and `u`.
- Construction: square tesserae, arranged like a pixel mosaic.
- Palette: deep navy, royal blue, cyan, pale glass blue, and white-blue
  highlights.
- Tone: digital, tile-like, modern, practical.
- Meaning: `au` also reads as gold on the periodic table, which supports
  the brand's gold mosaic category.

Website implication:

The site should keep the tesserae `au` mark. It is the strongest identity
asset and already matches the product. Do not replace it with a generic
luxury monogram.

### Flyer lockup

The visible flyers use an `au mosaic` lockup, with `ENTERPRISES`
letterspaced beneath in at least one graphic.

Observed visual details:

- `au` appears as the tile mark.
- `mosaic` appears lowercase, light, and blue.
- `ENTERPRISES` appears all caps, widely tracked, and secondary.
- Flyer palette leans white, navy, royal blue, and sky blue.

Website implication:

The website should keep the lowercase `au mosaic` lockup for brand
recognition, but should continue using `AU Mosaic and Pool Materials` as
the business name where clarity matters.

Open question:

The owner should confirm whether public documents should say `AU Mosaic
Enterprises` or `AU Mosaic and Pool Materials`. The site currently uses
the latter because it describes the business more clearly.

## Instagram visual system

### Core palette

| Role | Observed colour family | Website translation |
|---|---|---|
| Primary field | Black, near-black, deep navy | Royal dark and maison night palettes. |
| Brand blue | Royal blue and bright sky blue | Existing royal palette and lockup blue. |
| Water blue | Cyan, aqua, pale pool blue | Water token and pool mosaic imagery. |
| White space | White flyer backgrounds | Daylight default and clean product sections. |
| Metallic range | Gold, silver, rose gold | Dedicated material card and product language. |

The current website's royal palette is directionally correct. It already
matches the Instagram's blue mark and flyer system better than the older
stone-and-brass maison default.

### Typography cues

The Instagram profile itself uses platform UI, so the brand typography
must be inferred from flyers.

Observed flyer behavior:

- Big uppercase sales headlines.
- Heavy sans for campaign claims.
- Blue emphasis words inside white or black layouts.
- Letterspaced all-caps support text.
- Small body captions under the posts are direct and informal.

Website translation:

- Keep serif display for the premium site.
- Use short sans uppercase eyebrows for product family labels.
- Use direct one-sentence sales copy where users are deciding.
- Do not bring heavy flyer typography into the whole site. Reserve that
  energy for product cards and proof cues.

### Layout cues

Instagram visual layout is product-first:

- Profile avatar large, high contrast.
- Highlights act like product categories.
- Pinned posts establish the offer before the rest of the feed.
- Reels and carousels support product proof.
- Captions repeatedly end in chat, DM, quote, samples, or delivery.

Website translation:

- The homepage needs a quick category bridge near the top.
- Contact needs WhatsApp, Instagram, and Telegram grouped together.
- Product pages should keep real sample and quote CTAs visible.
- Catalogue labels should match the words buyers already saw on
  Instagram.

## Highlight system

| Highlight | Cover image cue | Meaning | Website route |
|---|---|---|---|
| Mosaic Tiles | Simple cyan tile grid on black | Main product family | `/mosaic-tiles` |
| Gold Mosaic | Gold tile sheet close-up | Premium metallic range | `/piece/gold-metallic-accents` |
| Silver Mosaic | Silver tile sheet close-up | Premium metallic range | `/piece/gold-metallic-accents` |
| Home Inspo | Interior render with patterned wall | Inspiration and applications | `/projects` |

Design implication:

The website should treat highlights as category shortcuts. The homepage
now mirrors this through compact chips after the profile promise band.

## Visible grid media, arranged

The live public page exposed 12 post links and 12 visible media captions,
plus profile and highlight covers. The table below summarizes the
retrieved media without copying full captions.

| # | Public link | Media type | Retrieved subject | Visual cue | Website implication |
|---|---|---|---|---|---|
| 1 | `/aumosaic/p/DGhxBvhspm5/` | Pinned post | Timeless building tiles | Black tile texture, bold white headline, blue emphasis | Homepage claim can be direct, but site should polish the language. |
| 2 | `/aumosaic/p/DGhw_wKswXp/` | Pinned post | Interior and exterior tiling | Collage of architecture, pool, stair, bath, display shelves | Use project and environment imagery to show applications. |
| 3 | `/aumosaic/p/DGhw-GpMnwz/` | Pinned post | Building tile range | Same campaign family as the first pinned posts | Keep floor, wall, mosaic, pool uses connected. |
| 4 | `/aumosaic/p/DaQdaT-tFoc/` | Image | New month greeting | White and blue flyer, logo visible | Brand uses social occasion posts. Website should not inherit this unless for blog/news. |
| 5 | `/aumosaic/reel/DaFMDmkt5zn/` | Reel | Complete swimming pool materials | Pool equipment offer, instant quote prompt | Pool materials page should accept a materials list. |
| 6 | `/aumosaic/p/DZZoW7KjWQI/` | Carousel | Swimming pool filter tank | Product photo, vertical equipment view | Pool materials need practical product cards. |
| 7 | `/aumosaic/p/DZMy7xqDdYL/` | Carousel | Aqua colour mosaic | Tile sample, interior use beyond pools | Aqua product should mention interiors, kitchens, offices, and pools. |
| 8 | `/aumosaic/reel/DVGjnbiDClZ/` | Reel | Gold, silver, and rose gold mosaic | Metallic reflective tiles | Metallic range deserves first-class placement. |
| 9 | `/aumosaic/p/DU0SWecDLnL/` | Carousel | Black and white chess board mosaic | Pattern tile sample | Add chess board as a known glass mosaic variant. |
| 10 | `/aumosaic/p/DUuzuhBjRuW/` | Carousel | Black mosaic bathroom wall | Luxury bathroom application | Dark bath imagery on site already fits this. |
| 11 | `/aumosaic/reel/DT2VbAODYdw/` | Reel | Big seed pool mosaic | Deep blue, light blue, mixed blue options | Classic pool blues should expose these variant names. |
| 12 | `/aumosaic/p/DS-RNAUDAFS/` | Image | New year showroom flyer | Shop 17A address and WhatsApp number | Contact facts and JSON-LD should use the full address. |

Image caution:

These Instagram images are useful as brand evidence, but they should not
be copied into the website as assets unless the owner gives the original
files or explicit permission. The site's owned media rule still stands.

## Product taxonomy from Instagram

### Main families

| Family | Instagram language | Website wording |
|---|---|---|
| Mosaic tiles | Mosaic Tiles | Mosaic tiles |
| Pool tiles | Pool Tiles | Pool tiles and pool mosaics |
| Pool materials | Swimming Pool Materials | Swimming pool materials |
| Construction | Pool Construction | Pool construction |
| Building tiles | Floor tiles, wall tiles, building tiles | Building tiles as supporting language, not top nav |

### Trade names to preserve

| Trade name | Meaning | Website location |
|---|---|---|
| Small Seed | Pool mosaic sheet style | Classic pool blues variants |
| Big Seed | Pool mosaic sheet style | Classic pool blues variants |
| Deep Blue | Pool mosaic colour option | Classic pool blues variants |
| Light Blue | Pool mosaic colour option | Classic pool blues variants |
| Mixed Blue | Pool mosaic colour option | Classic pool blues variants |
| Aqua Colour Mosaic | Aqua mosaic suitable beyond pools | Aqua product name |
| Crystal Mosaic | Glass mosaic trade name | Solid colour glass variants |
| Stone Mosaic | Glass or stone-look mosaic trade name | Solid colour glass variants |
| Chess Board Mosaic | Black and white pattern mosaic | Solid colour glass variants |
| Gold Mosaic | Metallic mirror mosaic | Metallic accents variants |
| Silver Mosaic | Metallic mirror mosaic | Metallic accents variants |
| Rose Gold Mosaic | Metallic mirror mosaic | Metallic accents variants |
| Filter Tank | Pool equipment product | Pool materials page |

### Sales promises

Repeated promise patterns:

- Send a DM.
- Ask for samples.
- Send your list of materials.
- Get a quote.
- Available and ready to deliver.
- Nationwide delivery.
- Visit the showroom.

Website translation:

- WhatsApp CTAs should say samples and quote, not only enquiry.
- Product CTAs should ask for photos and price.
- Pool materials CTA should invite a materials list.
- Contact page should show showroom, WhatsApp, Instagram, and Telegram
  together.

## Brand voice

### What the Instagram voice does well

It is clear, human, and action-oriented. It tells the buyer what is
available and how to buy.

Strong patterns:

- "Available and ready to deliver."
- "Send your list of materials."
- "Request samples."
- "Call or WhatsApp."
- "Visit our showroom."

### What the website should refine

The site should remove typos, repeated emoji, crowded hashtags, and
generic hype. It should keep the directness.

Examples of translation:

| Social caption energy | Website copy |
|---|---|
| Ask for samples from many options | Ask for samples. |
| Send a DM with requirements | Send your list. |
| Instant quote | Photos and today's quote. |
| Available and ready to deliver | In stock. Ready to deliver. |
| Interior and exterior tiling | Floors, walls, pools, and rooms. |

## Website design system direction

The existing site system should stay in place:

- Premium photography.
- Blue royal palette as default.
- Lucent surfaces.
- No borders.
- Capsules for actions.
- 28px panels.
- Full-bleed scenes.
- Apple-terse copy.

But the brand bridge changes the emphasis:

| Site area | Direction |
|---|---|
| Homepage hero | The maison voice, not the flyer claim. Leading with the No. 1 line was tried and reverted (CODEX.md law 1); the hero says "Spaces that begin with water" over owned cinematography. |
| Early homepage | Add a category bridge before cinematic environment cards. |
| Materials band | Include gold and silver mosaic as a first-class family. |
| Catalogue | Preserve customer trade names. |
| Contact | Group WhatsApp, Instagram, and Telegram. |
| Footer | Show social channels. |
| JSON-LD | Use full showroom address and social profiles. |
| Admin seed | Seed full address for new databases. |

## Current implementation map

| File | Role |
|---|---|
| `src/lib/brand.ts` | Stores harvested Instagram facts and stable brand language. |
| `src/lib/site.ts` | Uses the brand position, full address, Instagram, Telegram, and public description. |
| `src/lib/facts.ts` | Falls back to the full Shop 17A address when old generic database values appear. |
| `src/lib/wa.ts` | Updates WhatsApp prompts toward samples and quotes. |
| `src/lib/products.ts` | Updates fallback catalogue names and variants from Instagram language. |
| `src/app/(site)/page.tsx` | Adds Instagram-positioned hero, profile promise band, highlights, and metallic mosaic material card. |
| `src/app/(site)/contact/page.tsx` | Adds WhatsApp, Instagram, and Telegram contact cards. |
| `src/app/(site)/layout.tsx` | Adds full address and social profiles to JSON-LD. |
| `src/components/Footer.tsx` | Adds Instagram and Telegram sample links. |
| `scripts/seed.ts` | Seeds new databases with the full showroom address. |

## Database caveat

The public catalogue reads from the database when the book has pieces.
That means a local or production database can override fallback copy in
`src/lib/products.ts`.

What code guarantees now:

- The homepage brand bridge always appears.
- The contact channels always appear.
- The full address wins over old generic settings.
- Variants from fallback data can still garnish database pieces through
  `src/lib/catalog.ts`.

What still belongs in the stockroom:

- If the owner wants every product line in the live catalogue to show
  the exact Instagram trade wording, update the piece records in
  `/admin/pieces` or run a deliberate data migration.

## Open questions for the owner

1. Should the legal or public name be AU Mosaic Enterprises, AU Mosaic,
   or AU Mosaic and Pool Materials?
2. Is Shop 17A, Block 7, Agric Market Complex still the current shop?
3. Does the older 0816 725 4287 phone number still answer?
4. Should Telegram remain a sample room, or should WhatsApp be the only
   public sales channel?
5. Should building tiles become a top-level site category, or remain
   supporting copy under mosaic tiles?
6. Should floor tiles and wall tiles enter the catalogue as real pieces,
   or are they campaign language only?
7. Can the owner provide original logo and flyer files for asset reuse?
8. Can the owner provide the full Instagram archive or login access if
   the full 96-post content map is required?

## Design warnings

Do not copy the feed literally.

Avoid:

- Emoji-heavy copy.
- Hashtag blocks.
- Crowded square flyer layouts.
- Generic stock-like product collages.
- Typos from the source.
- Overclaiming social counts that change.
- Using Instagram CDN images as owned website assets.

Keep:

- The blue tesserae mark.
- The direct sample-and-quote flow.
- The clear four service families.
- The Lagos showroom reality.
- The metallic mosaic range.
- The product trade names buyers already know.
