/* The window's eye, before the wire. Every photograph refines on
   the phone itself, with the platform's own canvas: the camera's
   format is decoded by the codec that wrote it (HEIC included, so
   the optimizer downstream always receives what it understands),
   the orientation bakes in, the long edge caps at 2560, and the
   file re-encodes as a JPEG near 86 quality. Camera weight becomes
   a few hundred kilobytes before it touches Lagos data, and a
   photograph too small for a full-screen window is refused with a
   sentence instead of stretched thin. No dependency: the phone
   already knows how to do all of this. */

export type Refined =
  | { ok: true; blob: Blob; width: number; height: number }
  | { ok: false; message: string };

const LONG_EDGE = 2560;
const MIN_LONG_EDGE = 1200;
const QUALITY = 0.86;

export async function refineForTheWindow(file: File): Promise<Refined> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    /* A format even this phone cannot draw; let the server answer. */
    return { ok: true, blob: file, width: 0, height: 0 };
  }

  const long = Math.max(bmp.width, bmp.height);
  if (long < MIN_LONG_EDGE) {
    bmp.close();
    return {
      ok: false,
      message: `The window is a full screen and this photograph is ${long}px on its long side. 1600px or more stands proud; 1200px is the floor.`,
    };
  }

  const scale = Math.min(1, LONG_EDGE / long);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return { ok: true, blob: file, ...size };
  }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  if (!blob) return { ok: true, blob: file, width: w, height: h };
  return { ok: true, blob, width: w, height: h };
}
