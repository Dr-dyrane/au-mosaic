import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/* One database client, made only when first asked for. Lazy on
   purpose: the flagship builds and runs fully static today, and must
   keep building on machines that have no DATABASE_URL. Nothing on the
   public path may import this until the catalog seam flips in
   Phase 5. */

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in."
    );
  }
  _db = drizzle(neon(url), { schema, casing: "snake_case" });
  return _db;
}

export * as schema from "./schema";

/* neon-http answers a raw execute() with an object carrying rows;
   the query builder answers with plain arrays. One normaliser,
   owned here, used at every execute call site, so no room ever
   maps the envelope again. Production taught this the hard way.
   Review rule: every db.execute() result passes through rowsOf; a bare
   index into an execute() result, or reading .rows by hand, is a defect
   to catch in review, since the shape differs by driver path. */
export const rowsOf = <T,>(r: unknown): T[] =>
  Array.isArray(r) ? (r as T[]) : ((r as { rows?: T[] }).rows ?? []);
