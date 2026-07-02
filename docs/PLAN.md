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

### Phase 5 · The dashboard (its own engagement)
The back office: CRM (customers, enquiries, debts owed, the discount leak),
inventory (his Excel, structured, with stock-out warnings), deliveries, and
warehouse. This answers his actual discovery pains: forgotten debts, over-high
discounts, records on paper. Separate app, separate fee, built after the
public site earns trust. Stack: same Next.js repo, protected /admin routes,
a real database (Postgres) when we get here.

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
