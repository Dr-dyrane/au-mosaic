import {
  ATELIER_SCENES,
  CARD,
  DAY,
  ENVIRONMENTS,
  HOW_STEPS,
  INTERIOR_SCENES,
  LAGOS_SCENES,
  OWN,
} from "./images";
import { PIECES } from "./products";
import { PROJECTS } from "./projects";

/* The public gallery feed: one flowing, uncategorised stream of the house's
   own imagery, rooms, pools, walls, murals, each frame linking home to its
   page. It promotes day and night assets as separate photographs, because a
   gallery should let the archive breathe instead of hiding half the light. */

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

type GalleryCopy = Omit<GalleryItem, "src" | "srcDay">;
type Tone = "day" | "night";

function titled(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function frame(src: string, copy: GalleryCopy, tone?: Tone): GalleryItem {
  return {
    ...copy,
    src,
    title: copy.title,
    alt: tone ? `${copy.alt}, ${tone} frame` : copy.alt,
  };
}

function pair(src: string, day: string | undefined, copy: GalleryCopy): GalleryItem[] {
  return day ? [frame(src, copy, "night"), frame(day, copy, "day")] : [frame(src, copy)];
}

const environments: GalleryItem[] = ENVIRONMENTS.flatMap((e) =>
  pair(e.src, e.srcDay, {
    href: e.href,
    alt: e.place,
    label: "Room",
    title: e.place,
    line: e.line,
    action: "Explore tiles",
  }),
);

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

const how: GalleryItem[] = HOW_STEPS.flatMap((s) =>
  pair(s.night, s.day, {
    href: "/how-we-work",
    alt: s.alt,
    label: `Step ${s.step}`,
    title: s.title,
    line: s.line,
    action: "See the process",
  }),
);

const projects: GalleryItem[] = PROJECTS.flatMap((p) =>
  pair(p.cover, p.coverDay, {
    href: `/projects/${p.slug}`,
    alt: p.title,
    label: p.concept ? "Concept study" : "Project",
    title: p.title,
    line: p.line,
    action: "Open story",
  }),
);

const more: GalleryItem[] = [
  ...pair(OWN.koiMural, DAY.koiMural, {
    href: "/projects/gallery-commission",
    alt: "A commissioned koi mosaic mural",
    label: "Mural",
    title: "The koi mural",
    line: "A picture built in glass, one tessera at a time.",
    action: "Open story",
  }),
  ...pair(OWN.beetleMural, DAY.beetleMural, {
    href: "/projects/gallery-commission",
    alt: "A commissioned scarab mosaic mural",
    label: "Mural",
    title: "The scarab mural",
    line: "Gold leaf and dark glass, set to catch the room.",
    action: "Open story",
  }),
  ...pair(OWN.glassJewels, DAY.glassJewels, {
    href: "/mosaic-tiles#glass-mosaics",
    alt: "Glass mosaic in jewel tones",
    label: "Tile",
    title: "Glass in colour",
    line: "Small pieces, large temperature.",
    action: "Explore tiles",
  }),
  frame(OWN.villaPalms, {
    href: "/projects/villa-above-the-sea",
    alt: "A villa pool among palms",
    label: "Pool",
    title: "Palms by the water",
    line: "A pool that belongs to its garden.",
    action: "Open story",
  }),
  frame(OWN.privatePool, {
    href: "/projects/villa-above-the-sea",
    alt: "A private pool at rest",
    label: "Pool",
    title: "The quiet edge",
    line: "Blue surface, brass detail, still water.",
    action: "Open story",
  }),
  frame(OWN.poolBlues, {
    href: "/mosaic-tiles#pool-mosaics",
    alt: "Classic pool blues underwater",
    label: "Tile",
    title: "Classic pool blues",
    line: "The colour that makes water read clean.",
    action: "Explore tiles",
  }),
  ...pair(OWN.artGallery, DAY.artGallery, {
    href: "/projects/gallery-commission",
    alt: "A commissioned mosaic art panel",
    label: "Art",
    title: "A wall that looks back",
    line: "Pattern, picture, and the weight of a room.",
    action: "Open story",
  }),
  ...pair(OWN.craftHands, DAY.craftHands, {
    href: "/how-we-work",
    alt: "Mosaic set by hand, tessera by tessera",
    label: "Craft",
    title: "Set by hand",
    line: "The work is slow because the surface remembers.",
    action: "See the process",
  }),
];

const pieceNames = new Map(PIECES.map((p) => [p.slug, p.name]));
const cardArchive: GalleryItem[] = Object.entries(CARD).flatMap(([slug, card]) => {
  const title = pieceNames.get(slug) ?? titled(slug);
  return pair(card.night, card.day, {
    href: `/piece/${slug}`,
    alt: `${title} product plate`,
    label: "Product",
    title,
    line: "A clean plate for the website.",
    action: "View piece",
  });
});

const ownRoutes: Partial<Record<keyof typeof OWN, GalleryCopy>> = {
  aquaBlends: {
    href: "/piece/aqua-turquoise-blends",
    alt: "Aqua colour mosaic in use",
    label: "Tile",
    title: "Aqua colour mosaic",
    line: "Turquoise glass for rooms and water.",
    action: "View piece",
  },
  midnightBlends: {
    href: "/piece/deep-midnight-blends",
    alt: "Deep and midnight blue mosaic in use",
    label: "Tile",
    title: "Deep and midnight blends",
    line: "Darker blues for quiet water.",
    action: "View piece",
  },
  gradientBlends: {
    href: "/piece/mixed-gradient-blends",
    alt: "Mixed and gradient mosaic in use",
    label: "Tile",
    title: "Mixed and gradient blends",
    line: "Colour that moves across the surface.",
    action: "View piece",
  },
  goldAccents: {
    href: "/piece/gold-metallic-accents",
    alt: "Gold and metallic mosaic in use",
    label: "Tile",
    title: "Gold and metallic accents",
    line: "Mirror glass for rooms that hold light.",
    action: "View piece",
  },
  containerOrders: {
    href: "/piece/container-project-orders",
    alt: "Container and project order materials",
    label: "Material",
    title: "Container and project orders",
    line: "Bulk supply for larger builds.",
    action: "View piece",
  },
  customColours: {
    href: "/piece/custom-colours-sizes",
    alt: "Custom colours and sizes",
    label: "Material",
    title: "Custom colours and sizes",
    line: "Made to fit the job.",
    action: "View piece",
  },
  metallicRoom: {
    href: "/piece/gold-metallic-accents",
    alt: "Metallic mosaic room scene",
    label: "Room",
    title: "The metallic room",
    line: "Gold, silver, and rose glass in place.",
    action: "View piece",
  },
  materialsCounter: {
    href: "/pool-materials",
    alt: "Pool materials on a showroom counter",
    label: "Material",
    title: "The materials counter",
    line: "The water kit, ready to count.",
    action: "Explore materials",
  },
};

const ownArchive: GalleryItem[] = Object.entries(OWN).flatMap(([key, src]) => {
  const ownKey = key as keyof typeof OWN;
  const title = titled(key);
  const copy =
    ownRoutes[ownKey] ?? ({
      href: "/mosaic-tiles",
      alt: title,
      label: "Frame",
      title,
      line: "A house frame from the archive.",
      action: "Explore tiles",
    } satisfies GalleryCopy);
  return pair(src, DAY[ownKey], copy);
});

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
  cardArchive,
  ownArchive,
).filter((item) => (seen.has(item.src) ? false : (seen.add(item.src), true)));
