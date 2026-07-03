import { defineConfig } from "drizzle-kit";

/* Migrations prefer the unpooled connection; PgBouncer and DDL do not
   get along. Next.js loads .env for the app; drizzle-kit runs outside
   Next, so we load it here ourselves. */

try {
  process.loadEnvFile(".env");
} catch {
  /* no .env in CI is fine; the URL can come from the environment */
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)!,
  },
  casing: "snake_case",
});
