import { SITE } from "./site";

/* The showroom is on the map as "AU Mosaic Tiles", so the directions
   link searches by that name and lands on the real listing, its pin,
   hours, and reviews, not a bare point dropped on the street. */
const MAP_NAME = "AU Mosaic Tiles";
const mapQuery = encodeURIComponent(MAP_NAME);

export const SHOWROOM_MAP = {
  address: SITE.address,
  mapName: MAP_NAME,
  embedSrc:
    "https://www.openstreetmap.org/export/embed.html?bbox=3.3378%2C6.4714%2C3.3492%2C6.4838&layer=mapnik&marker=6.4776%2C3.3435",
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`,
};
