/* Demo seed: a clearly-marked sample workflow so every back-office room
   opens alive for a walkthrough. A full year of sample customers and
   orders across the pipeline, so the trend chart, the debtor list, the
   Insights leaks, and the paging all have something to show. Settled
   sales paid in full, deposits with a balance still owing, live quotes,
   and delivered handovers, plus payments, deliveries booked and done,
   fresh enquiries, and a spread of sales motions. Nothing real is touched.

   Every row is tagged so it is obvious and removable: customer names
   start "Sample ·", the notes start "DEMO", enquiries carry source
   "demo". Phone numbers are placeholders (234 800 000 00xx), so a
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
const agoOf = (d: Date) => Math.round((Date.now() - d.getTime()) / 86_400_000);

/* Placeholder phone in the house style: 234 800 000 00xx, always 13
   digits, never a real line, so a WhatsApp tap reaches no one. */
const demoPhone = (n: number) => `234${8_000_000_000 + n}`;
/* Round a naira figure to a tidy thousand so demo balances read clean. */
const round1000 = (n: number) => Math.max(1000, Math.round(n / 1000) * 1000);

/* The markers cleanup keys off. Customers, orders, and sales motions are
   found by a note that starts "DEMO"; enquiries by their source. */
const DEMO_NOTE = "DEMO sample, safe to remove";
const DEMO_SOURCE = "demo";

type Line = { description: string; quantity: number; list: number; given: number };
type Payment = { amount: number; method: string; note: string; paidAt: Date };
type Delivery = { address: string; status: "pending" | "delivered"; scheduledFor?: Date; deliveredAt?: Date };

/* A single order line; given sits a little under list so the discount
   leak always has something to show. */
const L = (description: string, quantity: number, list: number, given: number): Line => ({
  description,
  quantity,
  list,
  given,
});

/* A year of sample customers: Nigerian names across the Lagos areas he
   sells into, every name prefixed "Sample ·", every phone a placeholder.
   The short key wires each customer to their orders, enquiries, and
   motions below. The three the demo shipped with stay the newest faces;
   the rest are backdated so the book has a full year of history. */
const CUSTOMERS = [
  { key: "adaeze", name: "Sample · Adaeze Okonkwo", phone: demoPhone(1), area: "Lekki Phase 1", createdAt: daysAgo(24) },
  { key: "chibuzo", name: "Sample · Chibuzo Eze", phone: demoPhone(2), area: "Ikeja GRA", createdAt: daysAgo(12) },
  { key: "funke", name: "Sample · Funke Adeyemi", phone: demoPhone(3), area: "Victoria Island", createdAt: daysAgo(4) },
  { key: "tunde", name: "Sample · Tunde Bakare", phone: demoPhone(4), area: "Ikoyi", createdAt: daysAgo(355) },
  { key: "ngozi", name: "Sample · Ngozi Nwosu", phone: demoPhone(5), area: "Yaba", createdAt: daysAgo(342) },
  { key: "emeka", name: "Sample · Emeka Obi", phone: demoPhone(6), area: "Surulere", createdAt: daysAgo(330) },
  { key: "aisha", name: "Sample · Aisha Bello", phone: demoPhone(7), area: "Magodo", createdAt: daysAgo(318) },
  { key: "yemi", name: "Sample · Yemi Alabi", phone: demoPhone(8), area: "Ajah", createdAt: daysAgo(305) },
  { key: "kunle", name: "Sample · Kunle Ojo", phone: demoPhone(9), area: "Gbagada", createdAt: daysAgo(293) },
  { key: "chidinma", name: "Sample · Chidinma Uche", phone: demoPhone(10), area: "Maryland", createdAt: daysAgo(281) },
  { key: "bola", name: "Sample · Bola Ahmed", phone: demoPhone(11), area: "Ogudu", createdAt: daysAgo(268) },
  { key: "ibrahim", name: "Sample · Ibrahim Sanni", phone: demoPhone(12), area: "Festac", createdAt: daysAgo(256) },
  { key: "kemi", name: "Sample · Kemi Balogun", phone: demoPhone(13), area: "Ilupeju", createdAt: daysAgo(243) },
  { key: "obinna", name: "Sample · Obinna Kalu", phone: demoPhone(14), area: "Oniru", createdAt: daysAgo(231) },
  { key: "zainab", name: "Sample · Zainab Yusuf", phone: demoPhone(15), area: "Chevron Drive", createdAt: daysAgo(219) },
  { key: "seyi", name: "Sample · Seyi Ogunleye", phone: demoPhone(16), area: "Sangotedo", createdAt: daysAgo(206) },
  { key: "amaka", name: "Sample · Amaka Nnamdi", phone: demoPhone(17), area: "Ikate", createdAt: daysAgo(194) },
  { key: "damilola", name: "Sample · Damilola Fashola", phone: demoPhone(18), area: "Agege", createdAt: daysAgo(181) },
  { key: "uche", name: "Sample · Uche Madu", phone: demoPhone(19), area: "Isolo", createdAt: daysAgo(169) },
  { key: "folake", name: "Sample · Folake Sowore", phone: demoPhone(20), area: "Ketu", createdAt: daysAgo(156) },
  { key: "musa", name: "Sample · Musa Danladi", phone: demoPhone(21), area: "Ojota", createdAt: daysAgo(144) },
  { key: "chinwe", name: "Sample · Chinwe Okoro", phone: demoPhone(22), area: "Ojodu", createdAt: daysAgo(131) },
  { key: "rotimi", name: "Sample · Rotimi Adebayo", phone: demoPhone(23), area: "Palmgrove", createdAt: daysAgo(119) },
  { key: "halima", name: "Sample · Halima Abubakar", phone: demoPhone(24), area: "Lekki Phase 2", createdAt: daysAgo(106) },
  { key: "gbenga", name: "Sample · Gbenga Martins", phone: demoPhone(25), area: "Banana Island", createdAt: daysAgo(94) },
  { key: "nkechi", name: "Sample · Nkechi Anya", phone: demoPhone(26), area: "Egbeda", createdAt: daysAgo(81) },
  { key: "tobi", name: "Sample · Tobi Williams", phone: demoPhone(27), area: "Anthony Village", createdAt: daysAgo(69) },
  { key: "fatima", name: "Sample · Fatima Idris", phone: demoPhone(28), area: "Isheri", createdAt: daysAgo(56) },
] as const;

type CustomerKey = (typeof CUSTOMERS)[number]["key"];

type OrderPlan = {
  customer: CustomerKey;
  status: "quoted" | "deposit" | "delivered" | "settled";
  createdAt: Date;
  lines: Line[];
  payments: Payment[];
  delivery?: Delivery;
};

const keys = CUSTOMERS.map((c) => c.key);

/* Lagos streets, paired with the customer's own area to make a plausible
   delivery address without naming a real door. */
const STREETS = [
  "Admiralty Way",
  "Isaac John Street",
  "Adeola Odeku Street",
  "Bourdillon Road",
  "Awolowo Road",
  "Ozumba Mbadiwe Avenue",
  "Freedom Way",
  "Kofo Abayomi Street",
  "Ligali Ayorinde Street",
  "Younis Bashorun Street",
];
const addressFor = (i: number, area: string) => `${(i % 40) + 1} ${STREETS[i % STREETS.length]}, ${area}`;

/* The shelf: mosaic sheets on one side, the pool materials that build the
   water around them on the other. Every basket mixes tile and trade goods
   so lines, quantities, and the list-versus-given gap all look real. */
const D = {
  blues: "Classic pool blues, 300x300 sheet",
  aqua: "Aqua glass mosaic, 300x300 sheet",
  gold: "Gold and silver mosaic, 300x300 sheet",
  emerald: "Emerald green mosaic, 300x300 sheet",
  pearl: "Pearl white mosaic, 300x300 sheet",
  copingW: "White pool coping, per metre",
  copingG: "Grey pool coping, per metre",
  groutG: "Grey grout, 20kg bag",
  groutW: "White grout, 20kg bag",
  adhesive: "Tile adhesive, 20kg bag",
  waterlineB: "Midnight blue waterline, per metre",
  waterlineG: "Sea green waterline, per metre",
};

const BASKETS: Line[][] = [
  [L(D.blues, 40, 5500, 4750), L(D.copingW, 18, 4000, 3500), L(D.groutG, 4, 9000, 8500)],
  [L(D.gold, 12, 12000, 11000), L(D.adhesive, 3, 7500, 7000)],
  [L(D.aqua, 60, 6500, 6000), L(D.waterlineB, 22, 5000, 4500)],
  [L(D.emerald, 30, 9000, 8200), L(D.copingG, 16, 4200, 3700), L(D.groutW, 3, 9500, 8900)],
  [L(D.pearl, 24, 8000, 7300), L(D.adhesive, 4, 7500, 7000), L(D.groutG, 3, 9000, 8500)],
  [L(D.blues, 50, 5500, 4800), L(D.waterlineB, 26, 5000, 4600), L(D.copingW, 20, 4000, 3600)],
  [L(D.waterlineG, 18, 5200, 4700), L(D.aqua, 36, 6500, 6100), L(D.adhesive, 3, 7500, 7000)],
  [L(D.gold, 10, 12000, 11200), L(D.pearl, 20, 8000, 7400), L(D.groutW, 4, 9500, 8900)],
];

/* Status by age: the newest are quotes and fresh deposits, the middle is
   part-paid and handed over, the old are mostly settled with a few
   delivered and the odd stale quote that never converted. */
function pickStatus(ago: number, i: number): OrderPlan["status"] {
  if (ago <= 25) return i % 2 === 0 ? "quoted" : "deposit";
  if (ago <= 60) return i % 3 === 0 ? "quoted" : "deposit";
  if (ago <= 120) return i % 4 === 0 ? "deposit" : i % 4 === 1 ? "delivered" : "settled";
  if (i % 9 === 0) return "quoted";
  if (i % 6 === 0) return "delivered";
  if (i % 5 === 0) return "deposit";
  return "settled";
}

/* Payments consistent with status: settled and delivered are paid in full
   (split into deposit plus balance on the big ones), deposit is part paid
   and still owing, quoted has nothing against it yet. */
function buildPayments(status: OrderPlan["status"], billed: number, ago: number, i: number): Payment[] {
  if (status === "quoted") return [];
  const at = (back: number) => daysAgo(Math.max(0, ago - back));
  if (status === "deposit") {
    if (i % 3 === 0) {
      return [
        { amount: round1000(billed * 0.3), method: "transfer", note: "Deposit", paidAt: at(1) },
        { amount: round1000(billed * 0.2), method: "cash", note: "Part payment", paidAt: at(6) },
      ];
    }
    return [
      { amount: round1000(billed * (i % 2 === 0 ? 0.4 : 0.55)), method: "transfer", note: "Deposit", paidAt: at(1) },
    ];
  }
  if (billed > 200_000) {
    const deposit = round1000(billed * 0.5);
    return [
      { amount: deposit, method: "transfer", note: "Deposit", paidAt: at(2) },
      { amount: billed - deposit, method: "cash", note: "Balance on delivery", paidAt: at(6) },
    ];
  }
  return [{ amount: billed, method: "transfer", note: "Paid in full", paidAt: at(2) }];
}

/* Deliveries: settled and delivered orders were handed over in the past,
   a quarter of settled ones collected from the showroom instead; recent
   deposits have a run booked for a day soon; old owing orders have none
   yet. */
function buildDelivery(status: OrderPlan["status"], ago: number, i: number, area: string): Delivery | undefined {
  if (status === "settled") {
    if (i % 4 === 0) return undefined;
    return { address: addressFor(i, area), status: "delivered", deliveredAt: daysAgo(Math.max(1, ago - 5)) };
  }
  if (status === "delivered") {
    return { address: addressFor(i, area), status: "delivered", deliveredAt: daysAgo(Math.max(1, ago - 4)) };
  }
  if (status === "deposit" && ago <= 95) {
    return { address: addressFor(i, area), status: "pending", scheduledFor: daysAhead(3 + (i % 9)) };
  }
  return undefined;
}

/* Each customer carries one or two orders, always dated after they came
   on the book, so the year fills in without an order ever pre-dating its
   customer. */
function buildOrders(): OrderPlan[] {
  const out: OrderPlan[] = [];
  let i = 0;
  for (const c of CUSTOMERS) {
    const custAgo = agoOf(c.createdAt);
    const orderCount = custAgo >= 55 ? 2 : 1;
    for (let k = 0; k < orderCount; k++) {
      const ago = Math.max(2, custAgo - 5 - k * 15);
      const status = pickStatus(ago, i);
      const basket = BASKETS[i % BASKETS.length];
      const lines = basket.map((l, j) =>
        L(l.description, l.quantity + (j === 0 ? (i % 4) * 3 : 0), l.list, l.given),
      );
      const billed = lines.reduce((s, l) => s + l.given * l.quantity, 0);
      const payments = buildPayments(status, billed, ago, i);
      const delivery = buildDelivery(status, ago, i, c.area);
      out.push({ customer: c.key, status, createdAt: daysAgo(ago), lines, payments, delivery });
      i++;
    }
  }
  return out;
}

const ORDERS: OrderPlan[] = buildOrders();

type EnquiryRow = {
  customer: CustomerKey | null;
  message: string;
  status: "new" | "replied" | "converted";
  createdAt: Date;
};

const ENQUIRY_MESSAGES = [
  "Asked about gold mosaic prices on WhatsApp.",
  "Sent pool measurements, wants a quote for the waterline.",
  "Tapped /piece/classic-pool-blues from Instagram.",
  "Wants a showroom visit this weekend.",
  "Asked if the aqua glass mosaic is in stock.",
  "Requested a full materials list for a 10m pool.",
  "Comparing coping colours, sent a photo of the deck.",
  "Asked about delivery to Ikoyi and the lead time.",
  "Wants pearl white mosaic sample pictures.",
  "Enquired about grout colours for grey tiles.",
  "Asked for a quote on an emerald feature wall.",
  "Followed up on an old quote from last quarter.",
];

/* Enquiries across the whole year, every status represented, roughly a
   third anonymous from the site beacon and the rest tied to a customer. */
function buildEnquiries(): EnquiryRow[] {
  const out: EnquiryRow[] = [];
  const total = 20;
  for (let i = 0; i < total; i++) {
    const ago = Math.round(2 + (i * (350 - 2)) / (total - 1));
    const customer = i % 3 === 0 ? null : keys[(i * 5) % keys.length];
    const status: EnquiryRow["status"] =
      i % 4 === 0 ? "new" : i % 4 === 2 ? "converted" : "replied";
    out.push({ customer, message: ENQUIRY_MESSAGES[i % ENQUIRY_MESSAGES.length], status, createdAt: daysAgo(ago) });
  }
  return out;
}

const ENQUIRIES: EnquiryRow[] = buildEnquiries();

type MotionRow = {
  customer: CustomerKey;
  kind: "showroom_visit" | "sample_pictures" | "site_sample_visit" | "pool_size_quote" | "materials_list";
  status: "open" | "done";
  scheduledFor?: Date;
  completedAt?: Date;
};

const MOTION_KINDS: MotionRow["kind"][] = [
  "showroom_visit",
  "sample_pictures",
  "site_sample_visit",
  "pool_size_quote",
  "materials_list",
];

/* Sales motions: half still open with a date coming up, half done and
   dated in the past, cycling through every kind the book allows. */
function buildMotions(): MotionRow[] {
  const out: MotionRow[] = [];
  const total = 12;
  for (let i = 0; i < total; i++) {
    const kind = MOTION_KINDS[i % MOTION_KINDS.length];
    const customer = keys[(i * 4) % keys.length];
    if (i % 2 === 0) {
      out.push({ customer, kind, status: "open", scheduledFor: daysAhead(2 + (i % 10)) });
    } else {
      out.push({ customer, kind, status: "done", completedAt: daysAgo(3 + i * 6) });
    }
  }
  return out;
}

const MOTIONS: MotionRow[] = buildMotions();

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
  for (const c of CUSTOMERS) console.log(`  · ${c.name.padEnd(28)} ${c.phone}  ${c.area}`);

  const byStatus: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  let totalBilled = 0;
  let totalPaid = 0;
  let paymentRows = 0;
  let deliveriesPending = 0;
  let deliveriesDelivered = 0;
  for (const o of ORDERS) {
    const billed = o.lines.reduce((s, l) => s + naira(l.given) * l.quantity, 0);
    const paid = o.payments.reduce((s, p) => s + naira(p.amount), 0);
    totalBilled += billed;
    totalPaid += paid;
    paymentRows += o.payments.length;
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    const month = isoDate(o.createdAt).slice(0, 7);
    byMonth[month] = (byMonth[month] ?? 0) + 1;
    if (o.delivery?.status === "pending") deliveriesPending++;
    if (o.delivery?.status === "delivered") deliveriesDelivered++;
  }

  console.log(`\nOrders: ${ORDERS.length}`);
  const statusLine = ["quoted", "deposit", "delivered", "settled"]
    .map((s) => `${s} ${byStatus[s] ?? 0}`)
    .join(", ");
  console.log(`  by status: ${statusLine}`);
  const months = Object.keys(byMonth).sort();
  console.log(`  across ${months.length} months: ${months.map((m) => `${m.slice(2)} ${byMonth[m]}`).join(", ")}`);

  const enqByStatus: Record<string, number> = {};
  for (const e of ENQUIRIES) enqByStatus[e.status] = (enqByStatus[e.status] ?? 0) + 1;
  const enqTied = ENQUIRIES.filter((e) => e.customer).length;
  const motOpen = MOTIONS.filter((m) => m.status === "open").length;

  console.log(`\nPayments: ${paymentRows}`);
  console.log(`Deliveries: ${deliveriesPending + deliveriesDelivered}  (pending ${deliveriesPending}, delivered ${deliveriesDelivered})`);
  console.log(
    `Enquiries: ${ENQUIRIES.length}  (new ${enqByStatus["new"] ?? 0}, replied ${enqByStatus["replied"] ?? 0}, converted ${enqByStatus["converted"] ?? 0}; ${enqTied} tied, ${ENQUIRIES.length - enqTied} anonymous)`,
  );
  console.log(`Sales motions: ${MOTIONS.length}  (open ${motOpen}, done ${MOTIONS.length - motOpen})`);

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
  console.log(
    `Seeded the demo workflow: ${CUSTOMERS.length} sample customers, ${ORDERS.length} orders across a full year of the pipeline, payments, deliveries, enquiries, sales motions.`,
  );
  console.log("Remove any time with: npm run demo:clear");
}

main().then(() => process.exit(0));
