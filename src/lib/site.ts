import { BRAND_PROFILE } from "./brand";

/* AU Mosaic · business facts. One source of truth, straight from the
   owner's Business Discovery answers. */

export const SITE = {
  name: "AU Mosaic and Pool Materials",
  shortName: "AU Mosaic",
  /* The window's own voice. The Instagram position line lives in
     BRAND_PROFILE for flyers and data; the maison does not shout. */
  tagline: "The house of mosaic.",
  description:
    "Mosaic tiles, pool tiles, swimming pool materials, and pool construction in Lagos. Samples, photos, quotes, and delivery start on WhatsApp.",
  location: "Agric Market, Orile, Lagos",
  address: BRAND_PROFILE.showroomAddress,
  hours: "Mon to Sat, 8:30am to 5pm",
  yearsInBusiness: "10+",
  factory: "Foshan, China",
  poolBrand: "Astral",
  // Canonical URL. NEXT_PUBLIC_URL is localhost in dev and the real
  // domain in Vercel; the fallback is the production home.
  url: process.env.NEXT_PUBLIC_URL || "https://www.aumosaic.com",
  instagram: "https://www.instagram.com/aumosaic/",
  telegram: "https://t.me/aumosaics",
  // WhatsApp Business number, international format, digits only.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "2347077550283",
  phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY || "+234 707 755 0283",
  // A second line the flyers list; the WhatsApp number above is primary.
  phoneDisplay2: "+234 816 725 4287",
  // Owner-confirmed, Business Discovery 2026-07-04.
  legalName: "AU Mosaic Enterprises",
  founded: "2016",
};

/* One word each, the Apple way. Inside a mosaic house, Tiles needs
   no chaperone. */
export const NAV = [
  { href: "/mosaic-tiles", label: "Tiles" },
  { href: "/pool-materials", label: "Materials" },
  { href: "/pools", label: "Pools" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
