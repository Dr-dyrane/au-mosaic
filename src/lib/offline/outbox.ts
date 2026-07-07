"use client";

/* The outbox: actions captured while offline, replayed when the network
   returns. Only appends live here, never a computed total, so a queued
   action stays correct whatever the ledger has become. Each entry's id
   is its idempotency key, sent to the sync door so a repeat settles
   nothing twice. */

import { addToOutbox, listOutbox, removeFromOutbox, updateOutbox } from "./db";
import type { OutboxEntry, OutboxKind } from "./types";

export type PaymentOp = {
  orderId: string;
  amountKobo: number;
  method: string;
  note: string;
};

export type DeliveredOp = {
  deliveryId: string;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `op-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeEntry(kind: OutboxKind, payload: Record<string, unknown>): OutboxEntry {
  return {
    id: newId(),
    kind,
    payload,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
}

export type OutboxTally = { waiting: number; failed: number };

export async function outboxTally(): Promise<OutboxTally> {
  const all = await listOutbox();
  let waiting = 0;
  let failed = 0;
  for (const e of all) {
    if (e.status === "failed") failed += 1;
    else waiting += 1;
  }
  return { waiting, failed };
}

function requestBackgroundSync(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => {
      const withSync = reg as ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> };
      };
      return withSync.sync?.register("flush-outbox");
    })
    .catch(() => {});
}

export async function queuePayment(op: PaymentOp): Promise<void> {
  await addToOutbox(makeEntry("payment", { ...op }));
  requestBackgroundSync();
}

export async function queueDelivered(op: DeliveredOp): Promise<void> {
  await addToOutbox(makeEntry("delivered", { ...op }));
  requestBackgroundSync();
}

async function idsByKind(kind: OutboxKind, field: string): Promise<string[]> {
  const all = await listOutbox();
  const ids: string[] = [];
  for (const e of all) {
    if (e.kind !== kind) continue;
    const value = e.payload[field];
    if (typeof value === "string" && value) ids.push(value);
  }
  return ids;
}

export function queuedPaymentOrderIds(): Promise<string[]> {
  return idsByKind("payment", "orderId");
}

export function queuedDeliveryIds(): Promise<string[]> {
  return idsByKind("delivered", "deliveryId");
}

const ROUTE: Record<OutboxKind, string> = {
  payment: "/admin/api/sync/payment",
  note: "/admin/api/sync/note",
  delivered: "/admin/api/sync/delivered",
  "draft-order": "/admin/api/sync/draft-order",
};

let flushing = false;

export type FlushResult = { applied: number; failed: number; pending: number };

export async function flushOutbox(): Promise<FlushResult> {
  const result: FlushResult = { applied: 0, failed: 0, pending: 0 };
  if (flushing) return result;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return result;
  flushing = true;
  try {
    const entries = await listOutbox();
    for (const entry of entries) {
      /* A settled failure waits for the owner to dismiss it, not for a
         retry, so it is left alone here. */
      if (entry.status === "failed") continue;
      const url = ROUTE[entry.kind];
      if (!url) continue;
      await updateOutbox(entry.id, { status: "syncing", error: undefined });
      try {
        const res = await fetch(url, {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ clientOpId: entry.id, ...entry.payload }),
        });
        if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string };
          if (data.ok) {
            await removeFromOutbox(entry.id);
            result.applied += 1;
          } else {
            /* A 200 with ok false is a settled no, not a hiccup: the
               target is gone. Keep it, marked failed, for a look. */
            await updateOutbox(entry.id, { status: "failed", error: data.reason ?? "could not apply" });
            result.failed += 1;
          }
        } else if (res.status === 400 || res.status === 401) {
          await updateOutbox(entry.id, { status: "failed", error: `refused (${res.status})` });
          result.failed += 1;
        } else {
          /* 503 and the rest are passing faults; leave it to retry. */
          await updateOutbox(entry.id, { status: "pending", error: undefined });
          result.pending += 1;
        }
      } catch {
        /* The network gave out mid send. Retry next time. */
        await updateOutbox(entry.id, { status: "pending", error: undefined });
        result.pending += 1;
      }
    }
  } finally {
    flushing = false;
  }
  return result;
}
