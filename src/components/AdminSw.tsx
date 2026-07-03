"use client";

import { useEffect } from "react";

/* Registers the back office's service worker, scoped to /admin so
   the shop window never runs it. With the manifest this makes the
   office a real installable app on his phone. */

export default function AdminSw() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => {});
    }
  }, []);
  return null;
}
