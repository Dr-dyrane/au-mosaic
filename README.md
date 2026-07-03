# AU Mosaic and Pool Materials

The digital flagship of AU Mosaic, Agric Market, Lagos: mosaic tiles,
pool materials, and pool construction. Built by Dyrane from the owner's
Business Discovery assessment, so the site sells the way the business
actually sells: enquiry, photos on WhatsApp, quote per job, pickup or
delivery. Live at https://www.aumosaic.com

Stack: Next.js (App Router) · React · TypeScript · Tailwind CSS v4.
No animation libraries, no webfonts, no CMS in v1. Every route is
static or SSG.

## Structure

```
src/lib/site.ts        business facts: name, location, hours, WhatsApp
src/lib/products.ts    catalogue data: ranges, stock list, services, slugs
src/lib/catalog.ts     the read path; pages ask here, never the file
src/lib/images.ts      every image, film, and owned-media path
src/lib/wa.ts          WhatsApp deep links; every price leads here
src/components/        island nav, cards, reveal, tilt, piece bar, glass UI
src/app/               pages, piece routes, sitemap, robots, icons
public/media/          owned media: three canonical assets and counting
docs/                  the law, the ledger, the briefs; see docs/README.md
scripts/               reproducible brand assets (OG card)
```

The culture in one line: data in lib, style in globals, components
compose, pages arrange, everything measured before it ships. The rest
is in `docs/README.md` and `AGENTS.md`.

## Setup

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_WHATSAPP`
   (digits only). Every enquiry button opens that chat prefilled.
2. `npm install`
3. `npm run dev`

## Verify (every change)

```
npx next build          # 24 routes, all static or SSG
npx eslint src --max-warnings=0
```

Then update `docs/QA.md` with evidence and commit.

## Deploy

Vercel via GitHub. `NEXT_PUBLIC_WHATSAPP` in project env vars.
Analytics and wa_tap placement events flow automatically once live.
