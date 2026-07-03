"use client";

import { useActionState, useState } from "react";
import { AuMark } from "@/components/Mosaic";
import { IconEye } from "../(panel)/icons";
import { keepValues } from "../(panel)/keep";
import { login } from "./actions";

/* The back door of the maison. One field, no ceremony, and an eye so
   a long password typed on a phone can be checked before Enter. */

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
        {/* onSubmit keeps a mistyped password in the field; retyping
            a long key on a phone is a tax the door should not charge. */}
        <form onSubmit={keepValues(action)} className="mt-6">
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
              <IconEye open={show} className="h-5 w-5" />
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
