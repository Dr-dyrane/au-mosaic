"use client";

import {
  startTransition,
  useActionState,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { attachEnquiry, setEnquiryStatus, type SaveState } from "./actions";
import { archiveRecords } from "../records/actions";
import AdminSheet from "@/components/AdminSheet";
import { IconMore } from "../icons";
import Sentence from "../Sentence";
import { keepValues } from "../keep";
import { buzz } from "@/lib/backoffice";

/* One fresh enquiry, one verb on the row. A nameless tap leads with
   Attach, so the funnel can count people; a named one leads with
   Replied, the everyday clear. Everything else waits behind the dots:
   mark replied, close, archive, each named for what it does. The row
   clears the instant he taps, the server confirms behind it, and on
   failure the enquiry walks back with a sentence. The conversation
   itself lives in WhatsApp; this only clears the desk. */

const select =
  "min-w-0 rounded-full bg-shell/60 px-4 py-2 text-[14px] text-ink outline-none focus:bg-shell transition-colors duration-300";

const sheetRow =
  "min-h-11 w-full rounded-full px-2 text-left text-[14px] text-ink transition-colors duration-300 hover:text-gold disabled:opacity-60";

export default function EnquiryRow({
  id,
  line,
  when,
  attached,
  people,
}: {
  id: string;
  line: string;
  when: string;
  attached?: string;
  people: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(setEnquiryStatus, null);
  const [tieState, tieAction, tiePending] = useActionState<SaveState, FormData>(attachEnquiry, null);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [archiving, startArchive] = useTransition();
  const [cleared, clearNow] = useOptimistic<
    "replied" | "closed" | "archived" | null,
    "replied" | "closed" | "archived"
  >(null, (_c, v) => v);

  /* A successful tie closes the picker by derivation; the revalidated
     row carries the name from then on and the button itself leaves. */
  const showPicker = open && !attached && !tieState?.ok;

  /* The accessible name says who each verb touches: the tied name
     when there is one, the tap's own line when there is not. */
  const who = attached ?? line;
  const canAttach = !attached && people.length > 0;

  /* keepValues carries the submitter, so Replied keeps its name and
     the reset can never eat the row's state. */
  const submit = keepValues((form) => {
    clearNow(form.get("to") as "replied" | "closed");
    action(form);
  });

  /* The sheet's verbs post the same payload the row's form would,
     inside a transition so the optimistic clear holds. */
  const clearTo = (to: "replied" | "closed") => {
    buzz(4);
    setMore(false);
    const form = new FormData();
    form.set("id", id);
    form.set("to", to);
    startTransition(() => {
      clearNow(to);
      action(form);
    });
  };

  const archive = () => {
    setMore(false);
    startArchive(async () => {
      buzz(4);
      clearNow("archived");
      await archiveRecords("enquiry", [id]);
    });
  };

  if (cleared) {
    return (
      <p className="py-3 text-[14px] text-dusk" role="status">
        {cleared === "replied" ? "Marked replied." : cleared === "closed" ? "Closed." : "Archived."}
      </p>
    );
  }

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] text-ink">{line}</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-mist">
            {when}
            {attached && <span className="text-dusk"> · {attached}</span>}
          </p>
        </div>
        <form onSubmit={submit} className="flex shrink-0 items-center gap-5">
          <input type="hidden" name="id" value={id} />
          {canAttach ? (
            <button
              type="button"
              onClick={() => {
                buzz(3);
                setOpen(!open);
              }}
              aria-expanded={open}
              aria-label={`Attach, for ${who}`}
              data-tour="tie"
              className="link-hair text-dusk text-[12px]"
            >
              Attach
            </button>
          ) : (
            <button
              type="submit"
              name="to"
              value="replied"
              onClick={() => buzz(4)}
              disabled={pending}
              aria-label={`Replied, for ${who}`}
              className="link-hair text-dusk text-[12px] disabled:opacity-60"
            >
              Replied
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              buzz(3);
              setMore(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={more}
            aria-label={`More for ${who}`}
            className="-my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-mist transition-colors duration-300 hover:text-ink"
          >
            <IconMore className="h-4 w-4" />
          </button>
          {state && !state.ok && (
            <p className="text-[12px] text-gold" role="status">
              {state.message}
            </p>
          )}
        </form>
      </div>
      <AdminSheet
        open={more}
        onOpenChange={setMore}
        title="Enquiry"
        description={`${line}. ${when}.`}
      >
        <div className="grid gap-1 px-2">
          {canAttach && (
            <button
              type="button"
              onClick={() => clearTo("replied")}
              disabled={pending}
              aria-label={`Mark replied, for ${who}`}
              className={sheetRow}
            >
              Mark replied
            </button>
          )}
          <button
            type="button"
            onClick={() => clearTo("closed")}
            disabled={pending}
            aria-label={`Close enquiry, for ${who}`}
            className={sheetRow}
          >
            Close enquiry
          </button>
          <button
            type="button"
            onClick={archive}
            disabled={archiving}
            aria-label={`Archive enquiry, for ${who}`}
            className={sheetRow}
          >
            Archive enquiry
          </button>
        </div>
      </AdminSheet>
      {showPicker && (
        <form
          onSubmit={keepValues(tieAction)}
          className="mt-3 flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="id" value={id} />
          <select name="customerId" required defaultValue="" aria-label="Who is this" className={select}>
            <option value="" disabled>
              Who is this?
            </option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            onClick={() => buzz(4)}
            disabled={tiePending}
            className="link-hair text-dusk text-[12px] disabled:opacity-60"
          >
            {tiePending ? "Tying..." : "Tie them"}
          </button>
          <Sentence state={tieState} />
        </form>
      )}
    </div>
  );
}
