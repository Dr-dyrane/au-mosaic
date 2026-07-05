export type AdminRoomId =
  | "home"
  | "stock"
  | "orders"
  | "people"
  | "owed"
  | "deliveries"
  | "photos"
  | "insights"
  | "settings";

export type AdminRoom = {
  id: AdminRoomId;
  href: string;
  label: string;
  exact?: boolean;
  also?: readonly string[];
  tab?: boolean;
};

export const ADMIN_ROOMS: readonly AdminRoom[] = [
  { id: "home", href: "/admin", label: "Home", exact: true, tab: true },
  { id: "stock", href: "/admin/pieces", label: "Stock", also: ["/admin/ranges"], tab: true },
  { id: "orders", href: "/admin/orders", label: "Orders", also: ["/admin/compose", "/admin/invoice"], tab: true },
  { id: "people", href: "/admin/customers", label: "People", also: ["/admin/share"], tab: true },
  { id: "owed", href: "/admin/debts", label: "Owed", tab: true },
  { id: "deliveries", href: "/admin/deliveries", label: "Deliveries" },
  { id: "photos", href: "/admin/media", label: "Photos" },
  { id: "insights", href: "/admin/insights", label: "Insights" },
  { id: "settings", href: "/admin/settings", label: "Settings", also: ["/admin/settings/history"] },
] as const;

export const ADMIN_TABS = ADMIN_ROOMS.filter((room) => room.tab);

export function isActiveRoom(room: AdminRoom, pathname: string) {
  return room.exact
    ? pathname === room.href
    : pathname.startsWith(room.href) || room.also?.some((href) => pathname.startsWith(href));
}

export function roomForPath(pathname: string): AdminRoom {
  return ADMIN_ROOMS.find((room) => isActiveRoom(room, pathname)) ?? ADMIN_ROOMS[0];
}
