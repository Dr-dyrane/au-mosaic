import { SITE } from "./site";

/* The showroom is on the map as "AU Mosaic Tiles", so the directions
   link searches by that name and lands on the real listing, its pin,
   hours, and reviews, not a bare point dropped on the street. */
const MAP_NAME = "AU Mosaic Tiles";
const mapQuery = encodeURIComponent(MAP_NAME);

/* The real shop, read off the owner's own Apple Maps pin: Agric Market,
   Orile, on the Lagos to Badagry Expressway. The old marker sat about a
   kilometre north, so the embedded map now marks the true spot. */
export const SHOWROOM_COORD = { lat: 6.466972, lng: 3.328784 };

export const SHOWROOM_MAP = {
  address: SITE.address,
  mapName: MAP_NAME,
  coord: SHOWROOM_COORD,
  embedSrc:
    "https://www.openstreetmap.org/export/embed.html?bbox=3.322784%2C6.460972%2C3.334784%2C6.472972&layer=mapnik&marker=6.466972%2C3.328784",
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`,
};
