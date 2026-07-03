import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuMark } from "@/components/Mosaic";
import { hasSession } from "@/lib/admin-auth";
import { logout } from "../login/actions";

/* Every page in this group stands behind the door. The login page
   lives outside the group, so the guard cannot loop. */

export const metadata: Metadata = {
  title: "Back office",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasSession())) redirect("/admin/login");
  return (
    <div className="mx-auto min-h-svh max-w-6xl px-5 pb-24 sm:px-8">
      <header className="flex items-center justify-between pb-10 pt-8">
        <Link href="/admin" className="flex items-center gap-2.5">
          <AuMark className="h-[14px] w-auto" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
            Back office
          </span>
        </Link>
        <div className="flex items-center gap-7">
          <Link href="/" className="link-hair text-dusk text-[13px]">
            The site
          </Link>
          <form action={logout}>
            <button type="submit" className="link-hair text-dusk text-[13px]">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
