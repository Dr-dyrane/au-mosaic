"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshSnapshot } from "@/lib/offline/mirror";
import { flushOutbox } from "@/lib/offline/outbox";

/* Mounts beside AdminSw. It keeps the field kit's saved copy fresh
   while online (on load, on focus, every few minutes, and when the
   network returns) and prefetches the offline shell so it can paint
   with no connection. It renders nothing. */

const REFRESH_MS = 5 * 60 * 1000;

export default function OfflineMirror() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/admin/offline");

    const tick = () => {
      /* Push queued actions up first, then pull the fresh copy down, so
         the snapshot reflects anything that just synced. */
      flushOutbox().then(() => refreshSnapshot());
    };
    tick();

    const id = window.setInterval(tick, REFRESH_MS);
    const onFocus = () => tick();
    const onOnline = () => tick();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [router]);

  return null;
}
