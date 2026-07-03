# AU Mosaic · product plan

## The design question, answered

Apple Store, not shop.com. Here is why.

Dense marketplace grids (shop.com, Jumia) work when you win on selection and
search: thousands of SKUs, filters, price sorting. That is not AU Mosaic's
game. Nonso wins on beauty, stock depth, price, and trust. Mosaic is a visual
product; his own words: creativity is why the business exists.

So the site presents like an Apple Store: one product family per breath, big
imagery, few words, generous space. And it sells like Agric Market: no cart,
no checkout, no login. Every price is "quote per job" and every buy action
opens WhatsApp with the item prefilled, because that is how his customers
actually buy, and repeat business is almost all of his business.

Rule of thumb for every screen: would Apple show it this calmly, and would a
Lagos contractor still know exactly what to tap? Both must be yes.

## Phases

### Phase 1 · Presentation (now)
Structure, copy, palette, mosaic SVG art, WhatsApp quote flow. Done and
deployed as a preview. Missing on purpose: photos and the real WhatsApp number.

### Phase 2 · Real product photography
The single highest-leverage upgrade. Photo checklist for Nonso:
square photos, daylight, one sheet or item per shot, plus a few showroom and
finished-pool shots. Wire into `products.ts` (each item gets `image`). Product
cards become photo-first, Apple-style: image, name, one line, WhatsApp.

### Phase 3 · The pool gallery
Finished pools are the trust engine for construction jobs. A `/pools` gallery
of real projects (photo, location, one line on the work). Before and after
pairs for renovations.

### Phase 4 · Catalogue depth (only if he wants it)
Optional per-item price ranges ("from ₦..."), stock badges fed from his Excel,
and an "order list" that composes one WhatsApp message from multiple items.
Still no cart. The order list IS the cart, WhatsApp is the checkout.

### Phase 5 · The dashboard (its own engagement, NGN 500,000)
The back office. Answers his actual discovery pains: forgotten debts,
over-high discounts, records on paper. Built after the public site earns
trust, quoted and billed as Phase 2 of the proposal.

**The seam is already built.** Every public surface reads through
`src/lib/catalog.ts` (async, slug-keyed). The dashboard flips those reads
from static data to the database, with `revalidateTag` on every admin
write. The flagship stays static-fast; a price edited at 9:00 is live by
9:01. Zero rework on the public site. The CRM writes, the flagship reads.

**Stack, decided.**
- Database: **Neon Postgres** through the Vercel integration. Orders,
  customers, payments, and stock are relational: joins ("all unpaid orders
  for this customer"), sums (debt totals), constraints. Redis served the
  discovery product because those were document blobs; a back office is
  tables. Neon over Supabase because we do not need its bundled auth and
  storage: auth here is one owner credential, photos go to Vercel Blob.
  Everything lives in the one Vercel account the site already lives in.
  One console, one bill, free tier at his volume.
- ORM: **Drizzle** (typed schema, plain SQL migrations, no codegen step).
- Files: **Vercel Blob** for product and delivery photos he uploads.
- Auth: single owner credential, signed session cookie, `/admin` route
  group. Never in nav, never in the sitemap. Staff logins only if he hires.

**Data model.**
- Piece, Range, StockLevel (quantity, reorder threshold for stock-out
  warnings, container ETA)
- Customer, Enquiry (WhatsApp is the channel; source tagged, mirroring the
  wa_tap placements already tracked)
- Order with line items carrying list price and given price side by side:
  the discount leak becomes a visible number
- Payment and running balance per order: forgotten debts become a
  "who owes what" screen
- Delivery (address, driver, status) and Invoice (PDF from the order)

**Build order.** Week 1: schema, auth, product and inventory CRUD, catalog
seam flipped (his voice-note ask: managing the gallery himself). Week 2:
customers, orders, payments, the debt view. Week 3: deliveries, invoices,
dashboard home (sales, stock warnings, wa_tap funnel tiles), and polish to
Maison standard. The admin must feel like the site, not like a database
tool.

**What does not change:** the visualizer, the themes, the media pipeline,
the WhatsApp funnel. Real projects replace concept studies through the
same Project shape, concept flag off.

**Running cost:** Neon, Blob, and Analytics free tiers cover his volume;
the dashboard fits inside the NGN 25,000 monthly care plan.

### Phase 6 · Measure and grow
Vercel Analytics, Google Business Profile link-up, WhatsApp click tracking.
SEO pages per intent: "mosaic tiles Lagos", "pool construction Lagos",
"pool pump price Nigeria".

## Launch checklist
- [ ] NEXT_PUBLIC_WHATSAPP set (Nonso's WhatsApp Business number)
- [ ] Real Instagram handle in site.ts
- [ ] GitHub repo + Vercel project + domain (aumosaic.ng or similar)
- [ ] Photos (Phase 2)
- [ ] Nonso walkthrough: can he read every word and nod?
