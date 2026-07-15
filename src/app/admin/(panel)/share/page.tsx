import Link from "next/link";
import { eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { phone234 } from "@/lib/backoffice";
import Back from "../Back";
import KeepEnquiry from "./KeepEnquiry";
import MatchPanel from "./MatchPanel";
import ReadChat from "./ReadChat";

/* The bridge from WhatsApp. A share, a paste, or the exported file all
   land here; the book reads what they want into a draft order, and a
   number in the words still ties the person the book already knows.
   Android with Chrome carries the share target; iPhone pastes. */

export const dynamic = "force-dynamic";

function phonesIn(input: string): string[] {
  const found = input.match(/(?:\+?234|0)[\s\-()]*\d(?:[\s\-()]*\d){8,9}/g) ?? [];
  return [...new Set(found.map(phone234).filter((d) => d.length === 13))];
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; text?: string; url?: string; from?: string }>;
}) {
  const { title, text, url, from } = await searchParams;
  const db = getDb();

  /* A share that came through the receive route stashed its words as an
     enquiry; load them back. Otherwise read what the query carried. */
  let shared = [title, text, url].filter(Boolean).join("\n").trim();
  if (from) {
    try {
      const [row] = await db
        .select({ message: schema.enquiries.message })
        .from(schema.enquiries)
        .where(eq(schema.enquiries.id, from));
      if (row?.message) shared = row.message;
    } catch {
      /* the bridge still opens without it */
    }
  }

  const candidates = phonesIn(shared);
  let match: { id: string; name: string; phone: string; area: string } | null = null;
  if (candidates.length > 0) {
    try {
      const people = await db
        .select({
          id: schema.customers.id,
          name: schema.customers.name,
          phone: schema.customers.phone,
          area: schema.customers.area,
        })
        .from(schema.customers)
        .where(ne(schema.customers.phone, ""));
      match = people.find((p) => candidates.includes(phone234(p.phone))) ?? null;
    } catch {
      /* no match is a fine answer */
    }
  }
  const firstPhone = candidates[0] ?? "";

  return (
    <main>
      <Back href="/admin" label="Home" />
      <p className="eyebrow mt-6">The bridge</p>
      <h1 className="mt-3 font-serif text-display-section">From WhatsApp.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Share or paste a chat. We draft the order.
      </p>

      {match && <MatchPanel match={match} />}

      <div className="mt-6 max-w-md xl:max-w-none">
        <ReadChat
          initialText={shared}
          matchedCustomer={match ? { id: match.id, name: match.name } : null}
          suggestedPhone={firstPhone}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-6">
        <Link href="/admin/orders/new" className="link-hair text-[12px] text-dusk">
          Start a blank order
        </Link>
        {shared && <KeepEnquiry message={shared} customerId={match?.id ?? null} />}
      </div>

      <p className="mt-8 max-w-md text-[14px] leading-relaxed text-mist">
        Android with Chrome can share in. On iPhone, paste above.
      </p>
    </main>
  );
}
