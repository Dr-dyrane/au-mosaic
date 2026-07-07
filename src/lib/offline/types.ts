/* The shapes the field kit caches and queues. One contract shared by
   the snapshot endpoint, the mirror, the last-known view, and the
   outbox, so a saved record reads the same everywhere. Money stays in
   kobo, the house unit; times are ISO strings. */

export type SnapshotCustomer = {
  id: string;
  name: string;
  phone: string;
  area: string;
  balanceKobo: number;
  lastOrderAt: string | null;
};

export type SnapshotOrder = {
  id: string;
  customerId: string;
  customerName: string;
  status: string;
  billedKobo: number;
  balanceKobo: number;
  createdAt: string;
};

export type SnapshotDelivery = {
  id: string;
  orderId: string;
  customerName: string;
  status: string;
  scheduledFor: string | null;
  address: string;
};

export type SnapshotStock = {
  pieceSlug: string;
  pieceName: string;
  quantitySheets: number;
  reorderAt: number;
};

export type SnapshotCatalogueItem = {
  slug: string;
  name: string;
  unit: string;
  lastGivenPriceKobo: number | null;
};

export type SnapshotEnquiry = {
  id: string;
  customerName: string | null;
  message: string;
  createdAt: string;
};

export type Snapshot = {
  capturedAt: string;
  customers: SnapshotCustomer[];
  openOrders: SnapshotOrder[];
  deliveries: SnapshotDelivery[];
  lowStock: SnapshotStock[];
  catalogue: SnapshotCatalogueItem[];
  freshEnquiries: SnapshotEnquiry[];
};

/* The outbox: append-only actions captured offline and replayed on
   reconnect. Each carries a client id so a replay cannot double apply.
   Kinds are fixed; nothing destructive is ever queued. */

export type OutboxKind = "payment" | "note" | "delivered" | "draft-order";

export type OutboxEntry = {
  id: string;
  kind: OutboxKind;
  payload: Record<string, unknown>;
  createdAt: string;
  status: "pending" | "syncing" | "failed";
  error?: string;
};
