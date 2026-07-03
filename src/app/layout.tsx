import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE } from "@/lib/site";
import WaTracker from "@/components/WaTracker";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.shortName} · The house of mosaic, Lagos`,
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
  themeColor: "#eef6f3",
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
    <html lang="en" data-theme="light" data-palette="lagoon" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full font-sans">
        {/* Lagoon daylight is the default; apply saved night and
            palette preferences before paint. Maison is the bare root,
            so choosing it removes the attribute. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('aumosaic.theme')==='dark')delete document.documentElement.dataset.theme;var p=localStorage.getItem('aumosaic.palette');if(p==='maison'){delete document.documentElement.dataset.palette}else if(p){document.documentElement.dataset.palette=p}}catch(e){}",
          }}
        />
        {children}
        <Analytics />
        <WaTracker />
      </body>
    </html>
  );
}
