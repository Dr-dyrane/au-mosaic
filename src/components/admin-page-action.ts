"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_ROOMS,
  type AdminRoom,
  type AdminRoomId,
  roomForPath,
} from "@/lib/admin-rooms";
import {
  ADMIN_ACTION_INTENTS,
  type AdminActionIntent,
} from "@/components/admin-action-intents";

export type AdminPageAction = {
  href: string;
  label: string;
  room: AdminRoom;
  external?: boolean;
  tour?: string;
  intent?: AdminActionIntent;
};

export function adminRoomById(id: AdminRoomId) {
  return ADMIN_ROOMS.find((room) => room.id === id) ?? ADMIN_ROOMS[0];
}

export function adminRouteActionFor(pathname: string, owed: number): AdminPageAction {
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  const orderMatch = new RegExp(`^/admin/orders/(${uuid})$`, "i").exec(pathname);
  if (orderMatch) {
    return {
      href: `${pathname}#order-payment`,
      label: "Add payment",
      room: adminRoomById("owed"),
      intent: ADMIN_ACTION_INTENTS.orderPayment,
    };
  }

  const customerMatch = new RegExp(`^/admin/customers/(${uuid})$`, "i").exec(pathname);
  if (customerMatch) {
    return {
      href: `/admin/orders/new?customer=${customerMatch[1]}`,
      label: "New order",
      room: adminRoomById("orders"),
      tour: "order-new",
    };
  }

  if (/^\/admin\/pieces\/(?!new$)[^/]+/.test(pathname)) {
    return { href: `${pathname}#stock`, label: "Reorder", room: adminRoomById("stock") };
  }

  const room = roomForPath(pathname);
  switch (room.id) {
    case "home":
      return { href: "/admin/orders/new", label: "New order", room: adminRoomById("orders"), tour: "order-new" };
    case "stock":
      return { href: "/admin/pieces/new", label: "New piece", room: adminRoomById("stock"), tour: "new-piece" };
    case "orders":
      return { href: "/admin/orders/new", label: "New order", room: adminRoomById("orders"), tour: "order-new" };
    case "people":
      return { href: "/admin/customers/new", label: "New customer", room: adminRoomById("people"), tour: "people-new" };
    case "owed":
      return { href: "/admin/debts", label: owed > 0 ? "Remind" : "Orders", room: adminRoomById("owed") };
    case "deliveries":
      return { href: "/admin/deliveries/new", label: "New delivery", room: adminRoomById("deliveries") };
    case "photos":
      return {
        href: "/admin/media#media-add-photo",
        label: "Add photo",
        room: adminRoomById("photos"),
        intent: ADMIN_ACTION_INTENTS.mediaCreate,
      };
    case "insights":
      return { href: "/admin", label: "Today", room: adminRoomById("home") };
    case "settings":
      return { href: "/admin/settings/history", label: "History", room: adminRoomById("settings") };
  }
}

export function adminPageActionFromDom(): AdminPageAction | null {
  const el = document.querySelector<HTMLElement>("[data-admin-action]");
  if (!el) return null;
  const href = el.dataset.href;
  const label = el.dataset.label;
  const roomId = el.dataset.room as AdminRoomId | undefined;
  if (!href || !label || !roomId) return null;
  return {
    href,
    label,
    room: adminRoomById(roomId),
    external: el.dataset.external === "true",
    tour: el.dataset.tour,
    intent: el.dataset.intent as AdminActionIntent | undefined,
  };
}

export function useAdminPageAction(pathname: string) {
  const [pageAction, setPageAction] = useState<AdminPageAction | null>(null);

  useEffect(() => {
    const sync = () => setPageAction(adminPageActionFromDom());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        "data-admin-action",
        "data-href",
        "data-label",
        "data-room",
        "data-external",
        "data-tour",
        "data-intent",
      ],
    });
    return () => observer.disconnect();
  }, [pathname]);

  return pageAction;
}

export function useResolvedAdminAction(pathname: string, owed: number) {
  const pageAction = useAdminPageAction(pathname);
  const routeAction = useMemo(() => adminRouteActionFor(pathname, owed), [pathname, owed]);
  return pageAction ?? routeAction;
}
