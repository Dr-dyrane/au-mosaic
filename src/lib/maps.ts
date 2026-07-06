import { SITE } from "./site";

const showroomQuery = encodeURIComponent(SITE.address);

export const SHOWROOM_MAP = {
  label: "Agric Market, Orile",
  note: "The pin opens the market area. The shop is inside Block 7.",
  embedSrc:
    "https://www.openstreetmap.org/export/embed.html?bbox=3.3270%2C6.4500%2C3.3650%2C6.4930&layer=mapnik&marker=6.4776%2C3.3435",
  openUrl: `https://www.openstreetmap.org/search?query=${showroomQuery}`,
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${showroomQuery}`,
};
