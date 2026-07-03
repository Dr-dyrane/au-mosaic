"use client";

import { useSyncExternalStore } from "react";

/* Teaching copy that knows when to retire. A line wrapped in Teach
   shows until its room's tour chapter is done (or any tour ending,
   the legacy key), then leaves the screen for good: words for the
   newcomer, silence for the resident. Empty states and error rooms
   never wear this; their teaching is the law. The server renders
   nothing, so veterans never see a flash of the training wheels. */

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("aumosaic:toured", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("aumosaic:toured", onChange);
  };
}

function serverSnapshot(): string {
  return "1";
}

export default function Teach({
  until = "basics",
  children,
}: {
  until?: string;
  children: React.ReactNode;
}) {
  const done = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(`aumosaic.toured.${until}`) ??
          localStorage.getItem("aumosaic.toured") ??
          "";
      } catch {
        return "1";
      }
    },
    serverSnapshot
  );
  if (done) return null;
  return <>{children}</>;
}
