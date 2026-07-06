"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { archiveRecords, restoreRecords, deleteRecords } from "./actions";
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

export function SelectBar() {
  const { entity, archived, selected, clear, toggleMode } = useSelect();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
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
      } else {
        setMsg(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8">
      <div className="glass flex flex-wrap items-center justify-center gap-4 rounded-full px-6 py-3">
        <span className="text-[13px] tabular-nums text-ink">{ids.length} chosen</span>
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
              onClick={() => setConfirm(true)}
              disabled={pending}
              className="link-hair text-[12px] text-gold disabled:opacity-60"
            >
              Delete
            </button>
            <button type="button" onClick={clear} className="link-hair text-[12px] text-mist">
              Clear
            </button>
          </>
        ) : (
          <>
            <span className="text-[12px] text-gold">Delete {ids.length} for good?</span>
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
            <button type="button" onClick={() => setConfirm(false)} className="link-hair text-[12px] text-dusk">
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
