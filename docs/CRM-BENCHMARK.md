# CRM benchmark: the enterprise bar, the backroom, and what we owe

Purpose: measure the au-mosaic back office against the top enterprise SaaS and
CRM standard, then filter that standard through what this business actually is,
a single non-technical owner running a Lagos mosaic import shop from his phone,
mostly over WhatsApp. The point is not to chase the enterprise checklist. It is
to separate what genuinely serves Nonso from what serves a different animal.

## The one distinction that governs everything

Enterprise CRM standards (Salesforce, Dynamics, the SOC 2 world) assume a
multi-tenant product sold to many organisations, each with an IT department.
The au-mosaic back office is a single-tenant tool for one business. Most of the
enterprise platform layer exists to serve that other animal: multi-tenancy and
tenant isolation, SSO with SAML or OIDC, SCIM provisioning, SOC 2 Type II
certification, per-record role permissions, a public API marketplace. Here that
is category mismatch, not a gap. What still applies to a single-business tool is
narrower and real: sound authentication, an audit trail, security hygiene, data
export and backup, reliability, and care for the customer data it holds.

Read the whole benchmark through that lens.

## 1. The enterprise standard, the bar

Grouped from current enterprise CRM and SaaS sources (see Sources).

CRM capability:
- Contact and account management: one unified record, interaction history, no
  duplicates, segmentation and tags.
- Lead capture and qualification: multi-source capture, scoring, assignment,
  routing.
- Pipeline and deals: visual stages, drag to advance, win rates, deal-stage
  progression.
- Activity tracking: a unified timeline of calls, emails, meetings, notes per
  contact.
- Tasks and reminders: assignable to-dos, due and overdue surfacing, calendar
  and follow-up sequences.
- Quoting, orders, pricing: quotes and orders, line items, discounts, price
  books.
- Invoicing and payments: invoices, receivables, refunds, and reconciliation
  against bank feeds.
- Catalogue and inventory: products, stock levels, reorder points.
- Fulfilment: deliveries, carrier or tracking integration.
- Reporting and forecasting: dashboards, KPIs (pipeline velocity, win rate,
  forecast accuracy), real-time analytics, AI assist.
- Automation and workflow: a rules engine, triggers, sequences, scheduled jobs.
- Notifications: in-app, email, and push, multichannel.
- Communications: email sync, messaging, template libraries, campaigns.
- Data lifecycle: import, export, migration, and backup and restore.
- Search, filter, sort, bulk actions, pagination.
- Mobile and offline access.
- Customization: custom fields, configurable pipelines and workflows.
- Integrations: REST or GraphQL API, webhooks, an app ecosystem.

Enterprise SaaS platform bar:
- Multi-tenancy with tenant isolation enforced at schema, runtime, and tests.
- RBAC enforced on the server, least privilege, per-record and field-level
  where needed.
- SSO with OAuth 2.0, OIDC, or SAML; MFA; JIT and SCIM provisioning.
- SOC 2 Type II, encryption at rest and in transit, data-subject rights.
- Audit logging with retention, plus point-in-time "who could access what"
  answers.
- Observability: structured logging, monitoring, alerting, and a test suite.

## 2. The backroom scorecard

From the capability audit (schema, rooms, actions, auth, audit, docs).

| Area | Verdict | Evidence |
|---|---|---|
| Contact and account management | Partial | `customers` has name, phone, area, note only; per-customer history is strong; no email, tags, segments; no phone dedupe |
| Lead capture and qualification | Exists, light | `enquiries` with source and a new-to-closed status; auto-convert on order; no scoring or routing |
| Pipeline and deals | Exists | `orders.status` enquiry to settled, server-verified stage walk with a concurrency guard; plus `sales_motions` |
| Activity tracking | Partial | append-only `audit_log` in sentences; customer page assembles a view; no single merged timeline |
| Tasks and reminders | Absent | no tasks table; only `scheduledFor` dates and the one daily digest; nothing surfaces due or overdue |
| Quoting, orders, pricing | Exists, strong | `order_items` carries list price beside given price (the discount-leak mechanic); returns as mirrored lines |
| Invoicing and payments | Exists, no reconciliation | `payments` with idempotency key, refunds as negative payments, debts room, invoice sheet and script; bank reconciliation is a Phase 3 quote |
| Catalogue and inventory | Exists | ranges, pieces, stock levels, reorder, auto stock movement at the delivery threshold, low-stock push |
| Fulfilment and deliveries | Partial | `deliveries` status log with address and driver; no carrier or tracking integration |
| Reporting and forecasting | Exists, light forecast | insights room: trend, top pieces, leak, debt aging, funnel, plus a grounded AI read; forecast is a 3-month pace only |
| Automation and workflow | Partial | a few concrete automations; one cron; no rules engine or user-defined triggers |
| Notifications | Exists, push only | web push, digest cron, low-stock crossings; no email; VAPID and CRON_SECRET env not yet set |
| Communications | Exists, a bridge by design | WhatsApp share-in, AI chat-to-order, compose-out; in-app chat is a standing refusal |
| Data lifecycle | Partial | orders and debts CSV export, seeds, self-healing schema; no full backup or restore, no generic import |
| Search, filter, bulk, pagination | Exists | search-params driven, filters, sorts, pagination, bulk archive and delete |
| Mobile and offline | Exists, ahead | installable PWA plus a true offline field kit with queued idempotent writes |
| Customization | Partial | settings edits house facts, staff keys, theme; no custom fields or configurable pipelines |
| API and integrations | Absent as a product | internal endpoints only; no public API, webhooks, or app surface |
| Users, roles, auth | Partial by design | owner master key plus named staff keys, HMAC-signed cookie; RBAC is one distinction, only the owner manages keys; no SSO, MFA, or per-record permissions |
| Audit and compliance | Partial | strong append-only audit; the no-hard-delete law is now relaxed, `deleteRecords` truly deletes on confirm; no retention policy or data-subject workflow |
| Multi-tenant | Absent by construction | no tenant or org column anywhere; single business |
| Security posture | Exists, solid for its size | server-side auth on every action, parameterized SQL, secrets hygiene, login and funnel rate limits |
| Reliability and observability | Partial | error boundaries, Vercel analytics and logs; no tests of any kind, no monitoring or alerting |

## 3. The verdict, in three buckets

### Keep, already at or above the bar for this context

The order lifecycle, the list-beside-given discount mechanic, payments and
debts, returns and refunds, catalogue with auto stock movement, the insights
room with its AI read, the append-only audit, search and filter and pagination,
the WhatsApp bridge with AI chat-to-order, and the offline field kit. Several of
these are bespoke strengths a generic enterprise CRM does not have out of the
box, and the offline kit is ahead of most of them. The deliberate refusals
(in-app chat, customer accounts, multi-tenancy, notification spam) are correct
for this context and count as design, not debt.

### Skip, a different animal

Multi-tenancy and tenant isolation, SSO and SAML and SCIM, SOC 2 certification,
per-record and field-level RBAC, marketing automation and campaigns, help-desk
ticketing, a public API and webhook marketplace, territory and quota management,
and heavy statistical forecasting. These serve a multi-org product sold to IT
buyers. Adding them here would spend the owner's scarcest asset, his attention,
on machinery for a business he does not run.

### Add, real value even for one owner

1. Attention surface: what needs Nonso today. Overdue debts, enquiries gone
   stale, sample motions due. Not a task system, a computed "your eye is needed
   here" on the glance and in the digest. Highest value, and pure attention
   stewardship.
2. Customer dedupe. Phone is the key, yet a blind insert allows two records for
   one person. Warn or merge on a matching phone.
3. Backup the book. A man moving off paper must never fear the machine ate it.
   A full data export or a verified scheduled backup, beyond the two CSVs.
4. A thin test and monitoring layer. Two recent crashes reached production past
   type-check and lint (the insights render, the function-to-client-component).
   A few tests on the money math, the idempotency, and the WhatsApp parser, plus
   real error capture, is the quality-is-a-loop root wearing better tools.
5. Unified customer timeline. Merge orders, payments, sales motions, enquiries,
   and audit into one chronological view. The data already exists.
6. NDPR-lite. The book holds customer names and phones; Nigeria's data
   protection act applies. A stated retention posture and a "forget this
   customer" action. The hard-delete path already makes erasure possible.
7. Config hygiene. `CLAUDE_API_KEY` is used but missing from `.env.example`.

## 4. What CRM.md should record

- Correct law 8. It still reads "No hard deletes anywhere," but the owner
  relaxed this and `deleteRecords` now truly deletes behind a confirmation.
  Rewrite the law as: archive is the default and reversible; permanent delete
  exists behind a consequence confirmation that names the rows; the audit signs
  both. This is a correctness fix, the doc currently contradicts the code.
- Record the standing scope decision from this benchmark: single-tenant by
  construction; the enterprise platform layer (multi-tenancy, SSO, SOC 2,
  public API) is refused as category mismatch, not deferred. So it stops being
  re-litigated.
- Add the "Add" list above as the CRM's open board, so the next session has a
  ranked queue instead of a philosophy.

## 5. The roadmap, prioritised

- P0, doc correctness: fix CRM.md law 8 and record the single-tenant scope
  ruling. No code.
- P1, high value and on-brand: the attention surface (due and overdue), and
  customer dedupe.
- P2, trust and safety: backup the book, and the thin test and monitoring layer.
- P3, polish: the unified customer timeline, NDPR-lite with forget-customer, and
  `CLAUDE_API_KEY` into `.env.example`.

Each item ships the house way: server-verified, kobo-exact, archive-first,
shop-floor voice, one gold per screen, no new dependency unless it earns its
place, gated by types and lint, then an eye or a log on production.

## Sources

- [Enterprise CRM: essential features and implementation guide, Huble](https://huble.com/blog/enterprise-crm-software)
- [15 essential CRM features checklist, AlphonsoLabs](https://www.alphonsolabs.com/crm-essential-features-checklist-2026/)
- [Complete CRM checklist, Pipedrive](https://www.pipedrive.com/en/crm/resources/crm-checklist)
- [SOC 2 checklist for SaaS startups, Comp AI](https://trycomp.ai/soc-2-checklist-for-saas-startups)
- [How to design RBAC for multi-tenant SaaS, WorkOS](https://workos.com/blog/how-to-design-multi-tenant-rbac-saas)
- [The essential SaaS compliance checklist, Zylo](https://zylo.com/blog/saas-compliance-checklist)
