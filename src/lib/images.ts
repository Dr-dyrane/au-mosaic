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

export const GALLERY = [
  { src: IMG.sunlitBlueMosaic, title: "Pool mosaics", sub: "The best seller, in sunlight" },
  { src: IMG.fishMosaicPool, title: "Mosaic art", sub: "A fish mural, underwater" },
  { src: IMG.rippledLaneWater, title: "Built to swim", sub: "Pools from first sketch to first swim" },
  { src: IMG.vibrantGlassMosaic, title: "Every colour", sub: "Glass mosaic, by the sheet" },
];
