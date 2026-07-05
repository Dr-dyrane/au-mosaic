"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import AdminSheet from "@/components/AdminSheet";
import {
  clearAdminContextPanel,
  getAdminContextPanel,
  showMediaBatchPanel,
  subscribeAdminContextPanel,
} from "@/components/admin-context-panel-store";
import { buzz } from "@/lib/backoffice";
import Sentence from "../Sentence";
import { importBatch08Action, promoteBatch08Action, type MediaState } from "./actions";

const railQuery = "(min-width: 1280px)";

function subscribeRailWidth(listener: () => void) {
  const query = window.matchMedia(railQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function getRailWidth() {
  return window.matchMedia(railQuery).matches;
}

export function MediaBatchPanel({ surface = "panel" }: { surface?: "panel" | "plain" }) {
  const [importState, importAction, importPending] = useActionState<MediaState, FormData>(
    importBatch08Action,
    null
  );
  const [promoteState, promoteAction, promotePending] = useActionState<MediaState, FormData>(
    promoteBatch08Action,
    null
  );
  const plain = surface === "plain";
  return (
    <div className={plain ? "" : "panel mt-8 max-w-3xl"} data-tour="media-batch">
      <p className="font-serif text-[20px]">Prepared photos.</p>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-dusk">
        Add the prepared product photos, then make the approved product
        displays live. The kitchen pair stays as a room example.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4">
        <form action={importAction}>
          <button type="submit" disabled={importPending} className="link-hair text-dusk text-[13px] disabled:opacity-60">
            {importPending ? "Adding..." : "Add prepared photos"}
          </button>
        </form>
        <form action={promoteAction}>
          <button type="submit" disabled={promotePending} className="link-hair text-dusk text-[13px] disabled:opacity-60">
            {promotePending ? "Making live..." : "Make product photos live"}
          </button>
        </form>
      </div>
      <div className="mt-4 space-y-2">
        <Sentence state={importState} />
        <Sentence state={promoteState} />
      </div>
    </div>
  );
}

export default function MediaBatchAction() {
  const [open, setOpen] = useState(false);
  const wide = useSyncExternalStore(subscribeRailWidth, getRailWidth, () => false);
  const panel = useSyncExternalStore(subscribeAdminContextPanel, getAdminContextPanel, () => null);
  const railOpen = panel?.kind === "media-batch";

  useEffect(() => {
    const openPrepared = () => {
      buzz(3);
      if (wide) {
        setOpen(false);
        if (railOpen) clearAdminContextPanel();
        else showMediaBatchPanel();
      } else {
        if (railOpen) clearAdminContextPanel();
        setOpen(true);
      }
    };
    window.addEventListener("admin:media-prepared", openPrepared);
    return () => window.removeEventListener("admin:media-prepared", openPrepared);
  }, [railOpen, wide]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          buzz(3);
          if (wide) {
            setOpen(false);
            if (railOpen) clearAdminContextPanel();
            else showMediaBatchPanel();
          } else {
            if (railOpen) clearAdminContextPanel();
            setOpen(true);
          }
        }}
        aria-controls={open || railOpen ? "media-prepared-photos" : undefined}
        aria-expanded={open || railOpen}
        className="link-hair text-dusk text-[13px]"
      >
        Prepared photos
      </button>
      <AdminSheet
        open={open && !wide}
        onOpenChange={setOpen}
        title="Prepared photos"
        description="Add product photos, then make approved displays live."
        id="media-prepared-photos"
      >
        <MediaBatchPanel surface="plain" />
      </AdminSheet>
    </>
  );
}
