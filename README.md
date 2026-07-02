# AU Mosaic and Pool Materials

The website for AU Mosaic, Agric Market, Lagos: mosaic tiles, pool materials,
and pool construction. Built by Dyrane Academy from the owner's Business
Discovery assessment, so the site sells the way the business actually sells:
enquiry, photos on WhatsApp, quote per job, pickup or delivery.

Stack: Next.js (App Router) · React · TypeScript · Tailwind CSS v4.

## Structure

```
src/lib/site.ts        · business facts (name, location, hours, WhatsApp)
src/lib/products.ts    · catalogue: mosaic ranges, the pool materials stock list, services
src/lib/wa.ts          · WhatsApp deep-link helpers (every price leads here)
src/components/        · Header, Footer, Mosaic art, WhatsApp float, shared UI
src/app/               · pages: home, mosaic-tiles, pool-materials, pools, about, contact
```

No database and no CMS in v1: the catalogue is one typed file, edited like text.

## Setup

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_WHATSAPP`
   (the owner's WhatsApp Business number, digits only, e.g. `2348012345678`).
   Every enquiry button on the site opens that chat with a prefilled message.
2. `npm install`
3. `npm run dev`

## Deploy

Vercel, framework Next.js. Set `NEXT_PUBLIC_WHATSAPP` in the project's
environment variables. Photos of real stock are the next upgrade: drop them in
`public/` and wire them into `products.ts`.
