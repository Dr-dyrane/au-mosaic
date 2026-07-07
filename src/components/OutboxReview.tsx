"use client";

/* The waiting room for queued writes. When the field kit captures a
   payment or a done delivery offline, it rests here until signal
   returns. Most of the time this stays quiet: a small count of what
   is waiting, and one gold tap to send it. When a write cannot land,
   for example the order it named is gone, it turns up here to be
   dismissed gently. Invisible when the queue is empty. */

import { useEffect, useState } from "react";
import { listOutbox, removeFromOutbox } from "@/lib/offline/db";
import { flushOutbox } from "@/lib/offline/outbox";
import type { OutboxEntry } from "@/lib/offline/types";
import { naira } from "@/lib/backoffice";

function describe(entry: OutboxEntry): string {
  const payload = entry.payload;
  if (entry.kind === "payment" && typeof payload.amountKobo === "number") {
    return `Payment of ${naira(payload.amountKobo)}`;
  }
  if (entry.kind === "delivered") {
    return "A delivery marked done";
  }
  return "A queued change";
}

export default function OutboxReview() {
  const [entries, setEntries] = useState<OutboxEntry[]>([]);

  const reload = () => {
    listOutbox()
      .then(setEntries)
      .catch(() => setEntries([]));
  };

  useEffect(() => {
    reload();
  }, []);

  if (entries.length === 0) return null;

  const waiting = entries.filter((e) => e.status === "pending" || e.status === "syncing");
  const failed = entries.filter((e) => e.status === "failed");

  const dismiss = (id: string) => {
    removeFromOutbox(id)
      .then(reload)
      .catch(() => {});
  };

  const syncNow = () => {
    flushOutbox()
      .then(reload)
      .catch(() => {});
  };

  return (
    <div className="panel">
      <p className="eyebrow">Waiting to sync</p>

      {waiting.length > 0 && (
        <p className="mt-2 text-[14px] leading-relaxed text-dusk">
          <span className="tabular-nums">{waiting.length}</span> waiting to sync.
        </p>
      )}

      {failed.length > 0 && (
        <div className="mt-4 grid gap-3">
          {failed.map((entry) => (
            <div key={entry.id} className="panel">
              <p className="text-[14px] leading-relaxed text-ink">{describe(entry)}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-dusk">
                Could not apply. Dismiss it, or check the order when you have signal.
              </p>
              {entry.error && (
                <p className="mt-1 text-[12px] leading-relaxed text-mist">{entry.error}</p>
              )}
              <button
                type="button"
                onClick={() => dismiss(entry.id)}
                className="link-hair mt-3 text-dusk text-[12px]"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={syncNow} className="btn-gold mt-6">
        Sync now
      </button>
    </div>
  );
}
