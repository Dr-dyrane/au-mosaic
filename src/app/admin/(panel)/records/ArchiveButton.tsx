"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
   customers, ranges, orders. Only the noun changes.

   Pass confirm with the record's human name and the button asks first:
   the control swaps in place for a one-line question and two plain
   buttons, named object, honest consequence. Focus lands on Keep it,
   so a second Enter changes nothing; declining hands focus back to
   the trigger. Callers that skip the prop keep the one-tap door. */

export default function ArchiveButton({
  entity,
  id,
  label = "Archive",
  confirm,
}: {
  entity: ArchivableEntity;
  id: string;
  label?: string;
  confirm?: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");
  const [asking, setAsking] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const wantTriggerFocus = useRef(false);

  /* The trigger unmounts while the question stands, so focus is walked
     by hand: onto Keep it when the question opens, back onto the
     trigger when the answer is no. */
  useEffect(() => {
    if (asking) keepRef.current?.focus();
    else if (wantTriggerFocus.current) {
      wantTriggerFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [asking]);

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

  if (asking) {
    /* An archived piece leaves the site window too (the catalogue only
       serves unarchived rows), so the question says so. */
    const consequence =
      entity === "piece"
        ? "It leaves the site and the working list; Restore brings it back."
        : "It leaves the working list; Restore brings it back.";
    return (
      <span className="flex flex-wrap items-center gap-4">
        <span className="text-[12px] text-dusk">
          Archive {confirm}? {consequence}
        </span>
        <button
          type="button"
          onClick={onArchive}
          disabled={pending}
          className="link-hair text-[12px] text-ink disabled:opacity-60"
        >
          {pending ? "Archiving..." : "Archive it"}
        </button>
        <button
          ref={keepRef}
          type="button"
          onClick={() => {
            wantTriggerFocus.current = true;
            setAsking(false);
          }}
          disabled={pending}
          className="link-hair text-[12px] text-mist disabled:opacity-60"
        >
          Keep it
        </button>
        {msg && (
          <span role="status" className="text-[12px] text-dusk">
            {msg}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-4">
      <button
        ref={triggerRef}
        type="button"
        onClick={confirm ? () => setAsking(true) : onArchive}
        disabled={pending}
        className="link-hair text-[12px] text-mist disabled:opacity-60"
      >
        {pending ? "Archiving..." : label}
      </button>
      {msg && (
        <span role="status" className="text-[12px] text-dusk">
          {msg}
        </span>
      )}
    </span>
  );
}
