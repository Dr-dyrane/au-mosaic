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

export type ContextReturnLine = {
  id: string;
  name: string;
  unit: string;
  available: number;
  valueKobo: number;
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
  | {
      kind: "order-payment";
      orderId: string;
    }
  | {
      kind: "order-return";
      orderId: string;
      lines: ContextReturnLine[];
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

export function showOrderPaymentPanel(orderId: string) {
  panel = { kind: "order-payment", orderId };
  emit();
}

export function showOrderReturnPanel(orderId: string, lines: ContextReturnLine[]) {
  panel = { kind: "order-return", orderId, lines };
  emit();
}

export function clearAdminContextPanel() {
  if (!panel) return;
  panel = null;
  emit();
}
