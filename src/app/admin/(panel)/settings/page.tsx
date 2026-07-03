import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { whoAmI } from "@/lib/admin-auth";
import SettingsForm from "./SettingsForm";
import AddStaffForm from "./AddStaffForm";
import KeyRow from "./KeyRow";
import NotifyToggle from "./NotifyToggle";

/* The facts of the house, and the keys to its door. Today the site
   still reads its built-in facts; when the seam flips, it reads
   these. The key rack shows only to the owner; before the staff
   table lands it teaches the two commands instead of erroring. */

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rows = await getDb().select().from(schema.settings);
  const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const who = await whoAmI();

  /* The key rack reads gently: a missing table means the migration
     has not run yet, not a broken room. */
  let staffRows: { id: string; name: string; role: string; active: boolean }[] | null = null;
  try {
    staffRows = await getDb()
      .select({
        id: schema.staff.id,
        name: schema.staff.name,
        role: schema.staff.role,
        active: schema.staff.active,
      })
      .from(schema.staff)
      .orderBy(asc(schema.staff.createdAt));
  } catch {
    staffRows = null;
  }

  return (
    <main>
      <p className="eyebrow">Settings</p>
      <h1 className="font-serif text-display-section mt-3">The house facts.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        The number, the hours, the address. Live once the site reads the book.
      </p>
      {/* The desk gets two columns; the phone keeps its single file.
          The facts lead on the left, the quieter panels stack right. */}
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-2">
        <SettingsForm values={values} />

        <div className="grid gap-8">
      {who?.role === "owner" && (
        <div className="panel">
          <p className="font-serif text-[20px]">The keys to the door</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Named keys for the people who help. Every save signs the
            history with its name; a key taken back stops turning but
            its story stays.
          </p>
          {staffRows === null ? (
            <p className="mt-4 text-[13px] leading-relaxed text-dusk">
              The key rack arrives with the next update: run npm run
              db:push once, and this panel wakes up.
            </p>
          ) : (
            <>
              {staffRows.length > 0 && (
                <div className="mt-4 divide-y divide-transparent">
                  {staffRows.map((s) => (
                    <KeyRow key={s.id} id={s.id} name={s.name} active={s.active} />
                  ))}
                </div>
              )}
              <AddStaffForm />
            </>
          )}
          <p className="mt-6 text-[13px] leading-relaxed text-dusk">
            Your own master key stays in the Vercel dashboard, under
            Environment Variables, and the next deploy carries it.
          </p>
        </div>
      )}

      <div className="panel">
        <p className="font-serif text-[20px]">The morning tap</p>
        <p className="mt-2 text-[14px] leading-relaxed text-dusk">
          The glance, brought to the phone: what runs low, what is
          owed, what came in fresh.
        </p>
        <NotifyToggle />
      </div>

      <div className="panel">
        <p className="font-serif text-[20px]">The book&apos;s history</p>
        <p className="mt-2 text-[14px] leading-relaxed text-dusk">
          Every save, step, and key, in sentences: who did what, and when.
        </p>
        <Link
          href="/admin/settings/history"
          className="link-hair mt-4 inline-block text-dusk text-[13px]"
        >
          Read the history
        </Link>
      </div>
        </div>
      </div>
    </main>
  );
}
