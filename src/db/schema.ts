import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/* The back office, as tables. Phase 5 of the product plan, which
   shipped whole and retired to git history.

   Two families. Catalogue tables (ranges, pieces, stock) are keyed by
   slug, the same stable keys the public site has used since day one,
   so the seam in src/lib/catalog.ts flips without a rename. Ledger
   tables (customers, enquiries, orders, payments, deliveries) are
   uuid-keyed and exist to make his two invisible losses visible:
   every order line carries list price AND given price, so the
   discount leak becomes a number; every payment reduces a balance,
   so forgotten debts become a screen.

   Money is stored in kobo as integers. Naira arithmetic in floats is
   how kobo goes missing. */

export const orderStatus = pgEnum("order_status", [
  "enquiry",
  "quoted",
  "deposit",
  "delivered",
  "settled",
]);

export const enquiryStatus = pgEnum("enquiry_status", [
  "new",
  "replied",
  "converted",
  "closed",
]);

export const deliveryStatus = pgEnum("delivery_status", [
  "pending",
  "out",
  "delivered",
]);

/* Catalogue: what the flagship reads. */

export const ranges = pgTable("ranges", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  line: text("line").notNull().default(""),
  /* The two sides of his business: mosaic, and the pool materials
     that build the water around it. */
  family: text("family", { enum: ["mosaic", "pool"] }).notNull().default("mosaic"),
  sort: integer("sort").notNull().default(0),
});

export const pieces = pgTable(
  "pieces",
  {
    slug: text("slug").primaryKey(),
    rangeSlug: text("range_slug")
      .notNull()
      .references(() => ranges.slug),
    name: text("name").notNull(),
    line: text("line").notNull().default(""),
    story: text("story").notNull().default(""),
    priceNote: text("price_note").notNull().default("Quote per job"),
    colors: jsonb("colors").$type<string[]>().notNull().default([]),
    imageNight: text("image_night"),
    imageDay: text("image_day"),
    /* What one of it is called on the shelf: sheets for mosaic,
       units or bags for the pool side. */
    unit: text("unit").notNull().default("sheets"),
    published: boolean("published").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pieces_range_idx").on(t.rangeSlug)]
);

export const stockLevels = pgTable("stock_levels", {
  pieceSlug: text("piece_slug")
    .primaryKey()
    .references(() => pieces.slug),
  quantitySheets: integer("quantity_sheets").notNull().default(0),
  reorderAt: integer("reorder_at").notNull().default(0),
  containerEta: date("container_eta"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* House facts the owner may change without a deploy: the WhatsApp
   number, the hours, the address. Seeded once from site.ts; after
   the seam flips, the site reads these. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* Ledger: what the house owes and is owed. */

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  area: text("area").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id),
    pieceSlug: text("piece_slug").references(() => pieces.slug),
    source: text("source").notNull().default("whatsapp"),
    message: text("message").notNull().default(""),
    status: enquiryStatus("status").notNull().default("new"),
    /* The anonymous first-party visitor id from the site's beacon:
       one localStorage uuid, no fingerprinting, no third parties.
       Distinct ids draw the top of the funnel. */
    sessionId: text("session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("enquiries_customer_idx").on(t.customerId)]
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    status: orderStatus("status").notNull().default("enquiry"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_customer_idx").on(t.customerId), index("orders_status_idx").on(t.status)]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    pieceSlug: text("piece_slug").references(() => pieces.slug),
    description: text("description").notNull().default(""),
    quantity: integer("quantity").notNull().default(1),
    listPriceKobo: integer("list_price_kobo").notNull().default(0),
    givenPriceKobo: integer("given_price_kobo").notNull().default(0),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    amountKobo: integer("amount_kobo").notNull(),
    method: text("method").notNull().default("transfer"),
    note: text("note").notNull().default(""),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_order_idx").on(t.orderId)]
);

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    address: text("address").notNull().default(""),
    driver: text("driver").notNull().default(""),
    status: deliveryStatus("status").notNull().default("pending"),
    scheduledFor: date("scheduled_for"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    note: text("note").notNull().default(""),
  },
  (t) => [index("deliveries_order_idx").on(t.orderId)]
);

/* The people with keys. The owner's master key stays in the Vercel
   environment; staff get named keys here, hashed with the house
   secret, never stored plain. Nothing is deleted: a key that leaves
   goes inactive and its history stands. */

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: text("role", { enum: ["owner", "staff"] }).notNull().default("staff"),
  keyHash: text("key_hash").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* The phones that asked to be told: one Web Push subscription per
   device, keys and endpoint as the browser minted them. A dead
   endpoint goes inactive, never deleted; it is a device token, but
   the law is cheap to keep. */

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* The book's history: who did what, when, in sentences. Arrives with
   staff accounts, per CRM law 8. Append-only; nothing here is ever
   edited or removed. */

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    who: text("who").notNull().default("the owner"),
    action: text("action").notNull(),
    subject: text("subject").notNull().default(""),
    detail: text("detail").notNull().default(""),
  },
  (t) => [index("audit_at_idx").on(t.at), index("audit_action_idx").on(t.action)]
);
