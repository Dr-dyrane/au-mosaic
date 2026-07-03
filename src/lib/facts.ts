import { unstable_cache } from "next/cache";
import { getDb, schema } from "@/db";
import { SITE } from "./site";

/* The house facts for the window: the settings table first, site.ts
   standing behind it, so the contact page and the footer say what
   he last saved in the office. Cached under the facts tag; saving
   the facts revalidates it. The WhatsApp number itself stays in the
   environment because the chat links are client-side and minted at
   build. */

export type Facts = {
  location: string;
  hours: string;
  phoneDisplay: string;
  instagram: string;
};

const readFacts = unstable_cache(
  async () => {
    const rows = await getDb().select().from(schema.settings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },
  ["house-facts"],
  { tags: ["facts"], revalidate: 3600 }
);

export async function getFacts(): Promise<Facts> {
  let v: Record<string, string> = {};
  try {
    v = await readFacts();
  } catch {}
  return {
    location: v.location || SITE.location,
    hours: v.hours || SITE.hours,
    phoneDisplay: v.phone_display || SITE.phoneDisplay,
    instagram: v.instagram || SITE.instagram,
  };
}
