/* Decoded SAM masks, keyed by their data URI, so any number of layers
   can each draw their own segment every frame without re-decoding. */

const cache = new Map<string, HTMLImageElement>();

/* Store an image that is already decoded, so the first paint after an
   auto-find never waits on a second decode of the same bytes. */
export function seedMask(src: string, img: HTMLImageElement): void {
  cache.set(src, img);
}

/* Return the decoded mask for a data URI, decoding it on first sight.
   The image comes back immediately either way; drawing one that has not
   finished loading is a silent no-op, and onReady lets the caller
   schedule one more paint once the pixels land. */
export function hydrateMask(src: string | null, onReady?: () => void): HTMLImageElement | null {
  if (!src) return null;
  const hit = cache.get(src);
  if (hit) return hit;
  if (typeof window === "undefined") return null;
  const img = new Image();
  img.onload = () => {
    img.onload = null;
    onReady?.();
  };
  img.src = src;
  cache.set(src, img);
  return img;
}
