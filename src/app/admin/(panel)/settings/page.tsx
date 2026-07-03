import { getDb, schema } from "@/db";
import SettingsForm from "./SettingsForm";

/* The facts of the house. Today the site still reads its built-in
   facts; when the seam flips, it reads these. Editing here is safe
   either way: nothing public changes until then. */

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rows = await getDb().select().from(schema.settings);
  const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <main>
      <p className="eyebrow">Settings</p>
      <h1 className="font-serif text-display-section mt-3">The house facts.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        The number, the hours, the address. The shop window reads these
        once the book and the site become one; until then, edits wait
        here safely.
      </p>
      <SettingsForm values={values} />
      <div className="panel mt-8 max-w-xl">
        <p className="font-serif text-[20px]">The key to the door</p>
        <p className="mt-2 text-[14px] leading-relaxed text-dusk">
          The password does not live here on purpose. It changes in the
          Vercel dashboard, under Environment Variables, and the next
          deploy carries it.
        </p>
      </div>
    </main>
  );
}
