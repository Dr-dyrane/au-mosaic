import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { AuMark } from "@/components/Mosaic";
import { AdminTabBar, AdminTopNav } from "@/components/AdminNav";
import PalettePicker from "@/components/PalettePicker";
import ThemeToggle from "@/components/ThemeToggle";
import { hasSession } from "@/lib/admin-auth";
import { logout } from "../login/actions";

/* How many customers owe the house: the one number worth carrying on
   the nav itself. Counted per request; if the database is quiet the
   badge simply stays home. */
async function owedCount(): Promise<number> {
  try {
    const rows = await getDb().execute(sql`
      select count(*)::int as n from (
        select o.customer_id
        from orders o
        where o.status not in ('enquiry','settled')
        group by o.customer_id
        having
          coalesce((select sum(i.given_price_kobo * i.quantity)
            from order_items i join orders oi on oi.id = i.order_id
            where oi.customer_id = o.customer_id
              and oi.status not in ('enquiry','settled')), 0)
          -
          coalesce((select sum(p.amount_kobo)
            from payments p join orders op on op.id = p.order_id
            where op.customer_id = o.customer_id
              and op.status not in ('enquiry','settled')), 0)
          > 0
      ) t`);
    const list = Array.isArray(rows) ? rows : ((rows as { rows?: { n?: number }[] }).rows ?? []);
    return Number(list[0]?.n ?? 0);
  } catch {
    return 0;
  }
}

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
  const owed = await owedCount();
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
          <AdminTopNav owed={owed} />
          <form action={logout}>
            <button type="submit" className="link-hair text-dusk text-[13px]">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
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
    </div>
  );
}
