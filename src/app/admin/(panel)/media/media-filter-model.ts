export type MediaFilters = {
  status?: string;
  role?: string;
  batch?: string;
};

export type MediaFilterTotals = {
  all: number;
  draft: number;
  approved: number;
  wired: number;
  archived: number;
};

export const STATUSES = ["draft", "approved", "wired", "archived"] as const;
export const ROLES = ["card", "applied", "window", "proof", "contact_sheet"] as const;

export const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  draft: "Draft",
  approved: "Approved",
  wired: "Live",
  archived: "Archived",
};

export const ROLE_LABELS: Record<(typeof ROLES)[number], string> = {
  card: "Product display",
  applied: "Room example",
  window: "Window scene",
  proof: "Showroom photo",
  contact_sheet: "Review sheet",
};

export function labelStatus(v: string) {
  return STATUS_LABELS[v as (typeof STATUSES)[number]] ?? v.replace(/_/g, " ");
}

export function labelRole(v: string) {
  return ROLE_LABELS[v as (typeof ROLES)[number]] ?? v.replace(/_/g, " ");
}

export function mediaFilterHref(current: MediaFilters, patch: Partial<MediaFilters>) {
  const next = new URLSearchParams();
  const merged = { ...current, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value) next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/admin/media?${qs}` : "/admin/media";
}

export function activeMediaFilterLabels(current: MediaFilters) {
  return [
    current.status ? labelStatus(current.status) : null,
    current.role ? labelRole(current.role) : null,
    current.batch ? "Prepared set" : null,
  ].filter(Boolean) as string[];
}
