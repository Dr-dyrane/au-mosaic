"use client";

import { useActionState, useState } from "react";
import { AuMark } from "@/components/Mosaic";
import { login } from "./actions";

/* The back door of the maison. One field, no ceremony, and an eye so
   a long password typed on a phone can be checked before Enter. */

function Eye({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
      {!open && <path d="M4 4l16 16" />}
    </svg>
  );
}

export default function AdminLogin() {
  const [state, action, pending] = useActionState(login, null);
  const [show, setShow] = useState(false);
  return (
    <main className="flex min-h-svh items-center justify-center px-5">
      <div className="panel w-full max-w-sm">
        <div className="flex items-center gap-2.5">
          <AuMark className="h-[15px] w-auto" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
            Back office
          </span>
        </div>
        <p className="font-serif mt-6 text-[20px]">The house key, please.</p>
        <form action={action} className="mt-6">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              name="password"
              autoFocus
              autoComplete="current-password"
              aria-label="Password"
              placeholder="Password"
              className="w-full rounded-full bg-shell/60 py-3 pl-5 pr-12 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-dusk transition-colors duration-300 hover:text-ink"
            >
              <Eye open={show} />
            </button>
          </div>
          {state?.error && (
            <p className="mt-3 px-1 text-[12px] text-dusk">{state.error}</p>
          )}
          <button type="submit" disabled={pending} className="btn-gold mt-5 w-full disabled:opacity-60">
            {pending ? "Checking..." : "Enter"}
          </button>
        </form>
      </div>
    </main>
  );
}
