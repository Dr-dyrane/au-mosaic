/* AU Mosaic · business facts. One source of truth, straight from the
   owner's Business Discovery answers. */

export const SITE = {
  name: "AU Mosaic and Pool Materials",
  shortName: "AU Mosaic",
  tagline: "The house of mosaic.",
  description:
    "The house of mosaic in Lagos. Pool mosaic, glass, art, and the pools themselves. Largest stock on ground, direct from our own factory line.",
  location: "Agric Market, Lagos",
  hours: "Mon to Sat, 8:30am to 5pm",
  yearsInBusiness: "10+",
  factory: "Foshan, China",
  poolBrand: "Astral",
  // Canonical URL. NEXT_PUBLIC_URL is localhost in dev and the real
  // domain in Vercel; the fallback is the production home.
  url: process.env.NEXT_PUBLIC_URL || "https://www.aumosaic.com",
  instagram: "https://instagram.com", // TODO: real handle
  // WhatsApp Business number, international format, digits only.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "2347077550283",
  phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY || "+234 707 755 0283",
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
