"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

/* One owner for the matched customer. The page shows this panel until
   a draft opens; the draft carries its own customer card, so this one
   steps aside while the draft is up. A single shared bit decides. */

let draftUp = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  for (const l of listeners) l();
}

/* The draft calls this on mount; unmount lowers the flag. */
export function useRaiseDraft() {
  useEffect(() => {
    draftUp = true;
    emit();
    return () => {
      draftUp = false;
      emit();
    };
  }, []);
}

export default function MatchPanel({
  match,
}: {
  match: { id: string; name: string; phone: string; area: string };
}) {
  const raised = useSyncExternalStore(
    subscribe,
    () => draftUp,
    () => false
  );
  if (raised) return null;

  return (
    <div className="panel mt-8 max-w-md">
      <p className="eyebrow">The book knows them</p>
      <p className="mt-3 font-serif text-[26px]">{match.name}</p>
      <p className="mt-2 text-[14px] text-dusk">
        {[match.phone, match.area].filter(Boolean).join(" / ")}
      </p>
      <Link
        href={`/admin/customers/${match.id}`}
        className="link-hair mt-4 inline-block text-[12px] text-dusk"
      >
        Their record
      </Link>
    </div>
  );
}
