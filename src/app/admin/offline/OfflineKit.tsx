"use client";

/* The last known copy of the book, held for the road. It reads the
   snapshot the mirror saved to IndexedDB and lays it out plainly: who
   is owed, what is open, what to deliver, and every number to call.
   Nothing here is live, so the saved time is stamped loud in gold and
   every figure sits under it. Calls use tel: because a dial works with
   no network; WhatsApp does not.

   One thing can be written while offline: a payment against an open
   order. It is not applied here; it is queued, and the mirror sends it
   when the network returns. The amount is a delta the real balance will
   absorb, never a total, so it stays correct whatever the ledger has
   become by then. */

import { useEffect, useState } from "react";
import { getSnapshot } from "@/lib/offline/db";
import {
  queuePayment,
  queueDelivered,
  outboxTally,
  queuedPaymentOrderIds,
  queuedDeliveryIds,
} from "@/lib/offline/outbox";
import type { Snapshot } from "@/lib/offline/types";
import { naira, parseNaira, buzz } from "@/lib/backoffice";

type Kit =
  | { state: "loading" }
  | { state: "empty" }
  | { state: "ready"; snapshot: Snapshot };

const shell = "mx-auto flex min-h-svh max-w-6xl flex-col items-start px-5 pb-24 pt-16 sm:px-8";
const field =
  "rounded-[16px] bg-shell/60 px-4 py-3 text-[16px] text-ink tabular-nums outline-none focus:bg-shell transition-colors duration-300";
const METHODS = ["transfer", "cash", "POS"] as const;

function whenLabel(iso: string | null) {
  if (!iso) return "No date set";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OfflineKit() {
  const [kit, setKit] = useState<Kit>({ state: "loading" });
  const [queued, setQueued] = useState<Set<string>>(new Set());
  const [queuedDel, setQueuedDel] = useState<Set<string>>(new Set());
  const [waiting, setWaiting] = useState(0);
  const [failed, setFailed] = useState(0);

  const [openForm, setOpenForm] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("transfer");

  useEffect(() => {
    let live = true;
    getSnapshot()
      .then((snapshot) => {
        if (!live) return;
        setKit(snapshot ? { state: "ready", snapshot } : { state: "empty" });
      })
      .catch(() => {
        if (live) setKit({ state: "empty" });
      });
    /* The queued marks survive a reopen: read them from the outbox. */
    queuedPaymentOrderIds()
      .then((ids) => live && setQueued(new Set(ids)))
      .catch(() => {});
    queuedDeliveryIds()
      .then((ids) => live && setQueuedDel(new Set(ids)))
      .catch(() => {});
    outboxTally()
      .then((t) => {
        if (!live) return;
        setWaiting(t.waiting);
        setFailed(t.failed);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  async function take(orderId: string) {
    const amountKobo = parseNaira(amount);
    if (amountKobo <= 0) return;
    await queuePayment({ orderId, amountKobo, method, note: "" });
    setQueued((prev) => new Set(prev).add(orderId));
    setWaiting((n) => n + 1);
    setOpenForm(null);
    setAmount("");
    setMethod("transfer");
    buzz(4);
  }

  async function markDone(deliveryId: string) {
    await queueDelivered({ deliveryId });
    setQueuedDel((prev) => new Set(prev).add(deliveryId));
    setWaiting((n) => n + 1);
    buzz(4);
  }

  if (kit.state === "loading") {
    return (
      <main className={shell}>
        <p className="eyebrow">Offline</p>
        <p className="mt-4 text-[14px] leading-relaxed text-dusk">Reading the last saved copy.</p>
      </main>
    );
  }

  if (kit.state === "empty") {
    return (
      <main className={shell}>
        <p className="eyebrow">Offline</p>
        <h1 className="font-serif text-display-section mt-4 max-w-xl">Nothing saved yet.</h1>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">
          Open the book once with a connection and the field kit saves for the next time you are
          offline.
        </p>
      </main>
    );
  }

  const s = kit.snapshot;
  const owed = s.customers.filter((c) => c.balanceKobo > 0).sort((a, b) => b.balanceKobo - a.balanceKobo);
  const stamp = new Date(s.capturedAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

  return (
    <main className={shell}>
      <p className="eyebrow">Offline</p>
      <h1 className="font-serif text-display-section mt-4">The field kit.</h1>
      <p className="mt-3 text-[14px] text-gold">Last known, saved {stamp}.</p>
      {waiting > 0 && (
        <p className="mt-1 text-[12px] text-dusk">
          {waiting} {waiting === 1 ? "change" : "changes"} waiting to sync.
        </p>
      )}
      {failed > 0 && (
        <p className="mt-1 text-[12px] text-gold">{failed} could not apply.</p>
      )}

      {owed.length > 0 && (
        <section className="mt-12 w-full">
          <p className="eyebrow">Owed</p>
          <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
            {owed.map((c) => (
              <div key={c.id} className="panel">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-serif text-[20px] leading-snug">{c.name}</p>
                  <p className="text-[14px] font-medium tabular-nums text-ink">{naira(c.balanceKobo)}</p>
                </div>
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="link-hair mt-2 text-[12px] text-dusk">
                    Call
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {s.openOrders.length > 0 && (
        <section className="mt-12 w-full">
          <p className="eyebrow">Open orders</p>
          <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
            {s.openOrders.map((o) => (
              <div key={o.id} className="panel">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-serif text-[20px] leading-snug">{o.customerName}</p>
                  <span className="chip-glass shrink-0">{o.status}</span>
                </div>
                <p className="mt-3 text-[14px] tabular-nums text-dusk">Balance {naira(o.balanceKobo)}</p>

                {queued.has(o.id) ? (
                  <p className="mt-3 text-[12px] text-gold">Payment queued.</p>
                ) : openForm === o.id ? (
                  <div className="mt-4 grid gap-3">
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputMode="numeric"
                      placeholder="Amount"
                      aria-label="Payment amount"
                      className={field}
                    />
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      aria-label="How the money came in"
                      className={`${field} text-[14px]`}
                    >
                      {METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m === "POS" ? "POS" : m[0].toUpperCase() + m.slice(1)}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => take(o.id)}
                        disabled={parseNaira(amount) <= 0}
                        className="btn-gold disabled:opacity-60"
                      >
                        Queue it
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenForm(null);
                          setAmount("");
                        }}
                        className="link-hair text-[12px] text-dusk"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  o.balanceKobo > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenForm(o.id);
                        setAmount("");
                        setMethod("transfer");
                      }}
                      className="link-hair mt-3 text-[12px] text-dusk"
                    >
                      Take a payment
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {s.deliveries.length > 0 && (
        <section className="mt-12 w-full">
          <p className="eyebrow">Deliveries</p>
          <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
            {s.deliveries.map((d) => (
              <div key={d.id} className="panel">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-serif text-[20px] leading-snug">{d.customerName}</p>
                  <span className="chip-glass shrink-0">{d.status}</span>
                </div>
                {d.scheduledFor && <p className="mt-3 text-[14px] text-dusk">{whenLabel(d.scheduledFor)}</p>}
                {d.address && <p className="mt-2 text-[14px] leading-relaxed text-dusk">{d.address}</p>}
                {queuedDel.has(d.id) ? (
                  <p className="mt-3 text-[12px] text-gold">Marked done, waiting to sync.</p>
                ) : d.status === "out" ? (
                  <button
                    type="button"
                    onClick={() => markDone(d.id)}
                    className="link-hair mt-3 text-[12px] text-dusk"
                  >
                    Mark delivered
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {s.customers.length > 0 && (
        <section className="mt-12 w-full">
          <p className="eyebrow">Contacts</p>
          <div className="mt-6 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.customers.map((c) => (
              <div key={c.id} className="panel">
                <p className="font-serif text-[20px] leading-snug">{c.name}</p>
                <p className="mt-2 text-[14px] text-dusk">
                  {[c.phone, c.area].filter(Boolean).join(" / ") || "No number yet"}
                </p>
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="link-hair mt-2 inline-block text-[12px] text-dusk">
                    Call
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {s.lowStock.length > 0 && (
        <section className="mt-12 w-full">
          <p className="eyebrow">Low stock</p>
          <div className="panel mt-6 grid gap-3">
            {s.lowStock.map((p) => (
              <div key={p.pieceSlug} className="flex items-baseline justify-between gap-4">
                <p className="text-[14px] text-ink">{p.pieceName}</p>
                <p className="text-[14px] tabular-nums text-dusk">{p.quantitySheets} left</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {s.freshEnquiries.length > 0 && (
        <section className="mt-12 w-full">
          <p className="eyebrow">New enquiries</p>
          <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
            {s.freshEnquiries.map((e) => (
              <div key={e.id} className="panel">
                <p className="text-[14px] text-ink">{e.customerName ?? "Someone"}</p>
                <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-dusk">{e.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
