import type { Metadata } from "next";
import AdminSw from "@/components/AdminSw";
import OfflineMirror from "@/components/OfflineMirror";

/* The whole /admin tree, login included, wears app clothes: its own
   manifest and service worker scoped to /admin, a real installable
   PWA that opens past the browser chrome, never at the shop window. */

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
  return (
    <>
      <AdminSw />
      <OfflineMirror />
      {children}
    </>
  );
}
