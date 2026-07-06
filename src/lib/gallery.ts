import {
  ATELIER_SCENES,
  DAY,
  ENVIRONMENTS,
  HOW_STEPS,
  INTERIOR_SCENES,
  LAGOS_SCENES,
  OWN,
} from "./images";
import { PROJECTS } from "./projects";

/* The public gallery feed: one flowing, un-categorised stream of the house's
   own imagery, rooms, pools, walls, murals, each frame linking home to its
   page. Composed from the same owned scenes the rest of the site uses, so
   nothing new ships; interleaved for variety and deduped by source. */

export type GalleryItem = {
  src: string;
  srcDay?: string;
  href: string;
  alt: string;
  label: string;
  title: string;
  line: string;
  action: string;
};

const environments: GalleryItem[] = ENVIRONMENTS.map((e) => ({
  src: e.src,
  srcDay: e.srcDay,
  href: e.href,
  alt: e.place,
  label: "Room",
  title: e.place,
  line: e.line,
  action: "Explore tiles",
}));
const lagos: GalleryItem[] = LAGOS_SCENES.map((s) => ({
  src: s.src,
  href: "/lagos",
  alt: s.alt,
  label: "Lagos",
  title: s.place,
  line: s.line,
  action: "Read the story",
}));
const atelier: GalleryItem[] = ATELIER_SCENES.map((s) => ({
  src: s.src,
  href: "/atelier",
  alt: s.alt,
  label: "Atelier",
  title: s.place,
  line: s.line,
  action: "Enter the craft",
}));
const interiors: GalleryItem[] = INTERIOR_SCENES.map((s) => ({
  src: s.src,
  href: "/interiors",
  alt: s.alt,
  label: "Interior",
  title: s.place,
  line: s.line,
  action: "See interiors",
}));
const how: GalleryItem[] = HOW_STEPS.map((s) => ({
  src: s.night,
  srcDay: s.day,
  href: "/how-we-work",
  alt: s.alt,
  label: `Step ${s.step}`,
  title: s.title,
  line: s.line,
  action: "See the process",
}));
const projects: GalleryItem[] = PROJECTS.map((p) => ({
  src: p.cover,
  srcDay: p.coverDay,
  href: `/projects/${p.slug}`,
  alt: p.title,
  label: p.concept ? "Concept study" : "Project",
  title: p.title,
  line: p.line,
  action: "Open story",
}));
const more: GalleryItem[] = [
  {
    src: OWN.koiMural,
    srcDay: DAY.koiMural,
    href: "/projects/gallery-commission",
    alt: "A commissioned koi mosaic mural",
    label: "Mural",
    title: "The koi mural",
    line: "A picture built in glass, one tessera at a time.",
    action: "Open story",
  },
  {
    src: OWN.beetleMural,
    srcDay: DAY.beetleMural,
    href: "/projects/gallery-commission",
    alt: "A commissioned scarab mosaic mural",
    label: "Mural",
    title: "The scarab mural",
    line: "Gold leaf and dark glass, set to catch the room.",
    action: "Open story",
  },
  {
    src: OWN.glassJewels,
    srcDay: DAY.glassJewels,
    href: "/mosaic-tiles#glass-mosaics",
    alt: "Glass mosaic in jewel tones",
    label: "Tile",
    title: "Glass in colour",
    line: "Small pieces, large temperature.",
    action: "Explore tiles",
  },
  {
    src: OWN.villaPalms,
    href: "/projects/villa-above-the-sea",
    alt: "A villa pool among palms",
    label: "Pool",
    title: "Palms by the water",
    line: "A pool that belongs to its garden.",
    action: "Open story",
  },
  {
    src: OWN.privatePool,
    href: "/projects/villa-above-the-sea",
    alt: "A private pool at rest",
    label: "Pool",
    title: "The quiet edge",
    line: "Blue surface, brass detail, still water.",
    action: "Open story",
  },
  {
    src: OWN.poolBlues,
    href: "/mosaic-tiles#pool-mosaics",
    alt: "Classic pool blues underwater",
    label: "Tile",
    title: "Classic pool blues",
    line: "The colour that makes water read clean.",
    action: "Explore tiles",
  },
  {
    src: OWN.artGallery,
    srcDay: DAY.artGallery,
    href: "/projects/gallery-commission",
    alt: "A commissioned mosaic art panel",
    label: "Art",
    title: "A wall that looks back",
    line: "Pattern, picture, and the weight of a room.",
    action: "Open story",
  },
  {
    src: OWN.craftHands,
    srcDay: DAY.craftHands,
    href: "/how-we-work",
    alt: "Mosaic set by hand, tessera by tessera",
    label: "Craft",
    title: "Set by hand",
    line: "The work is slow because the surface remembers.",
    action: "See the process",
  },
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
