import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import NewOrderForm from "./NewOrderForm";

/* A new page in the book. One choice matters here, who is buying.
   Everything else, the lines, the money, the walk down the line,
   happens on the order's own page. */

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const db = getDb();
  const customers = await db
    .select({ id: schema.customers.id, name: schema.customers.name })
    .from(schema.customers)
    .orderBy(asc(schema.customers.name));

  return (
    <main>
      <Link href="/admin/orders" className="link-hair text-dusk text-[13px]">
        All orders
      </Link>
      <h1 className="font-serif text-display-section mt-6">A new order.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        It opens as an enquiry. Lines and payments go on the order page,
        one step at a time.
      </p>

      {customers.length === 0 ? (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">The first order needs a customer.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Add the person first. The order follows them, and so does
            their history.
          </p>
          <Link
            href="/admin/customers/new"
            className="link-hair mt-5 inline-block text-dusk text-[13px]"
          >
            Add a customer
          </Link>
        </div>
      ) : (
        <NewOrderForm customers={customers} />
      )}
    </main>
  );
}
