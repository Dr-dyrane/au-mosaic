export type StockFilterContext = {
  family?: string;
  low?: string;
  hue?: string;
  app?: string;
  sort?: string;
};

export type MediaFilterContext = {
  status?: string;
  role?: string;
  batch?: string;
  totals?: {
    all: number;
    draft: number;
    approved: number;
    wired: number;
    archived: number;
  };
};

export type OrderFilterContext = {
  status?: string;
  q?: string;
};

export type CustomerFilterContext = {
  q?: string;
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
      kind: "media-filter";
      current: MediaFilterContext;
    }
  | {
      kind: "order-filter";
      current: OrderFilterContext;
    }
  | {
      kind: "customer-filter";
      current: CustomerFilterContext;
    }
  | {
      kind: "media-create";
      pieces: ContextPieceOption[];
    }
  | {
      kind: "media-batch";
    }
  | {
      kind: "order-line";
      orderId: string;
      pieces: ContextPieceOption[];
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

export function showMediaFilterPanel(current: MediaFilterContext) {
  panel = { kind: "media-filter", current };
  emit();
}

export function showOrderFilterPanel(current: OrderFilterContext) {
  panel = { kind: "order-filter", current };
  emit();
}

export function showCustomerFilterPanel(current: CustomerFilterContext) {
  panel = { kind: "customer-filter", current };
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

export function showOrderLinePanel(orderId: string, pieces: ContextPieceOption[]) {
  panel = { kind: "order-line", orderId, pieces };
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
