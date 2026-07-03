/* AU Mosaic · imagery. Every URL below was verified live on Pexels (free
   license, commercial use allowed, no attribution required). Hotlinked from
   images.pexels.com with size params; swapped for Nonso's own photos at
   launch. Keep this the ONLY place image URLs live. */

/* Large, rich masters: no tinysrgb colour flattening, generous widths.
   The Next optimizer sizes and re-encodes per device and DPR, so visitors
   get crisp AVIF at their exact size while the mosaic keeps its colour. */
const px = (path: string, w = 2000) =>
  `https://images.pexels.com/photos/${path}?auto=compress&w=${w}`;

export const IMG = {
  /* mosaic tiles */
  bluePatternTiles: px("14579397/pexels-photo-14579397.jpeg"),
  beetleMosaicArt: px("32325318/pexels-photo-32325318/free-photo-of-intricate-beetle-mosaic-artwork-detail.jpeg"),
  /* pools and water */
  fishMosaicPool: px("10231663/pexels-photo-10231663.jpeg"),
  rippledLaneWater: px("6110597/pexels-photo-6110597.jpeg"),
};

/* Owned assets: generated for the house, served from public/media.
   These replace stock one frame at a time as they arrive. */
export const OWN = {
  duskVilla: "/media/dusk-villa.jpg",
  duskVillaPoster: "/media/dusk-villa-poster.jpg",
  poolBlues: "/media/pool-blues.jpg",
  craftHands: "/media/craft-hands.jpg",
  glassJewels: "/media/glass-jewels.jpg",
};

/* Film: slow ambient loops, owned. The hero film's poster is its own first
   frame, so still and motion are the same image; blocked autoplay, save
   data, or reduced motion all hold that frame. The loop is a ping-pong of
   the owner's generated shot: seamless by construction. */
export const FILM = {
  heroLoop: "/media/dusk-villa-loop.mp4",
};

export const LUX = {
  villaPalms: px("30195980/pexels-photo-30195980/free-photo-of-serene-villa-by-infinity-pool-with-palms.jpeg", 2600),
  infinityTerrace: px("20975726/pexels-photo-20975726/free-photo-of-infinity-pool-and-patio-of-a-mountain-resort.jpeg", 2600),
  hammam: px("7031713/pexels-photo-7031713.jpeg", 2200),
  darkBath: px("35189678/pexels-photo-35189678/free-photo-of-luxurious-modern-shower-with-dark-textured-tiles.jpeg", 2200),
};

/* Environments: the dream first. Materials follow. */
export const ENVIRONMENTS = [
  {
    src: OWN.duskVilla,
    place: "The Dusk Villa",
    line: "Water holds the last light.",
    materials: "Pool mosaic in midnight blend, coping stone, warm lighting",
    href: "/mosaic-tiles#pool-mosaics",
  },
  {
    src: LUX.infinityTerrace,
    place: "The Infinity Terrace",
    line: "The edge disappears.",
    materials: "Aqua pool mosaic, clay deck tiles, glass waterline",
    href: "/mosaic-tiles#pool-mosaics",
  },
  {
    src: LUX.hammam,
    place: "The Private Hammam",
    line: "Warm stone, quiet hours.",
    materials: "Stone mosaic, heated surfaces, brass fittings",
    href: "/mosaic-tiles#feature-mosaics",
  },
  {
    src: LUX.darkBath,
    place: "The Dark Bath",
    line: "Shadow, texture, calm.",
    materials: "Textured dark mosaic, matte grout, warm light",
    href: "/mosaic-tiles#glass-mosaics",
  },
];
