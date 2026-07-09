import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { whoAmI } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";

/* The whole book in one file. The CSVs are the accountant's paper;
   this is the safe in the wall: every business table as plain JSON,
   dated, so the owner always holds a copy nobody can take from him.
   Owner only, and secrets never ride: no staff key hashes, no push
   tokens, nothing from the environment. A backup is read far more
   rarely than it is made, so the shape stays boring on purpose. */

export const dynamic = "force-dynamic";

export async function GET() {
  const who = await whoAmI();
  if (!who) {
    return new Response(null, { status: 302, headers: { location: "/admin/login" } });
  }
  if (who.role !== "owner") {
    return new Response(null, { status: 302, headers: { location: "/admin" } });
  }

  const db = getDb();
  try {
    const [
      customers,
      orders,
      orderItems,
      payments,
      deliveries,
      enquiries,
      salesMotions,
      ranges,
      pieces,
      stockLevels,
      settings,
      mediaAssets,
      auditLog,
    ] = await Promise.all([
      db.select().from(schema.customers).orderBy(asc(schema.customers.createdAt)),
      db.select().from(schema.orders).orderBy(asc(schema.orders.createdAt)),
      db.select().from(schema.orderItems),
      db.select().from(schema.payments).orderBy(asc(schema.payments.paidAt)),
      db.select().from(schema.deliveries),
      db.select().from(schema.enquiries).orderBy(asc(schema.enquiries.createdAt)),
      db.select().from(schema.salesMotions).orderBy(asc(schema.salesMotions.createdAt)),
      db.select().from(schema.ranges).orderBy(asc(schema.ranges.sort)),
      db.select().from(schema.pieces).orderBy(asc(schema.pieces.slug)),
      db.select().from(schema.stockLevels),
      db.select().from(schema.settings),
      db.select().from(schema.mediaAssets).orderBy(asc(schema.mediaAssets.createdAt)),
      db.select().from(schema.auditLog).orderBy(asc(schema.auditLog.at)),
    ]);

    const tables = {
      customers,
      orders,
      order_items: orderItems,
      payments,
      deliveries,
      enquiries,
      sales_motions: salesMotions,
      ranges,
      pieces,
      stock_levels: stockLevels,
      settings,
      media_assets: mediaAssets,
      audit_log: auditLog,
    };
    const rows = Object.values(tables).reduce((n, t) => n + t.length, 0);

    const book = {
      house: "AU Mosaic",
      kind: "book-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      rows,
      tables,
    };

    await logAction("backed up the book", `${rows} rows`);

    const today = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(book, null, 1), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="aumosaic-book-${today}.json"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "The database did not answer. Try again." }),
      {
        status: 503,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      }
    );
  }
}
