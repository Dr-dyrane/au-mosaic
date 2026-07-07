import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuSign } from "@/components/Mosaic";
import { AdminRailNav, AdminTabBar } from "@/components/AdminNav";
import { AdminContextRail, AdminMobileContext } from "@/components/AdminContext";
import PalettePicker from "@/components/PalettePicker";
import ThemeToggle from "@/components/ThemeToggle";
import { readAdminPulse } from "@/lib/admin-pulse";
import { getDataMode } from "@/lib/data-mode";
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
  const pulse = await readAdminPulse();
  const owed = pulse.owingCustomers;
  const mode = await getDataMode();
  return (
    <div className="admin-rooms mx-auto grid min-h-svh w-full max-w-[1540px] grid-cols-1 px-5 pb-36 tabular-nums sm:px-8 sm:pb-36 xl:grid-cols-[220px_minmax(0,1fr)_280px] xl:gap-8 xl:px-8 xl:pb-8">
      <aside className="layer-admin-nav hidden xl:sticky xl:top-0 xl:flex xl:h-svh xl:flex-col xl:overflow-y-auto xl:py-6">
        <div className="glass liquid-glass flex min-h-[calc(100svh-48px)] flex-col rounded-[32px] p-5">
          <Link href="/admin" className="flex shrink-0 items-center gap-2.5" aria-label="Back office home">
            <AuSign markClassName="h-[15px]" />
            <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
              Back office
            </span>
          </Link>
          <AdminRailNav owed={owed} />
          <div className="mt-auto flex flex-col items-start gap-6">
            <div className="flex flex-col items-start gap-3">
              <Link href="/" className="link-hair text-dusk text-[12px]">
                The site
              </Link>
              <button data-tour-start="menu" className="link-hair text-dusk text-[12px]">
                Take the tour
              </button>
            </div>
            <div className="flex flex-col items-start gap-4">
              <PalettePicker />
              <ThemeToggle />
            </div>
            <form action={logout}>
              <button type="submit" className="link-hair text-dusk text-[12px]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <section className="min-w-0 py-8 xl:py-10">
        {mode === "demo" && (
          <div className="panel mb-6 flex items-center gap-3 py-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold">
              Demo data on. Samples show beside real business.
            </p>
          </div>
        )}
        <header className="pb-9 xl:hidden">
          <div className="flex items-center justify-between gap-6">
            <Link href="/admin" className="flex shrink-0 items-center gap-2.5" aria-label="Back office home">
              <AuSign markClassName="h-[15px]" />
              <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
                Back office
              </span>
            </Link>
            <form action={logout}>
              <button type="submit" className="link-hair text-dusk text-[12px]">
                Sign out
              </button>
            </form>
          </div>
          <div className="mt-6 flex items-center justify-between gap-5">
            <div className="flex shrink-0 items-center gap-3">
              <PalettePicker />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <AdminMobileContext pulse={pulse} />
        <div>{children}</div>
        <footer className="mt-24 flex flex-wrap items-center justify-between gap-5 pt-8 xl:hidden">
          <p className="text-[11px] uppercase tracking-[0.18em] text-mist">
            The back office · AU Mosaic
          </p>
          <div className="flex items-center gap-5">
            <Link href="/admin/settings" className="link-hair text-dusk text-[12px]">
              Settings
            </Link>
            <Link href="/" className="link-hair text-dusk text-[12px]">
              The site
            </Link>
          </div>
        </footer>
      </section>
      <AdminContextRail pulse={pulse} />
      <AdminTabBar />
      <Tour />
    </div>
  );
}
