/* Reset the book: a one-off maintenance script the owner runs to make a
   clean production start. Two jobs, each behind its own flag:

     --history   empty the audit log (the book's history).
     --demo      remove ONLY clearly-marked demo and seed rows.
     --all       both of the above.

   Dry run is the DEFAULT and the safe floor. With no write flag, or
   with --dry passed, the script counts what it would remove and writes
   nothing. A real deletion needs an explicit flag. Even then, add --dry
   to preview that flag's plan without touching a row.

   What --demo treats as demo, and nothing else:
     · customers whose name starts "Sample "   (the seed's sample people)
     · orders whose note starts "DEMO"          (the seed's sample orders)
     · enquiries whose source is "demo"         (the seed's sample enquiries)
   and the child rows of those demo orders: order_items, payments, and
   deliveries. Sales motions on demo customers go too, so the customer
   row can leave without breaking a foreign key.

   What --demo NEVER touches, because it is real production data and a
   test the owner asked to keep:
     · the customer note "Read from a WhatsApp chat"
     · enquiries whose source is "share"

   Run: npm run reset:book                 (dry run, counts only, safe)
        npm run reset:book -- --history    (empty the history for real)
        npm run reset:book -- --demo       (remove demo rows for real)
        npm run reset:book -- --all        (both, for real)
        npm run reset:book -- --all --dry  (preview both, touch nothing)

   Relative imports on purpose; this runs outside Next's path aliases,
   mirroring scripts/demo-seed.ts. */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { count, eq, inArray, like } from "drizzle-orm";
import * as schema from "../src/db/schema";

const args = new Set(process.argv.slice(2));
const WANT_HISTORY = args.has("--history") || args.has("--all");
const WANT_DEMO = args.has("--demo") || args.has("--all");
/* Dry run is the floor: the default when no write flag is given, and
   forced whenever --dry is passed. Any real write needs a flag. */
const DRY = args.has("--dry") || (!WANT_HISTORY && !WANT_DEMO);

/* The same markers the demo seed tags its rows with, and only these. */
const SAMPLE_NAME = "Sample %";
const DEMO_NOTE = "DEMO%";
const DEMO_SOURCE = "demo";

type Db = ReturnType<typeof drizzle>;

async function tableCount(db: Db): Promise<number> {
  const [row] = await db.select({ n: count() }).from(schema.auditLog);
  return row?.n ?? 0;
}

/* The demo footprint, resolved to ids so counts and deletes agree on
   exactly the same rows. Orders are the marked demo orders; customers
   are the marked sample people. Child ids follow from the order ids. */
async function demoFootprint(db: Db) {
  const demoOrders = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(like(schema.orders.note, DEMO_NOTE));
  const orderIds = demoOrders.map((o) => o.id);

  const demoCustomers = await db
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(like(schema.customers.name, SAMPLE_NAME));
  const customerIds = demoCustomers.map((c) => c.id);

  let items = 0;
  let payments = 0;
  let deliveries = 0;
  if (orderIds.length > 0) {
    const [it] = await db
      .select({ n: count() })
      .from(schema.orderItems)
      .where(inArray(schema.orderItems.orderId, orderIds));
    const [pm] = await db
      .select({ n: count() })
      .from(schema.payments)
      .where(inArray(schema.payments.orderId, orderIds));
    const [dl] = await db
      .select({ n: count() })
      .from(schema.deliveries)
      .where(inArray(schema.deliveries.orderId, orderIds));
    items = it?.n ?? 0;
    payments = pm?.n ?? 0;
    deliveries = dl?.n ?? 0;
  }

  let enquiries = 0;
  {
    const [en] = await db
      .select({ n: count() })
      .from(schema.enquiries)
      .where(eq(schema.enquiries.source, DEMO_SOURCE));
    enquiries = en?.n ?? 0;
  }

  /* Sales motions on the sample customers, so the customer rows can
     leave without tripping their foreign key. */
  let motions = 0;
  if (customerIds.length > 0) {
    const [mo] = await db
      .select({ n: count() })
      .from(schema.salesMotions)
      .where(inArray(schema.salesMotions.customerId, customerIds));
    motions = mo?.n ?? 0;
  }

  return { orderIds, customerIds, items, payments, deliveries, enquiries, motions };
}

/* Delete the demo footprint in foreign-key-safe order: the children of
   the demo orders first, then the orders, then the enquiries and sales
   motions that point at the sample customers, then the customers. */
async function deleteDemo(db: Db, f: Awaited<ReturnType<typeof demoFootprint>>) {
  if (f.orderIds.length > 0) {
    await db.delete(schema.orderItems).where(inArray(schema.orderItems.orderId, f.orderIds));
    await db.delete(schema.payments).where(inArray(schema.payments.orderId, f.orderIds));
    await db.delete(schema.deliveries).where(inArray(schema.deliveries.orderId, f.orderIds));
    await db.delete(schema.orders).where(inArray(schema.orders.id, f.orderIds));
  }

  await db.delete(schema.enquiries).where(eq(schema.enquiries.source, DEMO_SOURCE));

  if (f.customerIds.length > 0) {
    await db
      .delete(schema.salesMotions)
      .where(inArray(schema.salesMotions.customerId, f.customerIds));
    await db.delete(schema.customers).where(inArray(schema.customers.id, f.customerIds));
  }
}

function printDemoPlan(f: Awaited<ReturnType<typeof demoFootprint>>) {
  console.log("Demo and seed rows:");
  console.log(`  · customers (name starts "Sample "): ${f.customerIds.length}`);
  console.log(`  · orders    (note starts "DEMO")    : ${f.orderIds.length}`);
  console.log(`      order items : ${f.items}`);
  console.log(`      payments    : ${f.payments}`);
  console.log(`      deliveries  : ${f.deliveries}`);
  console.log(`  · enquiries (source "demo")         : ${f.enquiries}`);
  console.log(`  · sales motions on those customers  : ${f.motions}`);
  console.log('  Kept on purpose: note "Read from a WhatsApp chat", enquiries source "share".');
}

async function main() {
  if (!WANT_HISTORY && !WANT_DEMO) {
    console.log("RESET BOOK (dry run, no flag given, nothing will be written)\n");
    console.log("Pass a flag to act: --history, --demo, or --all.");
    console.log("Add --dry to any flag to preview its plan without writing.\n");
  } else if (DRY) {
    console.log("RESET BOOK (dry run, --dry, nothing will be written)\n");
  } else {
    console.log("RESET BOOK (writing)\n");
  }

  try {
    process.loadEnvFile(".env");
  } catch {}
  try {
    process.loadEnvFile(".env.local");
  } catch {}
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const db = drizzle(neon(url), { schema, casing: "snake_case" });

  if (WANT_HISTORY || !WANT_DEMO) {
    const lines = await tableCount(db);
    if (WANT_HISTORY) {
      console.log(`History: ${lines} line(s) in the audit log.`);
      if (!DRY) {
        await db.delete(schema.auditLog);
        console.log("  Emptied the audit log.");
      } else {
        console.log("  Would empty the audit log.");
      }
      console.log("");
    } else {
      /* No write flag at all: still show the shape of the book so the
         owner sees what a real run would face. */
      console.log(`History: ${lines} line(s) in the audit log (use --history to empty).\n`);
    }
  }

  if (WANT_DEMO || (!WANT_HISTORY && !WANT_DEMO)) {
    const f = await demoFootprint(db);
    printDemoPlan(f);
    if (WANT_DEMO) {
      if (!DRY) {
        await deleteDemo(db, f);
        console.log("  Removed every demo and seed row above.");
      } else {
        console.log("  Would remove every demo and seed row above.");
      }
    }
    console.log("");
  }

  if (DRY) {
    console.log("Nothing was written. Re-run with a flag and without --dry to act.");
  } else {
    console.log("Done.");
  }
}

main().then(() => process.exit(0));
