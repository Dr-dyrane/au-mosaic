"use client";

/* A thin IndexedDB wrapper for the field kit. Two stores: one holds
   the latest snapshot under a fixed key, the other is the outbox of
   queued actions keyed by their client id. Hand-rolled to match the
   house style, no dependency. Every call resolves to a promise, and
   the database is opened and closed per call, which suits the field
   kit's low, deliberate traffic. */

import type { Snapshot, OutboxEntry } from "./types";

const DB_NAME = "aumosaic-offline";
const DB_VERSION = 1;
const KV = "kv";
const OUTBOX = "outbox";
const SNAPSHOT_KEY = "snapshot";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available here"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
      if (!db.objectStoreNames.contains(OUTBOX)) db.createObjectStore(OUTBOX, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        t.oncomplete = () => {
          db.close();
          resolve(req.result as T);
        };
        t.onerror = () => {
          db.close();
          reject(t.error);
        };
      })
  );
}

export function putSnapshot(snapshot: Snapshot): Promise<void> {
  return tx<IDBValidKey>(KV, "readwrite", (s) => s.put(snapshot, SNAPSHOT_KEY)).then(() => undefined);
}

export function getSnapshot(): Promise<Snapshot | null> {
  return tx<Snapshot | undefined>(KV, "readonly", (s) => s.get(SNAPSHOT_KEY)).then((v) => v ?? null);
}

export function addToOutbox(entry: OutboxEntry): Promise<void> {
  return tx<IDBValidKey>(OUTBOX, "readwrite", (s) => s.put(entry)).then(() => undefined);
}

export function listOutbox(): Promise<OutboxEntry[]> {
  return tx<OutboxEntry[] | undefined>(OUTBOX, "readonly", (s) => s.getAll()).then((v) => v ?? []);
}

export function removeFromOutbox(id: string): Promise<void> {
  return tx<undefined>(OUTBOX, "readwrite", (s) => s.delete(id)).then(() => undefined);
}

export function updateOutbox(id: string, patch: Partial<OutboxEntry>): Promise<void> {
  return open().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(OUTBOX, "readwrite");
        const store = t.objectStore(OUTBOX);
        const get = store.get(id);
        get.onsuccess = () => {
          const cur = get.result as OutboxEntry | undefined;
          if (cur) store.put({ ...cur, ...patch, id });
        };
        t.oncomplete = () => {
          db.close();
          resolve();
        };
        t.onerror = () => {
          db.close();
          reject(t.error);
        };
      })
  );
}
