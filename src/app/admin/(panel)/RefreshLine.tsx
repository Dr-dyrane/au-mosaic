"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconRefresh } from "./icons";
import { buzz } from "@/lib/backoffice";

/* The installed app hides the browser's reload, so the glance carries
   its own: fresh on arrival, a time stamp once he asks again. */

export default function RefreshLine() {
  const router = useRouter();
  const [at, setAt] = useState<string | null>(null);
  return (
    <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-mist">
      {at ? `Updated ${at}` : "Updated just now"}
      <button
        onClick={() => {
          buzz(3);
          router.refresh();
          setAt(new Date().toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" }));
        }}
        className="link-hair ml-3 inline-flex items-center gap-1.5 align-bottom text-dusk"
      >
        <IconRefresh className="h-3 w-3" />
        refresh
      </button>
    </p>
  );
}
