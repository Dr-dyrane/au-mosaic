export type StockFilterContext = {
  family?: string;
  low?: string;
  hue?: string;
  app?: string;
  sort?: string;
};

export type ContextPieceOption = {
  slug: string;
  name: string;
};

export type ContextMediaAsset = {
  id: string;
  title: string;
  status: string;
  role: string;
  sun: string;
  pieceSlug: string | null;
  notes: string;
};

export type AdminContextPanel =
  | {
      kind: "stock-filter";
      current: StockFilterContext;
    }
  | {
      kind: "media-edit";
      asset: ContextMediaAsset;
      pieces: ContextPieceOption[];
      href: string;
    }
  | null;

let panel: AdminContextPanel = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeAdminContextPanel(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAdminContextPanel() {
  return panel;
}

export function showStockFilterPanel(current: StockFilterContext) {
  panel = { kind: "stock-filter", current };
  emit();
}

export function showMediaEditPanel(asset: ContextMediaAsset, pieces: ContextPieceOption[], href: string) {
  panel = { kind: "media-edit", asset, pieces, href };
  emit();
}

export function clearAdminContextPanel() {
  if (!panel) return;
  panel = null;
  emit();
}
