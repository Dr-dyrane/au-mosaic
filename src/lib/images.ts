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

/* The product-simple half of each tile: batch 05 family plates and batch 07
   exact SKU cards, the product on a studio ground, warm off-white by day and
   near-black by night. Keyed by slug. The other half is the applied mosaic,
   the piece's own cinematic scene (its image). The reveal renders BOTH, the
   product card as the stage object and the applied mosaic as the dream, never
   one for the other; the grid shows the product card. */
export const CARD: Record<string, { night: string; day: string }> = {
  "classic-pool-blues": { night: "/media/plate-pool-blues-night.jpg", day: "/media/plate-pool-blues-day.jpg" },
  "solid-colour-glass": { night: "/media/plate-neutrals-night.jpg", day: "/media/plate-neutrals-day.jpg" },
  "gold-metallic-accents": { night: "/media/plate-metallic-night.jpg", day: "/media/plate-metallic-day.jpg" },
  "custom-murals": { night: "/media/plate-custom-art-night.jpg", day: "/media/plate-custom-art-day.jpg" },
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

/* Rooted in Lagos, 2026-07-05: the house's own city, in the Oba light.
   Portrait scenes, single-sun (they hold in both themes). Home: /lagos. */
export const LAGOS = {
  villaPool: "/media/lagos-villa-pool.jpg",
  showroom: "/media/lagos-showroom.jpg",
  poolMaterials: "/media/lagos-pool-materials.jpg",
  aquaInterior: "/media/lagos-aqua-interior.jpg",
  blackBath: "/media/lagos-black-bath.jpg",
};

export const LAGOS_SCENES: { src: string; place: string; line: string; alt: string }[] = [
  {
    src: LAGOS.aquaInterior,
    place: "The aqua room",
    line: "A turquoise wall, lit by the lagoon.",
    alt: "A bright Lagos interior with a turquoise glass-mosaic feature wall by the water",
  },
  {
    src: LAGOS.showroom,
    place: "The showroom counter",
    line: "Every colourway, within reach.",
    alt: "Mosaic sample boards in gold, silver, copper, and blue on a stone showroom counter",
  },
  {
    src: LAGOS.blackBath,
    place: "The dark bath",
    line: "Black glass, brass, and quiet.",
    alt: "A dark luxury bathroom clad in black glass mosaic with brass fittings",
  },
  {
    src: LAGOS.poolMaterials,
    place: "The materials bench",
    line: "The water's hardware, ready.",
    alt: "A swimming pool pump, filter, and fittings beside blue pool-mosaic samples",
  },
];

/* The Atelier, 2026-07-05: the craft at its height in glass, stone, and metal
   set the old way. Aspiration, not portfolio; the tradition we work in.
   Portrait, single-sun. Home: /atelier. */
export const ATELIER = {
  atrium: "/media/atelier-atrium.jpg",
  loggia: "/media/atelier-loggia.jpg",
  metallics: "/media/atelier-metallics.jpg",
  instruments: "/media/atelier-instruments.jpg",
};

export const ATELIER_SCENES: { src: string; place: string; line: string; alt: string }[] = [
  {
    src: ATELIER.loggia,
    place: "The loggia",
    line: "A colonnade, and water that answers the sea.",
    alt: "A palazzo loggia of stone columns beside a blue glass-mosaic pool overlooking the sea",
  },
  {
    src: ATELIER.metallics,
    place: "The metallics",
    line: "Gold, silver, and copper glass, side by side.",
    alt: "Gold, silver, and copper metallic glass-mosaic sample boards in a vaulted stone hall",
  },
  {
    src: ATELIER.instruments,
    place: "The instruments",
    line: "The pool's hardware, in good company.",
    alt: "A swimming pool pump, filter, and fittings on a stone counter in an ornate mosaic room",
  },
];

/* How we work, 2026-07-05: the buying journey, sample wall to running pool.
   Day/night pairs, so the scenes keep two suns. Home: /how-we-work. */
export const HOW = {
  library: { night: "/media/how-library-night.jpg", day: "/media/how-library-day.jpg" },
  tray: { night: "/media/how-tray-night.jpg", day: "/media/how-tray-day.jpg" },
  materials: { night: "/media/how-materials-night.jpg", day: "/media/how-materials-day.jpg" },
  build: { night: "/media/how-build-night.jpg", day: "/media/how-build-day.jpg" },
};

export const HOW_STEPS: { night: string; day: string; step: string; title: string; line: string; alt: string }[] = [
  {
    night: HOW.library.night,
    day: HOW.library.day,
    step: "One",
    title: "Choose the colour",
    line: "It starts at the sample wall. Bring your space and your light; we bring the range in glass, stone, and metal.",
    alt: "A wall of glass-mosaic sample boards and two open sample trays on a stone counter",
  },
  {
    night: HOW.tray.night,
    day: HOW.tray.day,
    step: "Two",
    title: "Take it home",
    line: "Live with a tray of samples for a few days. Colour changes with the room and the hour, so it is better to be sure.",
    alt: "A tray of eight glass-mosaic samples with a baggie of loose tesserae and a brass ruler",
  },
  {
    night: HOW.materials.night,
    day: HOW.materials.day,
    step: "Three",
    title: "Everything the water needs",
    line: "Beyond the tile: pumps, filters, fittings, and the chemistry. We carry the whole kit and quote it per job.",
    alt: "A pool pump, filter, chemicals, basket, and fittings laid out with blue mosaic samples by a pool",
  },
  {
    night: HOW.build.night,
    day: HOW.build.day,
    step: "Four",
    title: "We build, or we supply",
    line: "Our hands from structure to waterline, or the materials for your own tiler. One house stands behind it either way.",
    alt: "A swimming pool under construction with the waterline mosaic going in at dusk",
  },
];

/* Interiors, 2026-07-05: mosaic as the room's one great surface: feature
   walls, baths, floors. Aspiration, the tradition applied. Single-sun.
   Home: /interiors. */
export const INTERIORS = {
  aqua: "/media/interior-aqua.jpg",
  blackBath: "/media/interior-black-bath.jpg",
  chess: "/media/interior-chess.jpg",
  blueStudy: "/media/interior-blue-study.jpg",
};

export const INTERIOR_SCENES: { src: string; place: string; line: string; alt: string }[] = [
  {
    src: INTERIORS.blackBath,
    place: "The dark bath",
    line: "Black glass on stone, lit low.",
    alt: "A dark bathroom with a black glass-mosaic feature wall, a carved stone basin, and a brass tap",
  },
  {
    src: INTERIORS.chess,
    place: "The checkered walk",
    line: "The oldest floor, in black and white.",
    alt: "A columned corridor with a black-and-white checkerboard mosaic floor",
  },
  {
    src: INTERIORS.blueStudy,
    place: "The blue study",
    line: "Every blue, weighed by hand.",
    alt: "Blue glass-mosaic sample boards laid on a stone counter in a warm study",
  },
];

/* Portfolio concept studies, 2026-07-05: applied scenes for /projects.
   Day/night pairs. */
export const PROJECT = {
  stoneWall: "/media/project-stone-wall-night.jpg",
  stoneWallDay: "/media/project-stone-wall-day.jpg",
  marbleBath: "/media/project-marble-bath-night.jpg",
  marbleBathDay: "/media/project-marble-bath-day.jpg",
};
