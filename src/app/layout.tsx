import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE } from "@/lib/site";
import WaTracker from "@/components/WaTracker";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  /* Titles speak search-plain; the pages beneath keep house voice. */
  title: {
    default: `${SITE.shortName} · Mosaic tiles, pool materials, and pools in Lagos`,
    template: `%s · ${SITE.shortName}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.shortName} · The house of mosaic`,
    description: SITE.description,
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "AU Mosaic, the house of mosaic in Lagos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.shortName} · The house of mosaic`,
    description: SITE.description,
    images: ["/og.png"],
  },
};

export const viewport = {
  themeColor: "#eef3fa",
  /* Edge to edge on notched phones; safe-area insets take over. */
  viewportFit: "cover" as const,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-palette="royal"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans">
        {/* Royal daylight is the default: the owner's own brand at
            the front door. Saved night and palette choices apply
            before paint; Maison is the bare root, so choosing it
            removes the attribute. */}
        <Script src="/theme-before-paint.js" strategy="beforeInteractive" />
        {children}
        <Analytics />
        <WaTracker />
      </body>
    </html>
  );
}
