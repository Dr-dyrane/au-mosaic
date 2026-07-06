import { STATUS_LABEL } from "./pipeline";

export type OrderFilters = {
  status?: string;
  q?: string;
};

export function orderFilterHref(current: OrderFilters, patch: Partial<OrderFilters>) {
  const next = new URLSearchParams();
  const merged = { ...current, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value) next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export function activeOrderFilterLabels(current: OrderFilters) {
  return [
    current.status ? STATUS_LABEL[current.status as keyof typeof STATUS_LABEL] : null,
    current.q ? `Search ${current.q}` : null,
  ].filter(Boolean) as string[];
}
