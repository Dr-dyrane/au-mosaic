import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuMark } from "@/components/Mosaic";
import { AdminTabBar, AdminTopNav } from "@/components/AdminNav";
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
  return (
    <div className="mx-auto min-h-svh max-w-6xl px-5 pb-32 sm:px-8 sm:pb-24">
      <header className="flex items-center justify-between gap-6 pb-10 pt-8">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5" aria-label="Back office home">
          <AuMark className="h-[14px] w-auto" />
          <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
            Back office
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <AdminTopNav />
          <form action={logout}>
            <button type="submit" className="link-hair text-dusk text-[13px]">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
      <AdminTabBar />
    </div>
  );
}
