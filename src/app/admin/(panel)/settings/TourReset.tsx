"use client";

import { useState } from "react";
import { buzz } from "@/lib/backoffice";

/* The welcome, returned. One tap clears the toured flags on this
   device: the first-morning offer meets the glance again and the
   teaching copy comes back with it. Client-only; the book is not
   involved, and other devices keep their memory. */

export default function TourReset() {
  const [done, setDone] = useState(false);

  const beginAgain = () => {
    buzz(3);
    try {
      for (const k of Object.keys(localStorage)) {
        if (k === "aumosaic.toured" || k.startsWith("aumosaic.toured.")) {
          localStorage.removeItem(k);
        }
      }
      window.dispatchEvent(new Event("aumosaic:toured"));
    } catch {}
    setDone(true);
  };

  if (done) {
    return (
      <p role="status" className="mt-4 text-[13px] leading-relaxed text-dusk">
        Done. The welcome meets you at the glance.
      </p>
    );
  }
  return (
    <button type="button" onClick={beginAgain} className="link-hair mt-4 text-dusk text-[13px]">
      Begin again
    </button>
  );
}
