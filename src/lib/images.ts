/* AU Mosaic · imagery. Every frame is the house's own: generated for the
   maison, eye-gated, compressed, and served from public/media. This module
   is the ONLY place media paths live. Nonso's real photography joins the
   same way: drop, gate, wire. */

/* Owned assets. */
export const OWN = {
  heroDusk: "/media/hero-dusk.jpg",
  duskVilla: "/media/dusk-villa.jpg",
  poolBlues: "/media/pool-blues.jpg",
  craftHands: "/media/craft-hands.jpg",
  glassJewels: "/media/glass-jewels.jpg",
  terrace: "/media/terrace.jpg",
  hammam: "/media/hammam.jpg",
  darkBath: "/media/dark-bath.jpg",
  koiMural: "/media/koi-mural.jpg",
  beetleMural: "/media/beetle-mural.jpg",
  borders: "/media/borders.jpg",
  villaPalms: "/media/villa-palms.jpg",
  privatePool: "/media/private-pool.jpg",
  aquaBlends: "/media/aqua-night.jpg",
  midnightBlends: "/media/midnight-night.jpg",
  gradientBlends: "/media/gradient-night.jpg",
  goldAccents: "/media/gold-night.jpg",
  metallicRoom: "/media/metallic-room-night.jpg",
  containerOrders: "/media/container-night.jpg",
  customColours: "/media/custom-night.jpg",
  /* Cinematic window frames, 2026-07-04: museum scenes for the window pages. */
  showroomWall: "/media/showroom-wall-night.jpg",
  poolEdge: "/media/pool-edge-night.jpg",
  artisanTable: "/media/artisan-table-night.jpg",
  materialsCounter: "/media/materials-counter-night.jpg",
  artGallery: "/media/art-gallery-night.jpg",
  /* Commerce product plates, 2026-07-04: shop-style tiles on studio grounds. */
  platePoolBlues: "/media/plate-pool-blues-night.jpg",
  plateMetallic: "/media/plate-metallic-night.jpg",
  plateSolidGlass: "/media/plate-solid-glass-night.jpg",
  plateCustomArt: "/media/plate-custom-art-night.jpg",
  poolKit: "/media/plate-pool-kit-night.jpg",
  /* Nonso's green-lit SKUs, 2026-07-04: the trade names his
     Instagram sells, photographed by the house camera. */
  plainBlueSmallSeed: "/media/plain-blue-small-seed-night.jpg",
  mixedBlueBigSeed: "/media/mixed-blue-big-seed-night.jpg",
  plainWhite: "/media/plain-white-mosaic-night.jpg",
  orangeMosaic: "/media/orange-mosaic-night.jpg",
  greenMosaic: "/media/green-mosaic-night.jpg",
  blackMosaic: "/media/black-mosaic-night.jpg",
  tinySeedGold: "/media/tiny-seed-gold-night.jpg",
  silverCrystal: "/media/silver-crystal-mosaic-night.jpg",
  stoneMosaic: "/media/stone-mosaic-night.jpg",
  hexagonMarble: "/media/hexagon-marble-night.jpg",
};

/* Daylight variants: the same scenes relit for light mode. Filled one
   frame at a time as they pass the gate; any missing entry means the
   slot holds its night frame in both themes. Frames that are already
   daylight (borders, villaPalms, privatePool, poolBlues) need no pair. */
export const DAY: Partial<Record<keyof typeof OWN, string>> = {
  heroDusk: "/media/hero-day.jpg",
  glassJewels: "/media/glass-day.jpg",
  koiMural: "/media/koi-day.jpg",
  beetleMural: "/media/beetle-day.jpg",
  hammam: "/media/hammam-day.jpg",
  duskVilla: "/media/dusk-villa-day.jpg",
  terrace: "/media/terrace-day.jpg",
  craftHands: "/media/craft-day.jpg",
  aquaBlends: "/media/aqua-day.jpg",
  midnightBlends: "/media/midnight-day.jpg",
  gradientBlends: "/media/gradient-day.jpg",
  goldAccents: "/media/gold-day.jpg",
  metallicRoom: "/media/metallic-room-day.jpg",
  containerOrders: "/media/container-day.jpg",
  customColours: "/media/custom-day.jpg",
  showroomWall: "/media/showroom-wall-day.jpg",
  poolEdge: "/media/pool-edge-day.jpg",
  artisanTable: "/media/artisan-table-day.jpg",
  materialsCounter: "/media/materials-counter-day.jpg",
  artGallery: "/media/art-gallery-day.jpg",
  platePoolBlues: "/media/plate-pool-blues-day.jpg",
  plateMetallic: "/media/plate-metallic-day.jpg",
  plateSolidGlass: "/media/plate-solid-glass-day.jpg",
  plateCustomArt: "/media/plate-custom-art-day.jpg",
  poolKit: "/media/plate-pool-kit-day.jpg",
  plainBlueSmallSeed: "/media/plain-blue-small-seed-day.jpg",
  mixedBlueBigSeed: "/media/mixed-blue-big-seed-day.jpg",
  plainWhite: "/media/plain-white-mosaic-day.jpg",
  orangeMosaic: "/media/orange-mosaic-day.jpg",
  greenMosaic: "/media/green-mosaic-day.jpg",
  blackMosaic: "/media/black-mosaic-day.jpg",
  tinySeedGold: "/media/tiny-seed-gold-day.jpg",
  silverCrystal: "/media/silver-crystal-mosaic-day.jpg",
  stoneMosaic: "/media/stone-mosaic-day.jpg",
  hexagonMarble: "/media/hexagon-marble-day.jpg",
};

/* Film slot: dormant. The 720p loop softened the one surface that must be
   the sharpest, so the hero is a still until a 1080p or better loop passes
   the eye gate. The old loop lives in git history; the pipeline (poster =
   first frame, seamless by construction) is documented in
   docs/client/IMAGE-PROMPTS.md. */

/* Environments: the dream first. Materials follow. srcDay arrives per
   frame; until then the night frame holds both themes. */
export const ENVIRONMENTS = [
  {
    src: OWN.duskVilla,
    srcDay: DAY.duskVilla,
    place: "The Dusk Villa",
    line: "Water holds the last light.",
    materials: "Pool mosaic in midnight blend, coping stone, warm lighting",
    href: "/mosaic-tiles#pool-mosaics",
  },
  {
    src: OWN.terrace,
    srcDay: DAY.terrace,
    place: "The Infinity Terrace",
    line: "The edge disappears.",
    materials: "Aqua pool mosaic, clay deck tiles, glass waterline",
    href: "/mosaic-tiles#pool-mosaics",
  },
  {
    src: OWN.hammam,
    srcDay: DAY.hammam,
    place: "The Private Hammam",
    line: "Warm stone, quiet hours.",
    materials: "Stone mosaic, heated surfaces, brass fittings",
    href: "/mosaic-tiles#feature-mosaics",
  },
  {
    src: OWN.darkBath,
    srcDay: DAY.darkBath,
    place: "The Dark Bath",
    line: "Shadow, texture, calm.",
    materials: "Textured dark mosaic, matte grout, warm light",
    href: "/mosaic-tiles#glass-mosaics",
  },
  {
    src: OWN.showroomWall,
    srcDay: DAY.showroomWall,
    place: "The Showroom Wall",
    line: "Every colour, within reach.",
    materials: "The full range in glass, stone, and metal, sampled",
    href: "/mosaic-tiles",
  },
  {
    src: OWN.poolEdge,
    srcDay: DAY.poolEdge,
    place: "The Pool Edge",
    line: "Where the blue begins.",
    materials: "Pool mosaic in seed blues, coping stone, still water",
    href: "/mosaic-tiles#pool-mosaics",
  },
];

/* Shop-style product cards, batch 07 exact SKU cards: the product on a studio
   ground, warm off-white by day and near-black by night. Keyed by slug, used
   for the grid card only; the piece page keeps its own hero photo, so nothing
   is retired. The family plates (pool blues, glass, metallic, custom art) are
   NOT here: they would shadow distinctive scenes and murals on the grid, so
   they live on the home "By the sheet" strip instead, appended not swapped. */
export const CARD: Record<string, { night: string; day: string }> = {
  "plain-blue-small-seed": { night: "/media/sku-plain-blue-small-seed-night.jpg", day: "/media/sku-plain-blue-small-seed-day.jpg" },
  "mixed-blue-big-seed": { night: "/media/sku-mixed-blue-big-seed-night.jpg", day: "/media/sku-mixed-blue-big-seed-day.jpg" },
  "plain-white-mosaic": { night: "/media/sku-plain-white-mosaic-night.jpg", day: "/media/sku-plain-white-mosaic-day.jpg" },
  "black-mosaic": { night: "/media/sku-black-mosaic-night.jpg", day: "/media/sku-black-mosaic-day.jpg" },
  "green-mosaic": { night: "/media/sku-green-mosaic-night.jpg", day: "/media/sku-green-mosaic-day.jpg" },
  "orange-mosaic": { night: "/media/sku-orange-mosaic-night.jpg", day: "/media/sku-orange-mosaic-day.jpg" },
  "tiny-seed-gold": { night: "/media/sku-tiny-seed-gold-night.jpg", day: "/media/sku-tiny-seed-gold-day.jpg" },
  "silver-crystal-mosaic": { night: "/media/sku-silver-crystal-mosaic-night.jpg", day: "/media/sku-silver-crystal-mosaic-day.jpg" },
  "stone-mosaic": { night: "/media/sku-stone-mosaic-night.jpg", day: "/media/sku-stone-mosaic-day.jpg" },
  "hexagon-marble": { night: "/media/sku-hexagon-marble-night.jpg", day: "/media/sku-hexagon-marble-day.jpg" },
};
