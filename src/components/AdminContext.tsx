"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminPulse } from "@/lib/admin-pulse";
import { naira } from "@/lib/backoffice";
import { type AdminRoomId, roomForPath } from "@/lib/admin-rooms";
import {
  clearAdminContextPanel,
  getAdminContextPanel,
  subscribeAdminContextPanel,
} from "@/components/admin-context-panel-store";
import { StockFilterPanel } from "@/app/admin/(panel)/pieces/FilterSheet";
import { MediaAssetEditor } from "@/app/admin/(panel)/media/MediaForms";

type Metric = { label: string; value: string; href?: string };
type Action = { label: string; href: string };
type ContextModel = {
  eyebrow: string;
  title: string;
  line: string;
  metrics: Metric[];
  actions: Action[];
};

const calm = "The room is calm.";

function money(kobo: number) {
  return naira(Math.max(kobo, 0));
}

function baseContext(room: AdminRoomId, pulse: AdminPulse): ContextModel {
  switch (room) {
    case "home":
      return {
        eyebrow: "Today",
        title: pulse.ok ? "The house is awake." : "The book is quiet.",
        line: pulse.ok ? "Start with the oldest open loop, then the next sale." : "The window still stands on its own catalogue.",
        metrics: [
          { label: "Stock warnings", value: String(pulse.lowStock), href: "/admin/pieces" },
          { label: "Fresh enquiries", value: String(pulse.freshEnquiries), href: "/admin/customers" },
        ],
        actions: [{ label: "New order", href: "/admin/orders/new" }],
      };
    case "stock":
      return {
        eyebrow: "Stock",
        title: pulse.lowStock > 0 ? "Some shelves need attention." : "The shelves are calm.",
        line: "Each piece carries its look, stock, price note, and window switch.",
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
        title: "List beside given.",
        line: "A discount is visible before it becomes a habit.",
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
        title: pulse.freshEnquiries > 0 ? "Fresh taps are waiting." : "The chats are remembered.",
        line: "WhatsApp stays the channel. The book keeps the memory.",
        metrics: [
          { label: "Fresh enquiries", value: String(pulse.freshEnquiries), href: "/admin/customers" },
          { label: "People owing", value: String(pulse.owingCustomers), href: "/admin/debts" },
        ],
        actions: [{ label: "New customer", href: "/admin/customers/new" }],
      };
    case "owed":
      return {
        eyebrow: "Owed",
        title: pulse.owingCustomers > 0 ? "The oldest debt leads." : "No one is asking loudly.",
        line: "Reminders leave through WhatsApp, already written in the customer's name.",
        metrics: [
          { label: "People owing", value: String(pulse.owingCustomers), href: "/admin/debts" },
          { label: "Outstanding", value: money(pulse.outstandingKobo), href: "/admin/debts" },
        ],
        actions: [{ label: "Open orders", href: "/admin/orders" }],
      };
    case "deliveries":
      return {
        eyebrow: "Deliveries",
        title: "One step at a time.",
        line: "The van moves here. The shelf moves on the order.",
        metrics: [],
        actions: [
          { label: "New delivery", href: "/admin/deliveries/new" },
          { label: "Orders", href: "/admin/orders" },
        ],
      };
    case "photos":
      return {
        eyebrow: "Photos",
        title: "Product display, room example, proof.",
        line: "Photos can stay draft, become approved, or go live where they belong.",
        metrics: [],
        actions: [
          { label: "Add a photo", href: "/admin/media" },
          { label: "Stockroom", href: "/admin/pieces" },
        ],
      };
    case "insights":
      return {
        eyebrow: "Insights",
        title: "Read the pattern, then act.",
        line: "Pace, leak, stock, and debts are useful only when they change the next move.",
        metrics: [
          { label: "Outstanding", value: money(pulse.outstandingKobo), href: "/admin/debts" },
          { label: "Warnings", value: String(pulse.lowStock), href: "/admin/pieces" },
        ],
        actions: [{ label: "Today", href: "/admin" }],
      };
    case "settings":
      return {
        eyebrow: "Settings",
        title: "Keys, facts, and history.",
        line: "Owner tools stay quiet until the house needs them.",
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
      title: "Write only what is true now.",
      line: "The book can grow later. Today needs the next honest detail.",
    };
  }
  if (/^\/admin\/orders\/[^/]+/.test(pathname)) {
    return {
      ...ctx,
      eyebrow: "Order record",
      title: "Money, stock, and message.",
      line: "Check the balance, name the stock movement, then send the customer the next word.",
    };
  }
  if (/^\/admin\/customers\/[^/]+/.test(pathname)) {
    return {
      ...ctx,
      eyebrow: "Customer record",
      title: "One person, one memory.",
      line: "Their chat stays in WhatsApp. Their history stays here.",
    };
  }
  if (/^\/admin\/pieces\/[^/]+/.test(pathname)) {
    return {
      ...ctx,
      eyebrow: "Piece record",
      title: "The piece is the heart.",
      line: "Name, image, stock, price note, and window switch live together.",
    };
  }
  if (pathname === "/admin/share") {
    return {
      ...ctx,
      eyebrow: "From WhatsApp",
      title: "Keep the thread's memory.",
      line: "Tie the shared chat to a person, then continue in WhatsApp.",
    };
  }
  return ctx;
}

function ContextBody({ ctx, compact = false }: { ctx: ContextModel; compact?: boolean }) {
  return (
    <>
      <p className="eyebrow">{ctx.eyebrow}</p>
      <h2 className={`font-serif mt-3 ${compact ? "text-[20px]" : "text-[26px]"} leading-tight`}>
        {ctx.title}
      </h2>
      <p className="mt-3 text-[14px] leading-relaxed text-dusk">{ctx.line || calm}</p>
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
      {ctx.actions.length > 0 && (
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
          {ctx.actions.map((action) => (
            <Link key={action.href} href={action.href} className="link-hair text-dusk text-[12px]">
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
  const ctx = contextFor(pathname, pulse);
  if (pathname === "/admin") return null;
  return (
    <details className="admin-context glass liquid-glass mb-8 rounded-[28px] px-5 py-4 xl:hidden">
      <summary className="admin-context-summary flex items-center justify-between gap-5">
        <span>
          <span className="eyebrow block">This room</span>
          <span className="font-serif mt-1 block text-[20px] leading-tight">{ctx.eyebrow}</span>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Open</span>
      </summary>
      <div className="mt-7">
        <ContextBody ctx={ctx} compact />
      </div>
    </details>
  );
}

export function AdminContextRail({ pulse }: { pulse: AdminPulse }) {
  const pathname = usePathname();
  const ctx = contextFor(pathname, pulse);
  const panel = useSyncExternalStore(subscribeAdminContextPanel, getAdminContextPanel, () => null);
  const stockFilter = panel?.kind === "stock-filter" ? panel.current : null;
  const mediaEdit = panel?.kind === "media-edit" ? panel : null;

  useEffect(() => {
    if (stockFilter && pathname !== "/admin/pieces") clearAdminContextPanel();
    if (mediaEdit && !pathname.startsWith("/admin/media")) clearAdminContextPanel();
  }, [pathname, stockFilter, mediaEdit]);

  return (
    <aside className="admin-context hidden xl:sticky xl:top-0 xl:block xl:h-svh xl:overflow-y-auto xl:py-6">
      <div className="panel liquid-glass flex min-h-[calc(100svh-48px)] flex-col justify-between">
        <div>
          {stockFilter ? (
            <StockFilterPanel
              id="stock-filter-panel"
              current={stockFilter}
              onPick={clearAdminContextPanel}
              onClose={clearAdminContextPanel}
            />
          ) : mediaEdit ? (
            <div id={`media-edit-${mediaEdit.asset.id}`}>
              <div className="flex items-start justify-between gap-5 px-2">
                <div>
                  <p className="eyebrow">Edit photo</p>
                  <h2 className="font-serif mt-3 text-[20px] leading-tight">
                    {mediaEdit.asset.title}
                  </h2>
                </div>
                <button
                  onClick={clearAdminContextPanel}
                  className="link-hair shrink-0 text-dusk text-[12px]"
                >
                  Close
                </button>
              </div>
              <div className="mt-5">
                <MediaAssetEditor
                  asset={mediaEdit.asset}
                  pieces={mediaEdit.pieces}
                  fullHref={mediaEdit.href}
                />
              </div>
            </div>
          ) : (
            <ContextBody ctx={ctx} />
          )}
        </div>
        <p className="mt-12 text-[11px] uppercase tracking-[0.18em] text-mist">
          AU Mosaic back room
        </p>
      </div>
    </aside>
  );
}
