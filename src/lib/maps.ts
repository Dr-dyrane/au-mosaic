import { SITE } from "./site";

const showroomQuery = encodeURIComponent(SITE.address);

export const SHOWROOM_MAP = {
  address: SITE.address,
  embedSrc:
    "https://www.openstreetmap.org/export/embed.html?bbox=3.3378%2C6.4714%2C3.3492%2C6.4838&layer=mapnik&marker=6.4776%2C3.3435",
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${showroomQuery}`,
};
