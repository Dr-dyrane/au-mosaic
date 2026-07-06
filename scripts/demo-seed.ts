/* Demo seed: a clearly-marked sample workflow so every back-office room
   opens alive for a walkthrough. Three sample customers, three orders
   across the pipeline, payments, one settled and two still owing,
   deliveries scheduled and delivered, fresh enquiries, and a couple of
   sales motions. Nothing real is touched.

   Every row is tagged so it is obvious and removable: customer names
   start "Sample ·", the notes start "DEMO", enquiries carry source
   "demo". Phone numbers are placeholders (234 800 000 000x), so a
   WhatsApp action never opens a real person.

   Idempotent: a seed run clears its own demo rows first, then reinserts,
   so it is safe to run twice. Removal lifts it all back out.

   Run: npm run demo:seed          (owner runs it; needs DATABASE_URL)
        npm run demo:clear         (remove every demo row)
        npm run demo:seed -- --dry (print the plan, touch no database)

   Relative imports on purpose; this runs outside Next's path aliases,
   mirroring scripts/seed.ts. Money is kobo integers, naira only here. */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, like } from "drizzle-orm";
import * as schema from "../src/db/schema";

const args = new Set(process.argv.slice(2));
const CLEAR_ONLY = args.has("--clear");
const DRY = args.has("--dry");

const naira = (n: number) => Math.round(n * 100);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const money = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;

/* The markers cleanup keys off. Customers, orders, and sales motions are
   found by a note that starts "DEMO"; enquiries by their source. */
const DEMO_NOTE = "DEMO sample, safe to remove";
const DEMO_SOURCE = "demo";

type CustomerKey = "adaeze" | "chibuzo" | "funke";

const CUSTOMERS: { key: CustomerKey; name: string; phone: string; area: string; createdAt: Date }[] = [
  { key: "adaeze", name: "Sample · Adaeze Okonkwo", phone: "2348000000001", area: "Lekki Phase 1", createdAt: daysAgo(24) },
  { key: "chibuzo", name: "Sample · Chibuzo Eze", phone: "2348000000002", area: "Ikeja GRA", createdAt: daysAgo(12) },
  { key: "funke", name: "Sample · Funke Adeyemi", phone: "2348000000003", area: "Victoria Island", createdAt: daysAgo(4) },
];

type Line = { description: string; quantity: number; list: number; given: number };
type Payment = { amount: number; method: string; note: string; paidAt: Date };
type Delivery = { address: string; status: "pending" | "delivered"; scheduledFor?: Date; deliveredAt?: Date };
type OrderPlan = {
  customer: CustomerKey;
  status: "quoted" | "deposit" | "settled";
  createdAt: Date;
  lines: Line[];
  payments: Payment[];
  delivery?: Delivery;
};

const ORDERS: OrderPlan[] = [
  {
    /* The classic: deposit paid, balance still owing, delivery booked. */
    customer: "adaeze",
    status: "deposit",
    createdAt: daysAgo(22),
    lines: [
      { description: "Classic pool blues, 300x300 sheet", quantity: 40, list: 5500, given: 4750 },
      { description: "White pool coping, per metre", quantity: 18, list: 4000, given: 3500 },
      { description: "Grey grout, 20kg bag", quantity: 4, list: 9000, given: 8500 },
    ],
    payments: [{ amount: 120000, method: "transfer", note: "Deposit", paidAt: daysAgo(20) }],
    delivery: { address: "14 Admiralty Way, Lekki Phase 1", status: "pending", scheduledFor: daysAhead(5) },
  },
  {
    /* The finished sale: paid in full, delivered, settled. */
    customer: "chibuzo",
    status: "settled",
    createdAt: daysAgo(11),
    lines: [
      { description: "Gold and silver mosaic, 300x300 sheet", quantity: 12, list: 12000, given: 11000 },
      { description: "Tile adhesive, 20kg bag", quantity: 3, list: 7500, given: 7000 },
    ],
    payments: [
      { amount: 100000, method: "transfer", note: "Deposit", paidAt: daysAgo(10) },
      { amount: 53000, method: "cash", note: "Balance on delivery", paidAt: daysAgo(3) },
    ],
    delivery: { address: "5 Isaac John Street, Ikeja GRA", status: "delivered", deliveredAt: daysAgo(3) },
  },
  {
    /* The live quote: sent, nothing paid yet, the newest of the three. */
    customer: "funke",
    status: "quoted",
    createdAt: daysAgo(3),
    lines: [
      { description: "Aqua glass mosaic, 300x300 sheet", quantity: 60, list: 6500, given: 6000 },
      { description: "Midnight blue waterline, per metre", quantity: 22, list: 5000, given: 4500 },
    ],
    payments: [],
  },
];

const ENQUIRIES: { customer: CustomerKey | null; message: string; status: "new" | "replied" | "converted"; createdAt: Date }[] = [
  { customer: "chibuzo", message: "Asked about gold mosaic prices on WhatsApp.", status: "converted", createdAt: daysAgo(12) },
  { customer: "funke", message: "Sent VI pool measurements, wants a quote.", status: "replied", createdAt: daysAgo(3) },
  { customer: null, message: "Tapped on /piece/classic-pool-blues", status: "new", createdAt: daysAgo(1) },
];

const MOTIONS: { customer: CustomerKey; kind: "site_sample_visit" | "pool_size_quote"; status: "open" | "done"; scheduledFor?: Date; completedAt?: Date }[] = [
  { customer: "adaeze", kind: "site_sample_visit", status: "open", scheduledFor: daysAhead(2) },
  { customer: "funke", kind: "pool_size_quote", status: "done", completedAt: daysAgo(2) },
];

type Db = ReturnType<typeof drizzle>;

/* Delete demo rows in FK-safe order: children of customers first
   (enquiries, sales motions, orders and their cascade), then customers.
   Orders cascade their items, payments, and deliveries. */
async function clearDemo(db: Db) {
  await db.delete(schema.enquiries).where(eq(schema.enquiries.source, DEMO_SOURCE));
  await db.delete(schema.salesMotions).where(like(schema.salesMotions.note, "DEMO%"));
  await db.delete(schema.orders).where(like(schema.orders.note, "DEMO%"));
  await db.delete(schema.customers).where(like(schema.customers.note, "DEMO%"));
}

async function seedDemo(db: Db) {
  await clearDemo(db);

  const ids = {} as Record<CustomerKey, string>;
  for (const c of CUSTOMERS) {
    const [row] = await db
      .insert(schema.customers)
      .values({ name: c.name, phone: c.phone, area: c.area, note: DEMO_NOTE, createdAt: c.createdAt })
      .returning({ id: schema.customers.id });
    ids[c.key] = row.id;
  }

  for (const o of ORDERS) {
    const [order] = await db
      .insert(schema.orders)
      .values({ customerId: ids[o.customer], status: o.status, note: DEMO_NOTE, createdAt: o.createdAt, updatedAt: o.createdAt })
      .returning({ id: schema.orders.id });

    for (const l of o.lines) {
      await db.insert(schema.orderItems).values({
        orderId: order.id,
        description: l.description,
        quantity: l.quantity,
        listPriceKobo: naira(l.list),
        givenPriceKobo: naira(l.given),
      });
    }
    for (const p of o.payments) {
      await db.insert(schema.payments).values({
        orderId: order.id,
        amountKobo: naira(p.amount),
        method: p.method,
        note: p.note,
        paidAt: p.paidAt,
      });
    }
    if (o.delivery) {
      await db.insert(schema.deliveries).values({
        orderId: order.id,
        address: o.delivery.address,
        status: o.delivery.status,
        scheduledFor: o.delivery.scheduledFor ? isoDate(o.delivery.scheduledFor) : null,
        deliveredAt: o.delivery.deliveredAt ?? null,
        note: DEMO_NOTE,
      });
    }
  }

  for (const e of ENQUIRIES) {
    await db.insert(schema.enquiries).values({
      customerId: e.customer ? ids[e.customer] : null,
      source: DEMO_SOURCE,
      message: e.message,
      status: e.status,
      createdAt: e.createdAt,
    });
  }

  for (const m of MOTIONS) {
    await db.insert(schema.salesMotions).values({
      customerId: ids[m.customer],
      kind: m.kind,
      status: m.status,
      note: DEMO_NOTE,
      scheduledFor: m.scheduledFor ? isoDate(m.scheduledFor) : null,
      completedAt: m.completedAt ?? null,
    });
  }
}

function printPlan() {
  console.log("DEMO SEED (dry run, no database touched)\n");
  console.log(`Customers: ${CUSTOMERS.length}`);
  for (const c of CUSTOMERS) console.log(`  · ${c.name}  ${c.phone}  ${c.area}`);

  console.log(`\nOrders: ${ORDERS.length}`);
  let totalBilled = 0;
  let totalPaid = 0;
  for (const o of ORDERS) {
    const billed = o.lines.reduce((s, l) => s + naira(l.given) * l.quantity, 0);
    const paid = o.payments.reduce((s, p) => s + naira(p.amount), 0);
    totalBilled += billed;
    totalPaid += paid;
    const extras = `${o.lines.length} lines, ${o.payments.length} payments${o.delivery ? `, delivery ${o.delivery.status}` : ""}`;
    console.log(`  · ${o.customer.padEnd(8)} ${o.status.padEnd(8)} billed ${money(billed)}, paid ${money(paid)}, balance ${money(billed - paid)}  (${extras})`);
  }

  console.log(`\nEnquiries: ${ENQUIRIES.length}    Sales motions: ${MOTIONS.length}`);
  console.log(`\nTotals: billed ${money(totalBilled)}, paid ${money(totalPaid)}, owing ${money(totalBilled - totalPaid)}`);
  console.log(`\nEvery row tagged. Remove with: npm run demo:clear`);
}

async function main() {
  if (DRY) {
    printPlan();
    return;
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

  if (CLEAR_ONLY) {
    await clearDemo(db);
    console.log("Cleared every demo row (customers, orders, payments, deliveries, enquiries, sales motions).");
    return;
  }

  await seedDemo(db);
  console.log("Seeded the demo workflow: 3 sample customers, 3 orders across the pipeline, payments, deliveries, enquiries, sales motions.");
  console.log("Remove any time with: npm run demo:clear");
}

main().then(() => process.exit(0));
