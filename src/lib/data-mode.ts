import { cache } from "react";
import { eq, isNull, ne, notLike, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getDb, schema } from "@/db";

/* Live or demo, one switch for the whole back office. Demo rows are the
   ones the demo seed plants, tagged the way it tags them: a note that
   starts "DEMO" on customers, orders, deliveries, and sales motions, and
   the source "demo" on enquiries. Nothing here writes; it only decides
   what the rooms are allowed to see.

   Layered, not separate: in demo mode every room shows demo and real
   together, so a fresh book still looks alive. In live mode the demo
   rows are filtered out, so real business is never mixed with samples.
   Live is the default, so the house is real until the owner asks to
   show off. The mode is never user input, so its filters are safe. */

export type DataMode = "live" | "demo";
export const DATA_MODE_KEY = "data_mode";
export const DEMO_NOTE_PREFIX = "DEMO";
export const DEMO_SOURCE = "demo";

/* Read once per request. A missing row, or a settings table that has not
   landed yet, reads as live: the safe default never shows samples by
   surprise. */
export const getDataMode = cache(async (): Promise<DataMode> => {
  try {
    const [row] = await getDb()
      .select({ value: schema.settings.value })
      .from(schema.settings)
      .where(eq(schema.settings.key, DATA_MODE_KEY));
    return row?.value === "demo" ? "demo" : "live";
  } catch {
    return "live";
  }
});

/* Query-builder guards: fold into a .where(and(...)). They return
   undefined in demo mode, and drizzle's and() drops undefined, so demo
   mode adds no filter and shows everything. */
export function hideDemoByNote(mode: DataMode, noteCol: PgColumn): SQL | undefined {
  return mode === "live" ? or(isNull(noteCol), notLike(noteCol, `${DEMO_NOTE_PREFIX}%`)) : undefined;
}

export function hideDemoBySource(mode: DataMode, sourceCol: PgColumn): SQL | undefined {
  return mode === "live" ? or(isNull(sourceCol), ne(sourceCol, DEMO_SOURCE)) : undefined;
}

/* Raw-SQL guards: AND these into a hand-written where. The alias is a
   code-supplied table letter, never user input, so the raw text is safe.
   They render to nothing in demo mode. */
export function hideDemoNoteSql(mode: DataMode, alias: string): SQL {
  return mode === "live"
    ? sql.raw(` and (${alias}.note is null or ${alias}.note not like '${DEMO_NOTE_PREFIX}%')`)
    : sql.raw("");
}

export function hideDemoSourceSql(mode: DataMode, alias: string): SQL {
  return mode === "live"
    ? sql.raw(` and (${alias}.source is null or ${alias}.source <> '${DEMO_SOURCE}')`)
    : sql.raw("");
}
