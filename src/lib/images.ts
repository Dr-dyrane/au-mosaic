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
};

/* Daylight variants: the same scenes relit for light mode. Filled one
   frame at a time as they pass the gate; any missing entry means the
   slot holds its night frame in both themes. Frames that are already
   daylight (borders, villaPalms, privatePool, poolBlues) need no pair. */
export const DAY: Partial<Record<keyof typeof OWN, string>> = {};

/* Film slot: dormant. The 720p loop softened the one surface that must be
   the sharpest, so the hero is a still until a 1080p or better loop passes
   the eye gate. The old loop lives in git history; the pipeline (poster =
   first frame, seamless by construction) is documented in MEDIA-BRIEF. */

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
];
