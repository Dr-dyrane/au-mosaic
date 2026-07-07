# AU Mosaic digital platform valuation memo

Prepared for Nonso and AU Mosaic.

Valuation date: July 7, 2026.

This memo values the digital platform only. It excludes physical stock,
tools, showroom fixtures, vehicles, cash, debts, supplier relationships,
and the operating business itself.

This is not a formal appraisal, tax opinion, or audited accounting
paper. It is a defendable owner memo: a clear way to explain why the
platform is a valuable business asset even if the build was billed
below its full economic value.

## Executive conclusion

AU Mosaic does not own only a website.

It owns a custom digital sales and operating platform:

- A public luxury window that presents the brand, products, projects,
  gallery, showroom, WhatsApp conversion paths, and the visualizer.
- A private backroom that manages pieces, stock, photos, customers,
  enquiries, orders, debts, deliveries, invoices, staff access, audit,
  offline field work, and business insight.
- A media and product source of truth that connects what customers see
  to what the owner edits.

The fee paid to build it is not the same thing as its value. A discount
build price is a transaction fact. Value is judged by what the asset
would cost to replace, what business benefit it can produce, and what
a willing buyer would pay for the rights and capability on the
valuation date.

## Defendable value range

The present platform supports three levels of value.

| Basis | Defendable range | What it means |
|---|---:|---|
| Conservative replacement floor | USD 45,000 to USD 75,000 | What a disciplined buyer would expect to spend to recreate the working software, design system, content structure, admin flows, QA evidence, and deployment readiness at a conservative blended build rate. |
| Functional platform value | USD 75,000 to USD 120,000 | What the platform is worth as a usable sales and operations system because the public window and backroom already work together. |
| Strategic value with operating proof | USD 120,000 to USD 250,000 plus | What becomes supportable once AU Mosaic documents lead conversion, recovered debt, faster quoting, reduced discount leakage, and repeatable sales lift over 6 to 12 months. |

For Nigerian reporting, convert the USD range using the chosen exchange
rate on the valuation date. Do not hard-code a stale exchange rate into
the asset memo.

The most conservative statement is:

> AU Mosaic's digital platform should not be treated as a cheap website.
> Even before assigning value to the physical business, a replacement-cost
> review supports a low five-figure USD floor. With operating evidence,
> the platform can support a materially higher strategic valuation.

## What is being valued

### 1. The public window

The public side is a premium, conversion-oriented digital flagship:

- Home, product, range, project, gallery, journal, contact, showroom,
  pool, materials, interiors, Lagos, atelier, how-we-work, and
  visualizer routes.
- A visualizer that lets customers start from a pool, wall, kitchen,
  shower, floor, camera, or their own photo.
- Rich owned and generated media, held in `public/media` and wired
  through `src/lib/images.ts`.
- WhatsApp-first conversion paths with placement tracking.
- SEO-ready routes, sitemap, metadata, page structure, and product
  detail pages.
- A design system documented in `docs/DESIGN.md`, including palette,
  typography, motion, geometry, accessibility, and media laws.

This is the part customers see. Its economic job is trust, attention,
lead capture, quote readiness, and brand lift.

### 2. The backroom

The private side is not a brochure CMS. It is a working operating
system for the business:

- Piece records: name, slug, range, copy, stock, price note, media,
  site presence, and photos.
- Stockroom: quantities, reorder thresholds, filters, ranges, and
  presence control.
- Customers: contacts, history, enquiries, sales motions, and WhatsApp
  bridge.
- Orders: line items, given price, list price, status, payment, return,
  invoice, and CSV export.
- Debts: balances, oldest-first visibility, debt export, and recovery
  focus.
- Deliveries: address, driver, status, landed archive, and offline
  delivery write.
- Photos: phone-ready media room, prepared photos, filters, viewer,
  and source-of-truth media handling.
- Settings: staff keys, house facts, map details, notifications, and
  audit history.
- Insights: charts and a grounded business read from the same figures.
- Offline field kit: last-known read, queued payment, and delivered
  writes for weak network conditions.

This is the part that protects margin. Its economic job is fewer
forgotten debts, fewer pricing mistakes, faster answers, cleaner
records, and less owner attention spent per sale.

### 3. The private data layer

The platform holds private operational data that becomes more valuable
with use:

- Product records and product slugs.
- Media records and site-ready photographs.
- Customer records.
- Enquiry sources and WhatsApp tap placements.
- Orders, payments, returns, and balances.
- Delivery status and field records.
- Audit history.

This data is not valuable because it exists. It becomes valuable
because it connects demand, product, customer, price, delivery, and
cash recovery in one house.

## Evidence from the actual build

The current repo contains:

- 57 production routes in the latest build.
- 146 files under `src/app`.
- 32 component files under `src/components`.
- 15 database tables in `src/db/schema.ts`.
- 263 files in `public/media`.
- About 28,715 lines across `src/app`, `src/components`, `src/lib`,
  and `src/db`.
- A QA ledger with build, lint, theme, responsive, accessibility, and
  browser evidence.
- A design law, CRM law, git playbook, production readiness notes, and
  client-facing guides.

These facts matter because a valuation should not depend on taste
alone. The asset is documented, testable, deployed, and structured.

## Valuation methods

### Cost approach

The cost approach asks what it would cost to recreate the asset today.

A conservative rebuild budget would include:

| Workstream | Conservative hours |
|---|---:|
| Discovery, product direction, domain modeling | 80 to 120 |
| Public flagship, visual system, navigation, SEO | 180 to 260 |
| Gallery, product pages, media system, visualizer | 180 to 280 |
| Backroom CRM rooms and workflows | 380 to 560 |
| Database, auth, audit, offline, exports, invoices | 180 to 280 |
| QA, responsive checks, accessibility, deployment, docs | 120 to 180 |
| Total | 1,120 to 1,680 |

At a conservative blended professional build rate of USD 40 to USD 70
per hour, the replacement floor is about USD 45,000 to USD 118,000.
Because not every buyer will pay the top of a rebuild range for a
small-business system, the memo uses USD 45,000 to USD 75,000 as the
conservative floor and USD 75,000 to USD 120,000 as the functional
platform range.

The logic is simple: if a buyer lost this repo, this design system,
these admin workflows, this media library, and this QA record, replacing
them would not be cheap.

### Income approach

The income approach asks what future economic benefit the platform can
produce.

AU Mosaic should track these monthly:

- Gross profit from digital enquiries.
- Gross profit from visualizer-led enquiries.
- Debt recovered because balances were visible.
- Discount leakage avoided by showing list price beside given price.
- Time saved on quote preparation, stock checks, debt follow-up, and
  invoice preparation.
- Revenue protected by fewer stockouts or faster delivery follow-up.

Use this formula:

```text
Monthly platform benefit =
  added gross profit
+ recovered debt
+ avoided discount leakage
+ owner and staff time saved
+ revenue protected by better stock and delivery control
```

Then:

```text
Income value = monthly platform benefit x 18 to 36 months
```

Scenario table:

| Monthly platform benefit | 18-month value | 36-month value |
|---:|---:|---:|
| NGN 500,000 | NGN 9,000,000 | NGN 18,000,000 |
| NGN 1,500,000 | NGN 27,000,000 | NGN 54,000,000 |
| NGN 3,000,000 | NGN 54,000,000 | NGN 108,000,000 |
| NGN 5,000,000 | NGN 90,000,000 | NGN 180,000,000 |

This is why the platform can become a gold mine. The value is not only
the code. It is the recurring business lift the code helps produce.

### Market approach

The market approach asks what an equivalent mix would cost in the
market.

AU Mosaic would otherwise need a stack of separate tools:

- Premium marketing website.
- Product catalogue.
- CMS.
- CRM.
- Inventory tracker.
- Order tracker.
- Debt ledger.
- Delivery tracker.
- Invoice generator.
- Media library.
- Analytics dashboard.
- Offline field tool.
- Visualizer.

Buying these separately creates subscription cost, integration cost,
training cost, and data fragmentation. The custom platform has value
because it joins them around the way AU Mosaic actually sells:
WhatsApp, product photos, stock, price, delivery, and debts.

## Why the value is defensible

### It is not generic

A generic website can be compared to templates. This platform cannot be
valued like a template because it embeds the specific workflow of AU
Mosaic:

- Pieces are the heart.
- WhatsApp is the sales channel.
- Stock is measured in sheets.
- Debts are a first-class room.
- Deliveries are tied to orders and customer promises.
- Photos move from backroom to public trust.
- The visualizer supports how customers imagine tile before buying.

Specificity is part of the asset.

### It reduces business leakage

The backroom is designed around two losses named in the business record:
forgotten debts and deep discounts. That makes the software tied to
cash protection, not only marketing.

### It compounds with data

Every piece, photo, enquiry, quote, order, payment, and delivery makes
the platform less replaceable. The more it is used, the more the
business memory moves from paper and chat fragments into a structured
private asset.

### It raises trust before the first call

The public window makes AU Mosaic look like a premium, organized,
modern house before the customer reaches WhatsApp. In building
materials, trust changes the sale. It can shorten doubt, raise project
size, and make the business look safer than a seller who only has an
Instagram page.

### It gives the owner optionality

This platform can later support:

- A fuller online catalogue.
- Branch or staff-level operations.
- Sales rep workflows.
- Trade-client quoting.
- Project galleries from real jobs.
- Paid visualization or consultation workflows.
- Better credit control.
- Formal reporting for lenders or investors.

Optionality has value when the system already has the right shape.

## Accounting treatment

An accountant may treat the platform differently from an investor.

Under IFRS-style accounting logic, internally generated intangible
assets require care. Research work is usually expensed. Development
work may be capitalized only when the entity can show technical
feasibility, intention and ability to complete and use the asset,
probable future economic benefit, available resources, and reliable
measurement of costs. Internally generated brands and similar items are
often not recognized as assets.

That means:

- Book value may be lower than economic value.
- A low invoice does not prove a low fair value.
- The software, if acquired or reliably costed, may be documented as a
  technology asset.
- The brand lift, customer trust, and generated goodwill may not appear
  fully on the balance sheet.

This is normal. Many strong digital assets have higher owner value than
carrying value.

## What Nonso should keep as evidence

To defend the platform to an evaluator, lender, accountant, or buyer,
keep:

- GitHub repository access and commit history.
- Deployment records.
- QA ledger.
- Design and CRM docs.
- Screenshots of the public window and backroom.
- Media asset ledger.
- Database schema.
- Monthly analytics: visits, WhatsApp taps, visualizer starts, enquiries.
- Monthly operations: orders, gross profit, recovered debts, discounts
  avoided, delivery completion, stockout events.
- Any invoice, contract, or handover note that proves rights to use the
  software.

## Asset register entry

Suggested name:

`AU Mosaic Digital Operating Platform`

Suggested description:

`Custom public website, product catalogue, visualizer, media library,
and back-office CRM for AU Mosaic, including stock, customers, orders,
debts, deliveries, invoices, staff access, audit, offline field kit,
analytics, and documentation.`

Suggested rights:

`Business-use rights to operate, modify, deploy, and extend the source
code and owned media, subject to any third-party hosting, package, map,
and AI service terms.`

Suggested valuation basis:

`Replacement cost, supported by income-benefit evidence as usage data
accumulates.`

Suggested conservative owner statement:

`The platform is a custom sales and operating system. It should be
managed as a strategic digital asset, not as a one-off website expense.`

## Risks and limits

The valuation should be discounted if:

- Source-code rights are unclear.
- The platform is not actively used.
- Data is not maintained.
- Analytics are not tracked.
- Backroom records are not kept current.
- Hosting, authentication, backups, or security are neglected.
- The visualizer is presented as fully automatic when it still requires
  user refinement.

These are not reasons to undervalue the platform. They are reasons to
protect it properly.

## Next evidence to collect

For the next 90 days, track:

| Metric | Why it matters |
|---|---|
| WhatsApp taps by source | Shows which pages create buying intent. |
| Visualizer starts and sends | Shows the northstar feature's contribution. |
| Enquiries that become orders | Converts attention into revenue proof. |
| Average order value from digital leads | Shows whether the window raises deal size. |
| Debts recovered through the backroom | Direct cash benefit. |
| Discount leakage avoided | Direct margin protection. |
| Quote response time | Time saved and service quality. |
| Stockout events | Inventory control proof. |

After 90 days, the memo can move from replacement-cost defense to
measured income value.

## References

- IRS Publication 561 defines fair market value as open-market price
  between a willing buyer and seller with reasonable knowledge of the
  facts: https://www.irs.gov/publications/p561
- AICPA VS Section 100 is a professional valuation standard for
  estimating business, security, and intangible-asset value:
  https://www.aicpa-cima.com/resources/download/statement-on-standards-for-valuation-services-vs-section-100
- IFRS IAS 38 explains accounting treatment for intangible assets,
  including internally generated assets and development-phase costs:
  https://www.ifrs.org/issued-standards/list-of-standards/ias-38-intangible-assets/
- OECD notes that SME digitalisation can improve performance,
  innovation, productivity, and competitive footing:
  https://www.oecd.org/en/topics/sub-issues/digitalisation-of-smes.html
