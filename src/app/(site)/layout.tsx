import { SITE } from "@/lib/site";
import { scriptJson } from "@/lib/jsonld";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

/* The flagship's chrome lives here, not in the root: the island, the
   footer, and the WhatsApp float belong to the shop window. The back
   office wears its own clothes. */

/* The business card, enriched but honest: only facts the house
   actually states. The Instagram link joins sameAs once the real
   handle lands in site.ts. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  telephone: SITE.phoneDisplay,
  image: `${SITE.url.replace(/\/$/, "")}/og.png`,
  priceRange: "₦₦",
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.address,
    addressLocality: "Lagos",
    addressCountry: "NG",
  },
  areaServed: "Nigeria",
  openingHours: "Mo-Sa 08:30-17:00",
  ...(SITE.instagram.includes("instagram.com/") && SITE.instagram !== "https://instagram.com"
    ? { sameAs: [SITE.instagram, SITE.telegram] }
    : {}),
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: scriptJson(jsonLd) }}
      />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
