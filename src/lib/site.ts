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
  // Canonical URL: the vercel.app link until the domain (au-mosaic.shop) is bought,
  // then set NEXT_PUBLIC_SITE_URL in Vercel and add the domain to the project.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://au-mosaic.vercel.app",
  instagram: "https://instagram.com", // TODO: real handle
  // WhatsApp Business number, international format, digits only.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "2347077550283",
  phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY || "+234 707 755 0283",
};

export const NAV = [
  { href: "/mosaic-tiles", label: "Mosaic tiles" },
  { href: "/pool-materials", label: "Pool materials" },
  { href: "/pools", label: "Pool construction" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
