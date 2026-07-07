"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { dropPushSubscription, savePushSubscription, type SaveState } from "./actions";
import Sentence from "../Sentence";
import Teach from "../Teach";
import { buzz } from "@/lib/backoffice";

/* Notify this phone: the device subscribes itself and the book
   remembers the endpoint. One digest each morning plus true
   crossings, never a nag; quieting the phone leaves its row
   inactive, deleted never. The flag mirroring this device's state
   lives on the device, where the truth of it lives anyway. */

const FLAG = "aumosaic.push";

function snapshot(): string {
  try {
    return localStorage.getItem(FLAG) ?? "";
  } catch {
    return "";
  }
}

function serverSnapshot(): string {
  return "";
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("aumosaic:push", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("aumosaic:push", onChange);
  };
}

function setFlag(v: "1" | "") {
  try {
    if (v) localStorage.setItem(FLAG, v);
    else localStorage.removeItem(FLAG);
    window.dispatchEvent(new Event("aumosaic:push"));
  } catch {}
}

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function NotifyToggle() {
  const on = useSyncExternalStore(subscribe, snapshot, serverSnapshot) === "1";
  const [capability, setCapability] = useState<"checking" | "supported" | "unsupported">(
    "checking",
  );
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<SaveState>(null);
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    const id = window.setTimeout(() => {
      setCapability(
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
          ? "supported"
          : "unsupported",
      );
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  if (capability === "checking") {
    return (
      <p className="mt-4 text-[14px] leading-relaxed text-dusk">
        Checking this phone.
      </p>
    );
  }

  async function turnOn() {
    if (!pub) return;
    setBusy(true);
    setState(null);
    try {
      const leave = await Notification.requestPermission();
      if (leave !== "granted") {
        setState({ ok: false, message: "The phone said no. Allow notifications and try again." });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64ToBytes(pub),
        }));
      const json = sub.toJSON();
      const form = new FormData();
      form.set("endpoint", sub.endpoint);
      form.set("p256dh", json.keys?.p256dh ?? "");
      form.set("auth", json.keys?.auth ?? "");
      const res = await savePushSubscription(null, form);
      setState(res);
      if (res?.ok) {
        buzz(5);
        setFlag("1");
      }
    } catch {
      setState({ ok: false, message: "The subscription did not land. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setState(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const form = new FormData();
        form.set("endpoint", sub.endpoint);
        await sub.unsubscribe();
        const res = await dropPushSubscription(null, form);
        setState(res);
      }
      buzz(3);
      setFlag("");
    } catch {
      setState({ ok: false, message: "The phone did not let go. Try again." });
    } finally {
      setBusy(false);
    }
  }

  if (capability === "unsupported") {
    return (
      <p className="mt-4 text-[14px] leading-relaxed text-dusk">
        This browser cannot carry notifications. On iPhone, install the
        app to the Home Screen first (iOS 16.4 or later), then return
        here.
      </p>
    );
  }

  if (!pub) {
    return (
      <p className="mt-4 text-[14px] leading-relaxed text-dusk">
        The morning tap is not ready yet. Turn on notification keys, and
        this switch wakes with the next update.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-6">
        <button
          onClick={on ? turnOff : turnOn}
          disabled={busy}
          aria-pressed={on}
          className="link-hair text-dusk text-[12px] disabled:opacity-60"
        >
          {busy ? "A moment..." : on ? "Quiet this phone" : "Notify this phone"}
        </button>
        <Sentence state={state} />
      </div>
      <Teach>
        <p className="mt-3 text-[12px] leading-relaxed text-mist">
          One digest at eight each morning, plus a tap when a delivery
          runs a piece low. Nothing else, ever. On iPhone, install the
          app to the Home Screen first (iOS 16.4 or later).
        </p>
      </Teach>
    </div>
  );
}
