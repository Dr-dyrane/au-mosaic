"use client";

import { useActionState } from "react";
import { AuMark } from "@/components/Mosaic";
import { login } from "./actions";

/* The back door of the maison. One field, no ceremony. */

export default function AdminLogin() {
  const [state, action, pending] = useActionState(login, null);
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
          <input
            type="password"
            name="password"
            autoFocus
            autoComplete="current-password"
            aria-label="Password"
            placeholder="Password"
            className="w-full rounded-full bg-shell/60 px-5 py-3 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell"
          />
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
