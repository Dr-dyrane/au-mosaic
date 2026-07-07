/* The back office's service worker. Scope /admin only: the shop
   window stays untouched. Philosophy: the truth lives on the server,
   so pages are network-first and never served stale; only the app
   shell's static assets are cached, and losing the network shows a
   calm room instead of a browser error. */

const VERSION = "admin-v3";
const OFFLINE_URL = "/admin/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll([OFFLINE_URL])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  /* Build assets: online wins, cache only helps a quiet connection. */
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
        .then(
          (hit) =>
            hit ||
            new Response("", {
              status: 504,
              statusText: "Offline",
            })
      )
    );
    return;
  }

  /* Admin pages: always fresh, calm room when the network is gone. */
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
  }
});

/* Notifications: one morning digest and true threshold crossings,
   in house voice, tapping open the room that asked. */
self.addEventListener("push", (event) => {
  let data = { title: "The back office", body: "", url: "/admin" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.png",
      badge: "/icon.png",
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/admin") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

/* Background sync: on Android Chrome, a flush registered when an action
   was queued wakes here after the network returns, even if the app is
   closed. The outbox lives in the same IndexedDB the client uses; an
   applied entry is deleted. The sync routes are idempotent, so this
   flush and the client's own flush cannot double apply if they overlap.
   The store shape is declared here too, so whichever side opens the
   database first, the stores exist. */

const OUTBOX_DB = "aumosaic-offline";
const OUTBOX_STORE = "outbox";
const SYNC_ROUTES = {
  payment: "/admin/api/sync/payment",
  delivered: "/admin/api/sync/delivered",
  note: "/admin/api/sync/note",
  "draft-order": "/admin/api/sync/draft-order",
};

function openOutbox() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OUTBOX_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) db.createObjectStore(OUTBOX_STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function outboxEntries(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, "readonly");
    const req = tx.objectStore(OUTBOX_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function dropEntry(db, id) {
  return new Promise((resolve) => {
    const tx = db.transaction(OUTBOX_STORE, "readwrite");
    tx.objectStore(OUTBOX_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function flushOutbox() {
  let db;
  try {
    db = await openOutbox();
  } catch {
    return;
  }
  let entries = [];
  try {
    entries = await outboxEntries(db);
  } catch {
    db.close();
    return;
  }
  for (const entry of entries) {
    if (entry.status === "failed") continue;
    const url = SYNC_ROUTES[entry.kind];
    if (!url) continue;
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.assign({ clientOpId: entry.id }, entry.payload)),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.ok) await dropEntry(db, entry.id);
      }
    } catch {
      /* Still gone; leave it for the client or the next wake. */
    }
  }
  db.close();
}

self.addEventListener("sync", (event) => {
  if (event.tag === "flush-outbox") {
    event.waitUntil(flushOutbox());
  }
});
