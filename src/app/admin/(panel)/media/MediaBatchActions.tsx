"use client";

import { useActionState } from "react";
import Sentence from "../Sentence";
import { importBatch08Action, promoteBatch08Action, type MediaState } from "./actions";

export default function MediaBatchActions() {
  const [importState, importAction, importPending] = useActionState<MediaState, FormData>(
    importBatch08Action,
    null
  );
  const [promoteState, promoteAction, promotePending] = useActionState<MediaState, FormData>(
    promoteBatch08Action,
    null
  );
  return (
    <div className="panel mt-8 max-w-3xl" data-tour="media-batch">
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
          <button type="submit" disabled={promotePending} className="btn-gold">
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
