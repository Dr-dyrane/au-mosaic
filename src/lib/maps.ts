import { SITE } from "./site";

/* The showroom is on the map as "AU Mosaic Tiles". The embedded map
   itself marks the shop by that name at the owner's pin, and the
   directions link searches the same name and lands on the real listing,
   its hours and reviews, not a bare point dropped on the street. */
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
  embedSrc: `https://maps.google.com/maps?q=${mapQuery}&z=16&output=embed`,
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`,
};
