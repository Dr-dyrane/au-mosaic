"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef } from "react";
import { removePhoto, uploadPhoto, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import Teach from "../../Teach";
import { keepValues } from "../../keep";

/* The face of the piece, in both suns. Two slots, night and day,
   each its own quiet form: pick a file, it uploads on Save, the
   thumbnail answers. Uploads whisper (link-hair); the page's one
   gold button stays with the piece form below. */

function Slot({
  slug,
  which,
  title,
  hint,
  current,
}: {
  slug: string;
  which: "night" | "day";
  title: string;
  hint: string;
  current: string | null;
}) {
  const [upState, upAction, upPending] = useActionState<SaveState, FormData>(uploadPhoto, null);
  const [rmState, rmAction, rmPending] = useActionState<SaveState, FormData>(removePhoto, null);
  const upRef = useRef<HTMLFormElement>(null);
  const state = upState ?? rmState;
  const isBlob = current?.includes("blob.vercel-storage.com");

  /* A landed photograph clears the picker; a failed one keeps the
     file he chose. */
  useEffect(() => {
    if (upState?.ok) upRef.current?.reset();
  }, [upState]);

  return (
    <div>
      <p className="eyebrow">{title}</p>
      <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-[18px] bg-shell/40">
        {current ? (
          isBlob ? (
            <Image src={current} alt={`${title} photograph`} fill sizes="(max-width: 640px) 100vw, 24rem" className="object-cover" />
          ) : (
            /* Site-era files under public/media render unoptimised;
               they are already the right size. */
            <Image src={current} alt={`${title} photograph`} fill sizes="(max-width: 640px) 100vw, 24rem" className="object-cover" unoptimized />
          )
        ) : (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] leading-relaxed text-mist">
            {hint}
          </p>
        )}
      </div>
      <form ref={upRef} onSubmit={keepValues(upAction)} className="mt-4 flex flex-wrap items-center gap-5">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="which" value={which} />
        <input
          type="file"
          name="photo"
          accept="image/*"
          aria-label={`${title} photograph file`}
          className="block w-full max-w-[15rem] text-[13px] text-dusk file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-shell file:px-4 file:py-2 file:text-[12px] file:font-semibold file:text-ink"
        />
        <button type="submit" disabled={upPending} className="link-hair text-dusk text-[13px] disabled:opacity-60">
          {upPending ? "Uploading..." : current ? "Replace it" : "Put it up"}
        </button>
      </form>
      {current && (
        <form action={rmAction} className="mt-2.5">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="which" value={which} />
          <button type="submit" disabled={rmPending} className="link-hair text-mist text-[12px] disabled:opacity-60">
            {rmPending ? "Taking down..." : "Take it down"}
          </button>
        </form>
      )}
      <div className="mt-3">
        <Sentence state={state} />
      </div>
    </div>
  );
}

export default function PhotoPanel({
  slug,
  imageNight,
  imageDay,
}: {
  slug: string;
  imageNight: string | null;
  imageDay: string | null;
}) {
  return (
    <section className="panel mt-8 grid max-w-3xl gap-8" data-tour="photos">
      <div>
        <p className="font-serif text-[20px]">The photographs</p>
        <Teach until="stockroom">
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-dusk">
            The site shows the night photograph in dark mode and the day
            one in light. One is enough to start; the night slot leads.
          </p>
        </Teach>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <Slot
          slug={slug}
          which="night"
          title="By night"
          hint="Evening light, lamps on, the drama shot."
          current={imageNight}
        />
        <Slot
          slug={slug}
          which="day"
          title="By day"
          hint="Morning light, soft shadows, the honest shot."
          current={imageDay}
        />
      </div>
    </section>
  );
}
