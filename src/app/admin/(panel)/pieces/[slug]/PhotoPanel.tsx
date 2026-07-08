"use client";

import Image from "next/image";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import AdminPhotoViewer from "@/components/AdminPhotoViewer";
import { removePhoto, uploadPhoto, type SaveState } from "../actions";
import { refineForTheWindow } from "../refine";
import Sentence from "../../Sentence";
import Teach from "../../Teach";

/* The face of the piece, in both suns. Two slots, night and day,
   each its own quiet form: pick a file, the phone refines it for
   the window before it travels, the thumbnail answers. Below, the
   record shows the photograph the way the window will actually
   wear it, scrim and words and all, so the eye gate happens here
   and not in front of a customer. Uploads whisper; the page's one
   gold stays with the piece form. */

function Slot({
  slug,
  slot,
  which,
  title,
  hint,
  description,
  current,
}: {
  slug: string;
  slot: "window" | "card";
  which: "night" | "day";
  title: string;
  hint: string;
  description: string;
  current: string | null;
}) {
  const [upState, upAction, upPending] = useActionState<SaveState, FormData>(uploadPhoto, null);
  const [rmState, rmAction, rmPending] = useActionState<SaveState, FormData>(removePhoto, null);
  const [gate, setGate] = useState<SaveState>(null);
  const [refining, setRefining] = useState(false);
  const upRef = useRef<HTMLFormElement>(null);
  const state = gate ?? upState ?? rmState;
  const isBlob = current?.includes("blob.vercel-storage.com");

  /* A landed photograph clears the picker; a failed one keeps the
     file he chose. */
  useEffect(() => {
    if (upState?.ok) upRef.current?.reset();
  }, [upState]);

  /* Refine on the phone, then send: HEIC becomes JPEG with the
     phone's own codec, orientation bakes in, weight drops to a few
     hundred kilobytes, and a too-small shot is refused kindly. */
  const submitUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      setGate({ ok: false, message: "Choose a photograph first." });
      return;
    }
    setGate(null);
    setRefining(true);
    const refined = await refineForTheWindow(file);
    setRefining(false);
    if (!refined.ok) {
      setGate({ ok: false, message: refined.message });
      return;
    }
    form.set("photo", refined.blob, "photograph.jpg");
    startTransition(() => upAction(form));
  };

  return (
    <div>
      <p className="eyebrow">{title}</p>
      {current ? (
        <AdminPhotoViewer
          src={current}
          alt={`${title} photograph`}
          title={title}
          eyebrow={slot === "card" ? "Product card" : "Window photo"}
          description={description}
          triggerClassName="photo-slot relative mt-3 block aspect-[4/3] w-full overflow-hidden rounded-[18px]"
          unoptimized={!isBlob}
        >
          {isBlob ? (
            /* The night frame is the record's face, first thing the
               eye meets: it paints eagerly, never lazily. */
            <Image src={current} alt={`${title} photograph`} fill sizes="(max-width: 640px) 100vw, 24rem" className="object-cover" priority={which === "night"} />
          ) : (
            /* Site-era files under public/media render unoptimised;
               they are already the right size. */
            <Image src={current} alt={`${title} photograph`} fill sizes="(max-width: 640px) 100vw, 24rem" className="object-cover" unoptimized priority={which === "night"} />
          )}
        </AdminPhotoViewer>
      ) : (
        <div className="photo-slot relative mt-3 aspect-[4/3] overflow-hidden rounded-[18px]">
          <p className="photo-slot-hint absolute inset-0 flex items-center justify-center px-6 text-center text-[14px] leading-relaxed">
            {hint}
          </p>
        </div>
      )}
      <form ref={upRef} onSubmit={submitUpload} className="mt-4 flex flex-wrap items-center gap-5">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="slot" value={slot} />
        <input type="hidden" name="which" value={which} />
        <input
          type="file"
          name="photo"
          accept="image/*"
          aria-label={`${title} photograph file`}
          className="file-soft block w-full max-w-[15rem] text-[14px]"
        />
        <button
          type="submit"
          disabled={upPending || refining}
          className="link-hair text-dusk text-[12px] disabled:opacity-60"
        >
          {refining ? "Refining..." : upPending ? "Uploading..." : current ? "Replace it" : "Put it up"}
        </button>
      </form>
      {current && (
        <form action={rmAction} className="mt-2.5">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="slot" value={slot} />
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

/* The photograph as the window will actually wear it: full-bleed,
   the scrim, the eyebrow, the serif name, the gold close. The eye
   judges here, before a customer ever does. */
function WindowPreview({
  src,
  name,
  line,
  sun,
}: {
  src: string;
  name: string;
  line: string;
  sun: "night" | "day";
}) {
  const night = sun === "night";
  return (
    <AdminPhotoViewer
      src={src}
      alt={`${name}, as the window wears it by ${sun}`}
      title={name}
      eyebrow={sun === "night" ? "By night" : "By day"}
      description={line || undefined}
      triggerClassName={`scene-vars ${night ? "" : "scene-day"} relative block aspect-[3/4] w-full overflow-hidden rounded-[22px]`}
      unoptimized={!src.includes("blob.vercel-storage.com")}
    >
      <Image
        src={src}
        alt={`${name}, as the window wears it by ${sun}`}
        fill
        sizes="(max-width: 640px) 100vw, 20rem"
        className="object-cover"
        unoptimized={!src.includes("blob.vercel-storage.com")}
      />
      <span aria-hidden className="scrim-card absolute inset-0" />
      <span className="absolute inset-x-0 bottom-0 block p-5">
        <span className="scene-eyebrow block text-[11px] font-semibold uppercase tracking-[0.25em]">
          {sun === "night" ? "By night" : "By day"}
        </span>
        <span className="scene-title font-serif mt-1.5 block text-[20px] leading-tight">
          {name}
        </span>
        {line && (
          <span className="scene-sub mt-1 block text-[11px] leading-relaxed">
            {line}
          </span>
        )}
        <span className="mt-3 inline-flex rounded-full bg-[var(--t-brass)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#14110b]">
          Enquire
        </span>
      </span>
    </AdminPhotoViewer>
  );
}

function ProductPreview({
  src,
  name,
  sun,
}: {
  src: string;
  name: string;
  sun: "night" | "day";
}) {
  return (
    <AdminPhotoViewer
      src={src}
      alt={`${name}, product card by ${sun}`}
      title={name}
      eyebrow={sun === "night" ? "Dark card" : "Light card"}
      description="The product image used in tile grids and gallery frames."
      triggerClassName="relative block aspect-[4/5] w-full overflow-hidden rounded-[22px] bg-shell"
      unoptimized={!src.includes("blob.vercel-storage.com")}
    >
      <Image
        src={src}
        alt={`${name}, product card by ${sun}`}
        fill
        sizes="(max-width: 640px) 100vw, 20rem"
        className="object-cover"
        unoptimized={!src.includes("blob.vercel-storage.com")}
      />
    </AdminPhotoViewer>
  );
}

export default function PhotoPanel({
  slug,
  name,
  line,
  imageNight,
  imageDay,
  cardImageNight,
  cardImageDay,
}: {
  slug: string;
  name: string;
  line: string;
  imageNight: string | null;
  imageDay: string | null;
  cardImageNight: string | null;
  cardImageDay: string | null;
}) {
  return (
    /* On the desk the face keeps the eye while the form scrolls:
       sticky under the header, released on the phone's single file. */
    <section className="panel grid gap-8 xl:sticky xl:top-6" data-tour="photos">
      <div>
        <p className="font-serif text-[20px]">The photographs</p>
        <Teach until="stockroom">
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-dusk">
            The site shows the night photograph in dark mode and the day
            one in light. One is enough to start; the night slot leads.
            Fill the frame with the work, hold the phone level, and let
            the room&apos;s own light do the talking.
          </p>
        </Teach>
      </div>
      <div>
        <p className="eyebrow">Window photos</p>
        <div className="mt-3 grid gap-8 sm:grid-cols-2">
          <Slot
            slug={slug}
            slot="window"
            which="night"
            title="By night"
            hint="Evening light, lamps on, the drama shot."
            description="The dark-mode window photograph."
            current={imageNight}
          />
          <Slot
            slug={slug}
            slot="window"
            which="day"
            title="By day"
            hint="Morning light, soft shadows, the honest shot."
            description="The daylight window photograph."
            current={imageDay}
          />
        </div>
      </div>
      {(imageNight || imageDay) && (
        <div>
          <p className="eyebrow">As the window wears it</p>
          <div className="mt-3 grid max-w-md gap-5 sm:grid-cols-2">
            {imageNight && <WindowPreview src={imageNight} name={name} line={line} sun="night" />}
            {imageDay && <WindowPreview src={imageDay} name={name} line={line} sun="day" />}
          </div>
        </div>
      )}
      <div>
        <p className="eyebrow">Product cards</p>
        <Teach until="stockroom">
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-dusk">
            These feed the tile grids, product cards, and gallery product frames.
          </p>
        </Teach>
        <div className="mt-3 grid gap-8 sm:grid-cols-2">
          <Slot
            slug={slug}
            slot="card"
            which="night"
            title="Dark card"
            hint="Clean product sheet for dark mode."
            description="The product card used in dark mode."
            current={cardImageNight}
          />
          <Slot
            slug={slug}
            slot="card"
            which="day"
            title="Light card"
            hint="Clean product sheet for light mode."
            description="The product card used in light mode."
            current={cardImageDay}
          />
        </div>
      </div>
      {(cardImageNight || cardImageDay) && (
        <div>
          <p className="eyebrow">As the grid wears it</p>
          <div className="mt-3 grid max-w-md gap-5 sm:grid-cols-2">
            {cardImageNight && <ProductPreview src={cardImageNight} name={name} sun="night" />}
            {cardImageDay && <ProductPreview src={cardImageDay} name={name} sun="day" />}
          </div>
        </div>
      )}
    </section>
  );
}
