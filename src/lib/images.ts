/* AU Mosaic · imagery. Every URL below was verified live on Pexels (free
   license, commercial use allowed, no attribution required). Hotlinked from
   images.pexels.com with size params; swapped for Nonso's own photos at
   launch. Keep this the ONLY place image URLs live. */

const px = (path: string, w = 1400) =>
  `https://images.pexels.com/photos/${path}?auto=compress&cs=tinysrgb&w=${w}`;

export const IMG = {
  /* mosaic tiles */
  sunlitBlueMosaic: px("12113234/pexels-photo-12113234.jpeg"),
  bluePatternTiles: px("14579397/pexels-photo-14579397.jpeg"),
  vibrantGlassMosaic: px("28408521/pexels-photo-28408521/free-photo-of-pixelated-sunset.jpeg"),
  beetleMosaicArt: px("32325318/pexels-photo-32325318/free-photo-of-intricate-beetle-mosaic-artwork-detail.jpeg"),
  /* pools and water */
  fishMosaicPool: px("10231663/pexels-photo-10231663.jpeg"),
  poolWaterHero: px("1147124/pexels-photo-1147124.jpeg", 2000),
  rippledLaneWater: px("6110597/pexels-photo-6110597.jpeg"),
  laneDivider: px("8688165/pexels-photo-8688165.jpeg"),
  waterSplash: px("14761078/pexels-photo-14761078.jpeg"),
};

export const LUX = {
  villaDusk: px("28054849/pexels-photo-28054849/free-photo-of-a-luxury-villa-with-a-swimming-pool-at-dusk.jpeg", 2200),
  villaPalms: px("30195980/pexels-photo-30195980/free-photo-of-serene-villa-by-infinity-pool-with-palms.jpeg", 1800),
  infinityTerrace: px("20975726/pexels-photo-20975726/free-photo-of-infinity-pool-and-patio-of-a-mountain-resort.jpeg", 1800),
  infinityLoungers: px("20975727/pexels-photo-20975727/free-photo-of-resort-patio-with-mountain-view.jpeg", 1800),
  hammam: px("7031713/pexels-photo-7031713.jpeg", 1600),
  darkBath: px("35189678/pexels-photo-35189678/free-photo-of-luxurious-modern-shower-with-dark-textured-tiles.jpeg", 1600),
  luxBathroom: px("33529508/pexels-photo-33529508/free-photo-of-elegant-luxurious-bathroom-with-modern-decor.jpeg", 1600),
};

/* Environments: the dream first. Materials follow. */
export const ENVIRONMENTS = [
  {
    src: LUX.villaDusk,
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

export const GALLERY = [
  { src: IMG.sunlitBlueMosaic, title: "Pool mosaics", sub: "The best seller, in sunlight" },
  { src: IMG.fishMosaicPool, title: "Mosaic art", sub: "A fish mural, underwater" },
  { src: IMG.rippledLaneWater, title: "Built to swim", sub: "Pools from first sketch to first swim" },
  { src: IMG.vibrantGlassMosaic, title: "Every colour", sub: "Glass mosaic, by the sheet" },
];
