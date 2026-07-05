import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuSign } from "@/components/Mosaic";
import { AdminTabBar, AdminTopNav } from "@/components/AdminNav";
import PalettePicker from "@/components/PalettePicker";
import ThemeToggle from "@/components/ThemeToggle";
import { readAdminPulse } from "@/lib/admin-pulse";
import Tour from "./Tour";
import { hasSession } from "@/lib/admin-auth";
import { logout } from "../login/actions";

/* Every page in this group stands behind the door. The login page
   lives outside the group, so the guard cannot loop. The back office
   wears its own clothes: no island, no footer, no WhatsApp float,
   just the brand, the rooms, and a tab bar under the thumb on the
   phone. */

export const metadata: Metadata = {
  title: "Back office",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasSession())) redirect("/admin/login");
  const owed = (await readAdminPulse()).owingCustomers;
  return (
    /* A flex column so short rooms still hold the footer at the
       floor: the children stretch, the footer never drifts up. */
    <div className="admin-rooms tabular-nums mx-auto flex min-h-svh max-w-6xl flex-col px-5 pb-32 sm:px-8 sm:pb-24">
      <header className="flex items-center justify-between gap-6 pb-10 pt-8">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5" aria-label="Back office home">
          <AuSign markClassName="h-[15px]" />
          <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
            Back office
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <AdminTopNav owed={owed} />
          <form action={logout}>
            <button type="submit" className="link-hair text-dusk text-[13px]">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      {/* The office footer: the same suns and houses as the shop
          window, so his dashboard wears the clothes he chose. */}
      <footer className="mt-24 flex flex-wrap items-center justify-between gap-5 pt-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-mist">
          The back office · AU Mosaic
        </p>
        <div className="flex items-center gap-5">
          <Link href="/admin/settings" className="link-hair text-dusk text-[12px]">
            Settings
          </Link>
          <PalettePicker />
          <ThemeToggle />
        </div>
      </footer>
      <AdminTabBar owed={owed} />
      <Tour />
    </div>
  );
}
