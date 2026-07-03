import type { Metadata } from "next";

/* The whole /admin tree, login included, wears app clothes: its own
   manifest scoped to /admin, so Add to Home Screen puts the back
   office on the owner's phone as an app of its own, opening past the
   browser chrome, never at the shop window. */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/admin.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Back office",
    statusBarStyle: "default",
  },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
