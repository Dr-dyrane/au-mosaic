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
};

export const ADMIN_ROOMS: readonly AdminRoom[] = [
  { id: "home", href: "/admin", label: "Home", exact: true },
  { id: "stock", href: "/admin/pieces", label: "Stock", also: ["/admin/ranges"] },
  { id: "orders", href: "/admin/orders", label: "Orders", also: ["/admin/compose", "/admin/invoice"] },
  { id: "people", href: "/admin/customers", label: "People", also: ["/admin/share"] },
  { id: "owed", href: "/admin/debts", label: "Owed" },
  { id: "deliveries", href: "/admin/deliveries", label: "Deliveries" },
  { id: "photos", href: "/admin/media", label: "Photos" },
  { id: "insights", href: "/admin/insights", label: "Insights" },
  { id: "settings", href: "/admin/settings", label: "Settings", also: ["/admin/settings/history"] },
] as const;

const PHONE_ROOM_IDS: readonly AdminRoomId[] = ["stock", "orders", "people"];

export const ADMIN_PHONE_ROOMS = ADMIN_ROOMS.filter((room) =>
  PHONE_ROOM_IDS.includes(room.id)
);

export const ADMIN_MORE_ROOMS = ADMIN_ROOMS.filter(
  (room) => room.id !== "home" && !PHONE_ROOM_IDS.includes(room.id)
);

export function isActiveRoom(room: AdminRoom, pathname: string) {
  return room.exact
    ? pathname === room.href
    : pathname.startsWith(room.href) || room.also?.some((href) => pathname.startsWith(href));
}

export function roomForPath(pathname: string): AdminRoom {
  return ADMIN_ROOMS.find((room) => isActiveRoom(room, pathname)) ?? ADMIN_ROOMS[0];
}
