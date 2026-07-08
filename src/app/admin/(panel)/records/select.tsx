"use client";

import Link from "next/link";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { archiveRecords, restoreRecords, deleteRecords, previewDelete, type DeletePreview } from "./actions";
import type { ArchivableEntity } from "./types";
import { buzz } from "@/lib/backoffice";

/* The shared machinery for select, archive, restore, and permanent
   delete on a list room. One provider wraps the list; the toggle turns
   select mode on, each row shows a mark, and the bar floats up when a
   row is chosen. Delete asks once before it goes. Every room reuses
   this; only the cards differ. */

type Ctx = {
  entity: ArchivableEntity;
  archived: boolean;
  mode: boolean;
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleMode: () => void;
  clear: () => void;
};

const SelectCtx = createContext<Ctx | null>(null);

export function useSelect() {
  const c = useContext(SelectCtx);
  if (!c) throw new Error("useSelect used outside a SelectProvider");
  return c;
}

export function SelectProvider({
  entity,
  archived = false,
  children,
}: {
  entity: ArchivableEntity;
  archived?: boolean;
  children: ReactNode;
}) {
  const [mode, setMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleMode = () => {
    setMode((m) => !m);
    setSelected(new Set());
  };
  const clear = () => setSelected(new Set());

  return (
    <SelectCtx.Provider value={{ entity, archived, mode, selected, toggle, toggleMode, clear }}>
      {children}
    </SelectCtx.Provider>
  );
}

export function SelectToggle({ label = "Select" }: { label?: string }) {
  const { mode, toggleMode } = useSelect();
  return (
    <button type="button" onClick={toggleMode} className="link-hair text-[12px] text-dusk">
      {mode ? "Done" : label}
    </button>
  );
}

/* A quiet gold dot when the row is chosen, a resting one when not. The
   card button carries the pressed state for the screen reader, so this
   is decoration. */
export function RowCheckbox({ id }: { id: string }) {
  const { mode, selected } = useSelect();
  if (!mode) return null;
  const on = selected.has(id);
  return (
    <span
      aria-hidden="true"
      className={`mt-1 h-5 w-5 shrink-0 rounded-full transition-colors duration-200 ${
        on ? "bg-gold" : "bg-shell"
      }`}
    />
  );
}

/* Wrap any room's card. At rest it links to the record; in select mode
   it becomes a chooser with a mark, and a tap chooses instead of
   leaving. Each room keeps its own card content; only this wrapper
   changes, so a room joins select mode with almost no new code. */
export function SelectableRow({
  id,
  href,
  children,
  className = "panel group block",
  dataTour,
}: {
  id: string;
  href: string;
  children: ReactNode;
  className?: string;
  dataTour?: string;
}) {
  const { mode, selected, toggle } = useSelect();
  if (!mode) {
    return (
      <Link
        href={href}
        data-tour={dataTour}
        className={`${className} transition-transform duration-300 active:scale-[0.99]`}
      >
        {children}
      </Link>
    );
  }
  const on = selected.has(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={on}
      data-tour={dataTour}
      className={`${className} w-full text-left transition-transform duration-300 active:scale-[0.99]`}
    >
      <div className="flex items-start gap-3">
        <RowCheckbox id={id} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </button>
  );
}

/* Name the cascade in one calm line, or nothing when there is none to
   name. "This also removes 4 orders and 9 payments. This cannot be
   undone." */
function cascadeSentence(p: DeletePreview | null): string {
  if (!p) return "";
  const parts: string[] = [];
  if (p.pieces) parts.push(`${p.pieces} ${p.pieces === 1 ? "piece" : "pieces"}`);
  if (p.stock) parts.push(`${p.stock} ${p.stock === 1 ? "stock row" : "stock rows"}`);
  if (p.orderLines) parts.push(`${p.orderLines} ${p.orderLines === 1 ? "order line" : "order lines"}`);
  if (p.enquiries) parts.push(`${p.enquiries} ${p.enquiries === 1 ? "enquiry" : "enquiries"}`);
  if (p.media) parts.push(`${p.media} ${p.media === 1 ? "photo link" : "photo links"}`);
  if (p.orders) parts.push(`${p.orders} ${p.orders === 1 ? "order" : "orders"}`);
  if (p.payments) parts.push(`${p.payments} ${p.payments === 1 ? "payment" : "payments"}`);
  if (p.deliveries) parts.push(`${p.deliveries} ${p.deliveries === 1 ? "delivery" : "deliveries"}`);
  if (parts.length === 0) return "";
  const joined =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `This also removes ${joined}. This cannot be undone.`;
}

export function SelectBar() {
  const { entity, archived, selected, clear, toggleMode } = useSelect();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [preview, setPreview] = useState<DeletePreview | null>(null);
  const [msg, setMsg] = useState("");
  const ids = [...selected];
  if (ids.length === 0) return null;

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) => {
    setMsg("");
    start(async () => {
      const res = await fn();
      if (res.ok) {
        clear();
        toggleMode();
        setConfirm(false);
        setPreview(null);
      } else {
        setMsg(res.message);
      }
    });
  };

  /* Delete asks first: weigh the cascade on the server, then open the
     confirm with the weight named. A staff key is refused right here,
     before any door opens. */
  const askDelete = () => {
    setMsg("");
    start(async () => {
      const res = await previewDelete(entity, ids);
      if (res.ok) {
        setPreview(res.counts);
        setConfirm(true);
      } else {
        setMsg(res.message);
      }
    });
  };

  const cascade = cascadeSentence(preview);

  return (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8">
      <div className="glass flex flex-wrap items-center justify-center gap-4 rounded-full px-6 py-3">
        <span className="text-[14px] tabular-nums text-ink">{ids.length} chosen</span>
        {!confirm ? (
          <>
            {archived ? (
              <button
                type="button"
                onClick={() => run(() => restoreRecords(entity, ids))}
                disabled={pending}
                className="link-hair text-[12px] text-dusk disabled:opacity-60"
              >
                {pending ? "Working..." : "Restore"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  buzz(4);
                  run(() => archiveRecords(entity, ids));
                }}
                disabled={pending}
                className="link-hair text-[12px] text-dusk disabled:opacity-60"
              >
                {pending ? "Working..." : "Archive"}
              </button>
            )}
            <button
              type="button"
              onClick={askDelete}
              disabled={pending}
              className="link-hair text-[12px] text-gold disabled:opacity-60"
            >
              {pending ? "Working..." : "Delete"}
            </button>
            <button type="button" onClick={clear} className="link-hair text-[12px] text-mist">
              Clear
            </button>
          </>
        ) : (
          <>
            <span className="text-[12px] text-gold">Delete {ids.length} for good?</span>
            {cascade && <span className="text-[12px] text-dusk">{cascade}</span>}
            <button
              type="button"
              onClick={() => {
                buzz(6);
                run(() => deleteRecords(entity, ids, true));
              }}
              disabled={pending}
              className="btn-gold text-[12px] disabled:opacity-60"
            >
              {pending ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirm(false);
                setPreview(null);
              }}
              className="link-hair text-[12px] text-dusk"
            >
              Keep
            </button>
          </>
        )}
        {msg && (
          <span role="status" className="text-[12px] text-gold">
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}
