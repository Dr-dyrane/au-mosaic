import Link from "next/link";
import { ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { phone234 } from "@/lib/backoffice";
import Back from "../Back";
import KeepEnquiry from "./KeepEnquiry";

/* The bridge from WhatsApp: share a chat into the installed app and
   the book answers with the person it already knows. A phone number
   in the shared text is matched against the customers; the offers
   follow from there. Android with Chrome carries share_target; the
   iPhone caveat is written where he will read it. */

export const dynamic = "force-dynamic";

/* Any 234, +234, or 0-prefixed run that reads like a Nigerian
   mobile: tolerant of spaces, dashes, and brackets. */
function phonesIn(text: string): string[] {
  const found = text.match(/(?:\+?234|0)[\s\-()]*\d(?:[\s\-()]*\d){8,9}/g) ?? [];
  return [...new Set(found.map(phone234).filter((d) => d.length === 13))];
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; text?: string; url?: string }>;
}) {
  const { title, text, url } = await searchParams;
  const shared = [title, text, url].filter(Boolean).join("\n").trim();
  const candidates = phonesIn(shared);

  let match: { id: string; name: string; phone: string; area: string } | null = null;
  if (candidates.length > 0) {
    const people = await getDb()
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        phone: schema.customers.phone,
        area: schema.customers.area,
      })
      .from(schema.customers)
      .where(ne(schema.customers.phone, ""));
    match = people.find((p) => candidates.includes(phone234(p.phone))) ?? null;
  }

  const firstPhone = candidates[0];

  return (
    <main>
      <Back href="/admin" label="The glance" />
      <p className="eyebrow mt-6">The bridge</p>
      <h1 className="font-serif text-display-section mt-3">From WhatsApp.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        What you shared, met by the book.
      </p>

      {shared ? (
        <div className="panel mt-8 max-w-2xl">
          <p className="eyebrow">What arrived</p>
          <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-dusk">
            {shared.length > 400 ? `${shared.slice(0, 400)}...` : shared}
          </p>
        </div>
      ) : (
        <div className="panel mt-8 max-w-md">
          <p className="font-serif text-[20px]">Nothing arrived with the share.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Share a chat or a contact into the app and this room reads
            the number out of it.
          </p>
        </div>
      )}

      {match && (
        <div className="panel mt-5 max-w-2xl">
          <p className="eyebrow">The book knows them</p>
          <p className="font-serif mt-3 text-[26px]">{match.name}</p>
          <p className="mt-2 text-[13px] text-dusk">
            {[match.phone, match.area].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <Link href={`/admin/orders/new?customer=${match.id}`} className="btn-gold">
              New order for {match.name.split(" ")[0]}
            </Link>
            <Link href={`/admin/customers/${match.id}`} className="link-hair text-dusk text-[13px]">
              Their record
            </Link>
          </div>
          {shared && (
            <div className="mt-5">
              <KeepEnquiry message={shared} customerId={match.id} />
            </div>
          )}
        </div>
      )}

      {!match && shared && (
        <div className="panel mt-5 max-w-2xl">
          <p className="font-serif text-[20px]">
            {firstPhone
              ? "No one in the book carries this number."
              : "No number in what was shared."}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <Link
              href={firstPhone ? `/admin/customers/new?phone=${firstPhone}` : "/admin/customers/new"}
              className="btn-gold"
            >
              New customer
            </Link>
            <Link href="/admin/orders/new" className="link-hair text-dusk text-[13px]">
              New order
            </Link>
          </div>
          <div className="mt-5">
            <KeepEnquiry message={shared} customerId={null} />
          </div>
        </div>
      )}

      <p className="mt-8 max-w-md text-[13px] leading-relaxed text-mist">
        Sharing into the app works on Android with Chrome. On iPhone,
        copy the message and open the room you need; the book meets
        you there.
      </p>
    </main>
  );
}
