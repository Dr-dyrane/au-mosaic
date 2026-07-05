export const SALES_MOTIONS = [
  { key: "showroom_visit", label: "Showroom visit" },
  { key: "sample_pictures", label: "Sample pictures" },
  { key: "site_sample_visit", label: "Site sample visit" },
  { key: "pool_size_quote", label: "Pool size quote" },
  { key: "materials_list", label: "Materials list" },
] as const;

export type SalesMotionKind = (typeof SALES_MOTIONS)[number]["key"];
export type SalesMotionStatus = "open" | "done";

const LABELS = new Map<string, string>(SALES_MOTIONS.map((m) => [m.key, m.label]));

export function salesMotionLabel(kind: string): string {
  return LABELS.get(kind) ?? kind.replace(/_/g, " ");
}

export function cleanSalesMotionKind(value: string): SalesMotionKind | null {
  return SALES_MOTIONS.find((m) => m.key === value)?.key ?? null;
}

export function cleanSalesMotionStatus(value: string): SalesMotionStatus | null {
  if (value === "open" || value === "done") return value;
  return null;
}
