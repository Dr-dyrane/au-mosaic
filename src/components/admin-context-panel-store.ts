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

export type AdminContextPanel =
  | {
      kind: "stock-filter";
      current: StockFilterContext;
    }
  | {
      kind: "media-create";
      pieces: ContextPieceOption[];
    }
  | {
      kind: "media-batch";
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

export function showMediaCreatePanel(pieces: ContextPieceOption[]) {
  panel = { kind: "media-create", pieces };
  emit();
}

export function showMediaBatchPanel() {
  panel = { kind: "media-batch" };
  emit();
}

export function clearAdminContextPanel() {
  if (!panel) return;
  panel = null;
  emit();
}
