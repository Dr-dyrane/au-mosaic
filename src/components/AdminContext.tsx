"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminPulse } from "@/lib/admin-pulse";
import { naira } from "@/lib/backoffice";
import { type AdminRoomId, roomForPath } from "@/lib/admin-rooms";
import {
  ADMIN_ACTION_INTENTS,
  dispatchAdminActionIntent,
  isPlainAdminClick,
  type AdminActionIntent,
} from "@/components/admin-action-intents";
import {
  adminRouteActionFor,
  type AdminPageAction,
  useAdminPageAction,
} from "@/components/admin-page-action";
import {
  clearAdminContextPanel,
  getAdminContextPanel,
  subscribeAdminContextPanel,
} from "@/components/admin-context-panel-store";
import { StockFilterPanel } from "@/app/admin/(panel)/pieces/FilterSheet";
import { MediaFilterPanel } from "@/app/admin/(panel)/media/MediaFilterSheet";
import { MediaBatchPanel } from "@/app/admin/(panel)/media/MediaBatchActions";
import { MediaCreateForm } from "@/app/admin/(panel)/media/MediaForms";
import { OrderFilterPanel } from "@/app/admin/(panel)/orders/OrderFilterSheet";
import { CustomerFilterPanel } from "@/app/admin/(panel)/customers/CustomerFilterSheet";
import { AddMotionForm } from "@/app/admin/(panel)/customers/[id]/SalesMotions";
import NewDeliveryForm from "@/app/admin/(panel)/deliveries/new/NewDeliveryForm";
import AddLineForm from "@/app/admin/(panel)/orders/[id]/AddLineForm";
import AddPaymentForm from "@/app/admin/(panel)/orders/[id]/AddPaymentForm";
import AddReturnForm from "@/app/admin/(panel)/orders/[id]/AddReturnForm";

type Metric = { label: string; value: string; href?: string };
type Action = {
  label: string;
  href: string;
  intent?: AdminActionIntent;
  external?: boolean;
  tour?: string;
};
type ContextModel = {
  eyebrow: string;
  metrics: Metric[];
  actions: Action[];
};

function money(kobo: number) {
  return naira(Math.max(kobo, 0));
}

function baseContext(room: AdminRoomId, pulse: AdminPulse): ContextModel {
  switch (room) {
    case "home":
      return {
        eyebrow: "Today",
        metrics: [
          { label: "Stock warnings", value: String(pulse.lowStock), href: "/admin/pieces" },
          { label: "Fresh enquiries", value: String(pulse.freshEnquiries), href: "/admin/customers" },
        ],
        actions: [{ label: "New order", href: "/admin/orders/new" }],
      };
    case "stock":
      return {
        eyebrow: "Stock",
        metrics: [
          { label: "Pieces", value: String(pulse.pieces), href: "/admin/pieces" },
          { label: "Warnings", value: String(pulse.lowStock), href: "/admin/pieces" },
        ],
        actions: [
          { label: "Add a piece", href: "/admin/pieces/new" },
          { label: "The ranges", href: "/admin/ranges" },
        ],
      };
    case "orders":
      return {
        eyebrow: "Orders",
        metrics: [
          { label: "Open orders", value: String(pulse.openOrders), href: "/admin/orders" },
          { label: "Outstanding", value: money(pulse.outstandingKobo), href: "/admin/debts" },
        ],
        actions: [
          { label: "New order", href: "/admin/orders/new" },
          { label: "Settled", href: "/admin/orders/settled" },
        ],
      };
    case "people":
      return {
        eyebrow: "People",
        metrics: [
          { label: "Fresh enquiries", value: String(pulse.freshEnquiries), href: "/admin/customers" },
          { label: "People owing", value: String(pulse.owingCustomers), href: "/admin/debts" },
        ],
        actions: [{ label: "Add customer", href: "/admin/customers/new" }],
      };
    case "owed":
      return {
        eyebrow: "Owed",
        metrics: [
          { label: "People owing", value: String(pulse.owingCustomers), href: "/admin/debts" },
          { label: "Outstanding", value: money(pulse.outstandingKobo), href: "/admin/debts" },
        ],
        actions: [{ label: "Open orders", href: "/admin/orders" }],
      };
    case "deliveries":
      return {
        eyebrow: "Deliveries",
        metrics: [],
        actions: [
          { label: "New delivery", href: "/admin/deliveries/new" },
          { label: "Orders", href: "/admin/orders" },
        ],
      };
    case "photos":
      return {
        eyebrow: "Photos",
        metrics: [],
        actions: [
          { label: "Add a photo", href: "/admin/media#media-add-photo", intent: ADMIN_ACTION_INTENTS.mediaCreate },
          { label: "Prepared photos", href: "/admin/media#media-prepared-photos", intent: ADMIN_ACTION_INTENTS.mediaBatch },
          { label: "Stockroom", href: "/admin/pieces" },
        ],
      };
    case "insights":
      return {
        eyebrow: "Insights",
        metrics: [
          { label: "Owed", value: money(pulse.outstandingKobo), href: "/admin/debts" },
          { label: "Stock", value: String(pulse.lowStock), href: "/admin/pieces" },
        ],
        actions: [{ label: "Today", href: "/admin" }],
      };
    case "settings":
      return {
        eyebrow: "Settings",
        metrics: [],
        actions: [
          { label: "The history", href: "/admin/settings/history" },
          { label: "The site", href: "/" },
        ],
      };
  }
}

function contextFor(pathname: string, pulse: AdminPulse): ContextModel {
  const room = roomForPath(pathname);
  const ctx = baseContext(room.id, pulse);
  if (pathname.endsWith("/new")) {
    return {
      ...ctx,
      eyebrow: "New record",
      actions: [],
    };
  }
  if (/^\/admin\/orders\/[^/]+/.test(pathname)) {
    return {
      ...ctx,
      eyebrow: "Order record",
      actions: [],
    };
  }
  if (/^\/admin\/customers\/[^/]+/.test(pathname)) {
    return {
      ...ctx,
      eyebrow: "Customer record",
      actions: [],
    };
  }
  if (/^\/admin\/pieces\/[^/]+/.test(pathname)) {
    return {
      ...ctx,
      eyebrow: "Piece record",
      actions: [],
    };
  }
  if (/^\/admin\/media\/[^/]+/.test(pathname)) {
    return {
      ...ctx,
      eyebrow: "Photo record",
      actions: [],
    };
  }
  if (pathname === "/admin/share") {
    return {
      ...ctx,
      eyebrow: "From WhatsApp",
      actions: [],
    };
  }
  return ctx;
}

function contextActionsFor(
  pathname: string,
  ctx: ContextModel,
  pageAction: AdminPageAction | null,
  routeAction: AdminPageAction | null,
  extraActions: Action[] = []
) {
  if (pageAction && (pathname === "/admin/share" || pathname.startsWith("/admin/ranges"))) {
    return [pageAction];
  }
  if (/^\/admin\/(orders|customers|pieces)\/(?!new$)[^/]+/.test(pathname)) {
    const primary = pageAction ?? routeAction;
    return uniqueActions(primary ? [primary, ...extraActions] : extraActions);
  }
  return ctx.actions;
}

function uniqueActions(actions: Action[]) {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = `${action.href}:${action.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function contextActionFromDom(el: HTMLElement): Action | null {
  const href = el.dataset.href;
  const label = el.dataset.label;
  if (!href || !label) return null;
  return {
    href,
    label,
    external: el.dataset.external === "true",
    tour: el.dataset.tour,
    intent: el.dataset.intent as AdminActionIntent | undefined,
  };
}

function adminContextActionsFromDom() {
  return uniqueActions(
    Array.from(document.querySelectorAll<HTMLElement>("[data-admin-context-action]"))
      .map(contextActionFromDom)
      .filter((action): action is Action => Boolean(action))
  );
}

function useAdminContextActions(pathname: string) {
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    const sync = () => setActions(adminContextActionsFromDom());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        "data-admin-context-action",
        "data-href",
        "data-label",
        "data-external",
        "data-tour",
        "data-intent",
      ],
    });
    return () => observer.disconnect();
  }, [pathname]);

  return actions;
}

/* Record pages feed the rail their own live facts through hidden
   markers, the same mechanic as the context actions. The server wrote
   the values fresh, so the rail never runs a second query and never
   duplicates the page: it keeps the record's vitals in sight while the
   long form scrolls. */
function contextFactFromDom(el: HTMLElement): Metric | null {
  const label = el.dataset.label;
  const value = el.dataset.value;
  if (!label || !value) return null;
  return { label, value };
}

function adminContextFactsFromDom() {
  const seen = new Set<string>();
  return Array.from(document.querySelectorAll<HTMLElement>("[data-admin-context-fact]"))
    .map(contextFactFromDom)
    .filter((fact): fact is Metric => Boolean(fact))
    .filter((fact) => {
      if (seen.has(fact.label)) return false;
      seen.add(fact.label);
      return true;
    });
}

function useAdminContextFacts(pathname: string) {
  const [facts, setFacts] = useState<Metric[]>([]);

  useEffect(() => {
    const sync = () => setFacts(adminContextFactsFromDom());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-admin-context-fact", "data-label", "data-value"],
    });
    return () => observer.disconnect();
  }, [pathname]);

  return facts;
}

/* A page that speaks for itself outranks the room pulse. */
function withRecordFacts(ctx: ContextModel, facts: Metric[]): ContextModel {
  if (facts.length === 0) return ctx;
  return { ...ctx, metrics: facts };
}

function ContextBody({ ctx, actions }: { ctx: ContextModel; actions?: Action[] }) {
  const visibleActions = actions ?? ctx.actions;
  return (
    <>
      <p className="eyebrow">{ctx.eyebrow}</p>
      {ctx.metrics.length > 0 && (
        <dl className="mt-7 space-y-4">
          {ctx.metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mist">
                {metric.label}
              </dt>
              <dd className="mt-1 font-serif text-[20px] leading-none text-ink">
                {metric.href ? <Link href={metric.href}>{metric.value}</Link> : metric.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {visibleActions.length > 0 && (
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
          {visibleActions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              target={action.external ? "_blank" : undefined}
              rel={action.external ? "noreferrer" : undefined}
              data-tour={action.tour}
              onClick={(event) => {
                if (!action.intent) return;
                if (!isPlainAdminClick(event)) return;
                event.preventDefault();
                dispatchAdminActionIntent(action.intent, action);
              }}
              className="link-hair text-dusk text-[12px]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function AdminMobileContext({ pulse }: { pulse: AdminPulse }) {
  const pathname = usePathname();
  const facts = useAdminContextFacts(pathname);
  const ctx = withRecordFacts(contextFor(pathname, pulse), facts);
  const pageAction = useAdminPageAction(pathname);
  const routeAction = adminRouteActionFor(pathname);
  const extraActions = useAdminContextActions(pathname);
  const actions = contextActionsFor(pathname, ctx, pageAction, routeAction, extraActions);
  const [open, setOpen] = useState(false);
  if (pathname === "/admin") return null;
  return (
    <details
      className="admin-context glass liquid-glass mb-8 rounded-[28px] px-5 py-4 xl:hidden"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="admin-context-summary flex items-center justify-between gap-5">
        <span>
          <span className="eyebrow block">This room</span>
          <span className="font-serif mt-1 block text-[20px] leading-tight">{ctx.eyebrow}</span>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
          {open ? "Close" : "Open"}
        </span>
      </summary>
      <div className="mt-7">
        <ContextBody ctx={ctx} actions={actions} />
      </div>
    </details>
  );
}

export function AdminContextRail({ pulse }: { pulse: AdminPulse }) {
  const pathname = usePathname();
  const facts = useAdminContextFacts(pathname);
  const ctx = withRecordFacts(contextFor(pathname, pulse), facts);
  const pageAction = useAdminPageAction(pathname);
  const routeAction = adminRouteActionFor(pathname);
  const extraActions = useAdminContextActions(pathname);
  const actions = contextActionsFor(pathname, ctx, pageAction, routeAction, extraActions);
  const panel = useSyncExternalStore(subscribeAdminContextPanel, getAdminContextPanel, () => null);
  const stockFilter = panel?.kind === "stock-filter" ? panel.current : null;
  const mediaFilter = panel?.kind === "media-filter" ? panel.current : null;
  const orderFilter = panel?.kind === "order-filter" ? panel.current : null;
  const customerFilter = panel?.kind === "customer-filter" ? panel.current : null;
  const customerMotion = panel?.kind === "customer-motion" ? panel : null;
  const deliveryCreate = panel?.kind === "delivery-create" ? panel : null;
  const mediaCreate = panel?.kind === "media-create" ? panel : null;
  const mediaBatch = panel?.kind === "media-batch";
  const orderLine = panel?.kind === "order-line" ? panel : null;
  const orderPayment = panel?.kind === "order-payment" ? panel : null;
  const orderReturn = panel?.kind === "order-return" ? panel : null;
  const orderRecord = /^\/admin\/orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname);
  const customerRecord = /^\/admin\/customers\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname);
  /* Home already shows the pulse and the gold action on the canvas.
     The rail keeps its shell but stays quiet, like the phone panel. */
  const home = pathname === "/admin";
  const railCtx = home ? { ...ctx, metrics: [] } : ctx;
  const railActions = home ? [] : actions;

  useEffect(() => {
    if (stockFilter && pathname !== "/admin/pieces") clearAdminContextPanel();
    if (mediaFilter && pathname !== "/admin/media") clearAdminContextPanel();
    if (orderFilter && pathname !== "/admin/orders") clearAdminContextPanel();
    if (customerFilter && pathname !== "/admin/customers") clearAdminContextPanel();
    if (customerMotion && !customerRecord) clearAdminContextPanel();
    if (deliveryCreate && pathname !== "/admin/deliveries") clearAdminContextPanel();
    if (mediaCreate && pathname !== "/admin/media") clearAdminContextPanel();
    if (mediaBatch && pathname !== "/admin/media") clearAdminContextPanel();
    if ((orderLine || orderPayment || orderReturn) && !orderRecord) clearAdminContextPanel();
  }, [
    pathname,
    stockFilter,
    mediaFilter,
    orderFilter,
    customerFilter,
    customerMotion,
    customerRecord,
    deliveryCreate,
    mediaCreate,
    mediaBatch,
    orderLine,
    orderPayment,
    orderReturn,
    orderRecord,
  ]);

  return (
    <aside className="admin-context hidden xl:sticky xl:top-0 xl:block xl:h-svh xl:overflow-y-auto xl:py-6">
      <div className="panel liquid-glass flex min-h-[calc(100svh-48px)] flex-col justify-between">
        <div>
          {stockFilter ? (
            <StockFilterPanel
              id="stock-filter-rail"
              current={stockFilter}
              onPick={clearAdminContextPanel}
              onClose={clearAdminContextPanel}
            />
          ) : mediaFilter ? (
            <MediaFilterPanel
              id="media-filter-panel"
              current={mediaFilter}
              totals={mediaFilter.totals}
              onPick={clearAdminContextPanel}
              onClose={clearAdminContextPanel}
            />
          ) : orderFilter ? (
            <OrderFilterPanel
              id="order-filter-panel"
              current={orderFilter}
              onPick={clearAdminContextPanel}
              onClose={clearAdminContextPanel}
            />
          ) : customerFilter ? (
            <CustomerFilterPanel
              id="customer-filter-panel"
              current={customerFilter}
              onPick={clearAdminContextPanel}
              onClose={clearAdminContextPanel}
            />
          ) : customerMotion ? (
            <div id="customer-motion">
              <div className="flex items-start justify-between gap-5 px-2">
                <div>
                  <p className="eyebrow">Add motion</p>
                  <h2 className="font-serif mt-3 text-[20px] leading-tight">
                    Keep the next move visible.
                  </h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-dusk">
                    Track a sample, visit, quote, or materials list.
                  </p>
                </div>
                <button
                  onClick={clearAdminContextPanel}
                  className="link-hair shrink-0 text-dusk text-[12px]"
                >
                  Close
                </button>
              </div>
              <div className="mt-6">
                <AddMotionForm
                  customerId={customerMotion.customerId}
                  surface="plain"
                  idPrefix="motion-rail"
                />
              </div>
            </div>
          ) : deliveryCreate ? (
            <div id="delivery-create">
              <div className="flex items-start justify-between gap-5 px-2">
                <div>
                  <p className="eyebrow">New delivery</p>
                  <h2 className="font-serif mt-3 text-[20px] leading-tight">
                    Put an order on the road.
                  </h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-dusk">
                    Pick the order, address, driver, and day.
                  </p>
                </div>
                <button
                  onClick={clearAdminContextPanel}
                  className="link-hair shrink-0 text-dusk text-[12px]"
                >
                  Close
                </button>
              </div>
              <div className="mt-6">
                <NewDeliveryForm
                  orders={deliveryCreate.orders}
                  selectedOrder={deliveryCreate.selectedOrder}
                  surface="plain"
                  idPrefix="delivery-rail"
                />
              </div>
            </div>
          ) : mediaCreate ? (
            <div id="media-add-photo">
              <div className="flex items-start justify-between gap-5 px-2">
                <div>
                  <p className="eyebrow">Add photo</p>
                  <h2 className="font-serif mt-3 text-[20px] leading-tight">
                    Product display, room example, proof.
                  </h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-dusk">
                    Upload once, then decide where it belongs.
                  </p>
                </div>
                <button
                  onClick={clearAdminContextPanel}
                  className="link-hair shrink-0 text-dusk text-[12px]"
                >
                  Close
                </button>
              </div>
              <div className="mt-6">
                <MediaCreateForm
                  pieces={mediaCreate.pieces}
                  surface="plain"
                  showIntro={false}
                  idPrefix="media-rail"
                />
              </div>
            </div>
          ) : mediaBatch ? (
            <div id="media-prepared-photos">
              <div className="flex items-start justify-between gap-5 px-2">
                <div>
                  <p className="eyebrow">Prepared photos</p>
                  <h2 className="font-serif mt-3 text-[20px] leading-tight">
                    Make the set useful.
                  </h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-dusk">
                    Add product photos, then make approved displays live.
                  </p>
                </div>
                <button
                  onClick={clearAdminContextPanel}
                  className="link-hair shrink-0 text-dusk text-[12px]"
                >
                  Close
                </button>
              </div>
              <div className="mt-6">
                <MediaBatchPanel surface="plain" />
              </div>
            </div>
          ) : orderLine ? (
            <div id="order-line">
              <div className="flex items-start justify-between gap-5 px-2">
                <div>
                  <p className="eyebrow">Line</p>
                  <h2 className="font-serif mt-3 text-[20px] leading-tight">
                    Add what is being sold.
                  </h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-dusk">
                    Choose stock, name work, and keep list beside given.
                  </p>
                </div>
                <button
                  onClick={clearAdminContextPanel}
                  className="link-hair shrink-0 text-dusk text-[12px]"
                >
                  Close
                </button>
              </div>
              <div className="mt-6">
                <AddLineForm
                  orderId={orderLine.orderId}
                  pieces={orderLine.pieces}
                  surface="plain"
                  idPrefix="order-line-rail"
                />
              </div>
            </div>
          ) : orderPayment ? (
            <div id="order-payment">
              <div className="flex items-start justify-between gap-5 px-2">
                <div>
                  <p className="eyebrow">Payment</p>
                  <h2 className="font-serif mt-3 text-[20px] leading-tight">
                    Record what arrived.
                  </h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-dusk">
                    Add the amount and the balance keeps itself.
                  </p>
                </div>
                <button
                  onClick={clearAdminContextPanel}
                  className="link-hair shrink-0 text-dusk text-[12px]"
                >
                  Close
                </button>
              </div>
              <div className="mt-6">
                <AddPaymentForm
                  orderId={orderPayment.orderId}
                  surface="plain"
                  idPrefix="order-payment-rail"
                />
              </div>
            </div>
          ) : orderReturn ? (
            <div id="order-return">
              <div className="flex items-start justify-between gap-5 px-2">
                <div>
                  <p className="eyebrow">Return</p>
                  <h2 className="font-serif mt-3 text-[20px] leading-tight">
                    Write it beside the sale.
                  </h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-dusk">
                    The original line stays. The return adjusts the balance.
                  </p>
                </div>
                <button
                  onClick={clearAdminContextPanel}
                  className="link-hair shrink-0 text-dusk text-[12px]"
                >
                  Close
                </button>
              </div>
              <div className="mt-6">
                <AddReturnForm
                  orderId={orderReturn.orderId}
                  lines={orderReturn.lines}
                  surface="plain"
                  idPrefix="order-return-rail"
                />
              </div>
            </div>
          ) : (
            <ContextBody ctx={railCtx} actions={railActions} />
          )}
        </div>
        <p className="mt-12 text-[11px] uppercase tracking-[0.18em] text-mist">
          AU Mosaic back room
        </p>
      </div>
    </aside>
  );
}
