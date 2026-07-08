"use client";

import { useState, useTransition } from "react";
import { archiveRecords } from "./actions";
import type { ArchivableEntity } from "./types";
import { buzz } from "@/lib/backoffice";

/* The quiet second door on an edit form. Save keeps the record in the
   working list; Archive folds it out of the way, reversibly, and never
   loses it (law 8). The gold on the screen belongs to Save, so this
   speaks in link-hair. It archives in place and says so; the record
   then waits under the archived view, one Restore from coming back.

   A plain type="button", so it sits inside another form without ever
   submitting it. The same button serves every archivable room: stock,
   customers, ranges, orders. Only the noun changes. */

export default function ArchiveButton({
  entity,
  id,
  label = "Archive",
}: {
  entity: ArchivableEntity;
  id: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");

  if (done) {
    return (
      <span role="status" className="text-[12px] text-dusk">
        Archived. Find it under archived to bring it back.
      </span>
    );
  }

  const onArchive = () => {
    setMsg("");
    buzz(4);
    start(async () => {
      const res = await archiveRecords(entity, [id]);
      if (res.ok) setDone(true);
      else setMsg(res.message);
    });
  };

  return (
    <span className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={onArchive}
        disabled={pending}
        className="link-hair text-[12px] text-mist disabled:opacity-60"
      >
        {pending ? "Archiving..." : label}
      </button>
      {msg && (
        <span role="status" className="text-[12px] text-gold">
          {msg}
        </span>
      )}
    </span>
  );
}
