import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { whoAmI } from "@/lib/admin-auth";
import SettingsForm from "./SettingsForm";
import AddStaffForm from "./AddStaffForm";
import KeyRow from "./KeyRow";
import NotifyToggle from "./NotifyToggle";
import DataModeToggle from "./DataModeToggle";
import TourReset from "./TourReset";
import OutboxReview from "@/components/OutboxReview";
import Teach from "../Teach";

/* The facts of the house, and the keys to its door. Today the site
   still reads its built-in facts; when the seam flips, it reads
   these. The key rack shows only to the owner. */

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rows = await getDb().select().from(schema.settings);
  const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const who = await whoAmI();

  /* The key rack reads gently when staff keys are not ready yet. */
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
        Number, hours, address.
      </p>
      {/* The desk gets two columns; the phone keeps its single file.
          The facts lead on the left, the quieter panels stack right. */}
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-2">
        <SettingsForm values={values} />

        <div className="grid gap-8">
      {who?.role === "owner" && (
        <div className="panel">
          <p className="font-serif text-[20px]">The keys to the door</p>
          <Teach>
            <p className="mt-2 text-[14px] leading-relaxed text-dusk">
              Named keys for the people who help.
            </p>
          </Teach>
          {staffRows === null ? (
            <p className="mt-4 text-[14px] leading-relaxed text-dusk">
              Not ready yet. Turn on staff keys.
            </p>
          ) : (
            <>
              {staffRows.length > 0 && (
                <div className="mt-4">
                  {staffRows.map((s) => (
                    <KeyRow key={s.id} id={s.id} name={s.name} active={s.active} />
                  ))}
                </div>
              )}
              <AddStaffForm />
            </>
          )}
          <p className="mt-6 text-[14px] leading-relaxed text-dusk">
            Your master key stays with you.
          </p>
        </div>
      )}

      {who?.role === "owner" && (
        <div className="panel">
          <p className="font-serif text-[20px]">Live or demo</p>
          <Teach>
            <p className="mt-2 text-[14px] leading-relaxed text-dusk">
              Show sample data for a walkthrough, or keep the book real.
            </p>
          </Teach>
          <DataModeToggle mode={values.data_mode === "demo" ? "demo" : "live"} />
        </div>
      )}

      <div className="panel">
        <p className="font-serif text-[20px]">The morning tap</p>
        <Teach>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            The glance, on your phone each morning.
          </p>
        </Teach>
        <NotifyToggle />
      </div>

      <div className="panel">
        <p className="font-serif text-[20px]">The book&apos;s history</p>
        <Teach>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Who did what, and when.
          </p>
        </Teach>
        <Link
          href="/admin/settings/history"
          className="link-hair mt-4 inline-block text-dusk text-[12px]"
        >
          Read the history
        </Link>
      </div>

      <OutboxReview />
      <div className="panel">
        <p className="font-serif text-[20px]">The welcome</p>
        <p className="mt-2 text-[14px] leading-relaxed text-dusk">
          Show the welcome again on this device.
        </p>
        <TourReset />
      </div>
        </div>
      </div>
    </main>
  );
}
