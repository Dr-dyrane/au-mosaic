import { ATELIER_SCENES, DAY, ENVIRONMENTS, HOW_STEPS, INTERIOR_SCENES, LAGOS_SCENES, OWN } from "./images";
import { PROJECTS } from "./projects";

/* The public gallery feed: one flowing, un-categorised stream of the house's
   own imagery — rooms, pools, walls, murals — each frame linking home to its
   page. Composed from the same owned scenes the rest of the site uses, so
   nothing new ships; interleaved for variety and deduped by source. */

export type GalleryItem = { src: string; srcDay?: string; href: string; alt: string };

const environments: GalleryItem[] = ENVIRONMENTS.map((e) => ({
  src: e.src,
  srcDay: e.srcDay,
  href: e.href,
  alt: e.place,
}));
const lagos: GalleryItem[] = LAGOS_SCENES.map((s) => ({ src: s.src, href: "/lagos", alt: s.alt }));
const atelier: GalleryItem[] = ATELIER_SCENES.map((s) => ({ src: s.src, href: "/atelier", alt: s.alt }));
const interiors: GalleryItem[] = INTERIOR_SCENES.map((s) => ({ src: s.src, href: "/interiors", alt: s.alt }));
const how: GalleryItem[] = HOW_STEPS.map((s) => ({ src: s.night, srcDay: s.day, href: "/how-we-work", alt: s.alt }));
const projects: GalleryItem[] = PROJECTS.map((p) => ({
  src: p.cover,
  srcDay: p.coverDay,
  href: `/projects/${p.slug}`,
  alt: p.title,
}));
const more: GalleryItem[] = [
  { src: OWN.koiMural, srcDay: DAY.koiMural, href: "/projects/gallery-commission", alt: "A commissioned koi mosaic mural" },
  { src: OWN.beetleMural, srcDay: DAY.beetleMural, href: "/projects/gallery-commission", alt: "A commissioned scarab mosaic mural" },
  { src: OWN.glassJewels, srcDay: DAY.glassJewels, href: "/mosaic-tiles#glass-mosaics", alt: "Glass mosaic in jewel tones" },
  { src: OWN.villaPalms, href: "/projects/villa-above-the-sea", alt: "A villa pool among palms" },
  { src: OWN.privatePool, href: "/projects/villa-above-the-sea", alt: "A private pool at rest" },
  { src: OWN.poolBlues, href: "/mosaic-tiles#pool-mosaics", alt: "Classic pool blues underwater" },
  { src: OWN.artGallery, srcDay: DAY.artGallery, href: "/projects/gallery-commission", alt: "A commissioned mosaic art panel" },
  { src: OWN.craftHands, srcDay: DAY.craftHands, href: "/how-we-work", alt: "Mosaic set by hand, tessera by tessera" },
];

function interleave(...lists: GalleryItem[][]): GalleryItem[] {
  const out: GalleryItem[] = [];
  const longest = Math.max(...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      if (list[i]) out.push(list[i]);
    }
  }
  return out;
}

const seen = new Set<string>();
export const GALLERY: GalleryItem[] = interleave(
  environments,
  lagos,
  projects,
  atelier,
  interiors,
  how,
  more,
).filter((item) => (seen.has(item.src) ? false : (seen.add(item.src), true)));
