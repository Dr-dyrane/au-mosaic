import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, schema } from "@/db";
import { healSchema } from "@/db/heal";
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
   page. Day and night twins stay one work: the window changes with the sun,
   while the archive still keeps both photographs. */

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
type MediaAsset = typeof schema.mediaAssets.$inferSelect;
type GalleryMediaRow = {
  asset: MediaAsset;
  pieceName: string | null;
};

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

function framePair(src: string, day: string | undefined, copy: GalleryCopy): GalleryItem {
  return {
    ...copy,
    src,
    srcDay: day && day !== src ? day : undefined,
    title: copy.title,
    alt: copy.alt,
  };
}

function publicTitle(asset: MediaAsset, pieceName: string | null) {
  if (asset.role === "card" && pieceName) return pieceName;
  return titled(
    asset.title
      .replace(/^sku\s+/i, "")
      .replace(/^window\s+/i, "")
      .replace(/\s+stock\s*$/i, "")
      .replace(/,\s*(light|dark|day|night)\s*$/i, "")
      .replace(/\s+(light|dark|day|night)\s*$/i, "")
      .replace(/[,\s]+$/g, "")
  );
}

function publicLabel(asset: MediaAsset) {
  const text = `${asset.title} ${asset.notes}`.toLowerCase();
  if (asset.role === "card") return "Product";
  if (text.includes("mural") || text.includes("custom art")) return "Mural";
  if (text.includes("pool")) return "Pool";
  if (text.includes("sample") || text.includes("artisan")) return "Craft";
  return "Room";
}

function publicLine(asset: MediaAsset, title: string) {
  if (asset.role === "card") return `${title} seen close.`;
  if (asset.role === "window") return "A house frame from the showroom.";
  if (asset.role === "proof" || asset.role === "applied") {
    return "A room example from the showroom.";
  }
  return "A house frame from the archive.";
}

function publicHref(asset: MediaAsset) {
  const text = `${asset.title} ${asset.notes}`.toLowerCase();
  if (asset.pieceSlug) return `/piece/${asset.pieceSlug}`;
  if (text.includes("materials")) return "/pool-materials";
  if (text.includes("pool")) return "/mosaic-tiles#pool-mosaics";
  if (text.includes("mural") || text.includes("custom art")) {
    return "/projects/gallery-commission";
  }
  if (text.includes("artisan") || text.includes("sample")) return "/how-we-work";
  return "/mosaic-tiles";
}

function publicAction(asset: MediaAsset) {
  if (asset.pieceSlug) return "View piece";
  const href = publicHref(asset);
  if (href === "/pool-materials") return "Explore materials";
  if (href === "/how-we-work") return "See the process";
  if (href.startsWith("/projects/")) return "Open story";
  return "Explore tiles";
}

function mediaItem({ asset, pieceName }: GalleryMediaRow, srcDay?: string): GalleryItem {
  const title = publicTitle(asset, pieceName);
  const tone = asset.sun === "day" ? "day" : asset.sun === "night" ? "night" : undefined;
  const item = frame(
    asset.url,
    {
      href: publicHref(asset),
      alt: title,
      label: publicLabel(asset),
      title,
      line: publicLine(asset, title),
      action: publicAction(asset),
    },
    tone,
  );
  if (srcDay && srcDay !== asset.url) item.srcDay = srcDay;
  return item;
}

const readPublicGalleryMedia = unstable_cache(
  async (): Promise<GalleryMediaRow[]> => {
    try {
      await healSchema();
      const db = getDb();
      return await db
        .select({
          asset: schema.mediaAssets,
          pieceName: schema.pieces.name,
        })
        .from(schema.mediaAssets)
        .leftJoin(
          schema.pieces,
          eq(schema.pieces.slug, schema.mediaAssets.pieceSlug),
        )
        .where(
          and(
            inArray(schema.mediaAssets.status, ["approved", "wired"]),
            ne(schema.mediaAssets.role, "contact_sheet"),
          ),
        )
        .orderBy(desc(schema.mediaAssets.createdAt), desc(schema.mediaAssets.id));
    } catch {
      return [];
    }
  },
  ["gallery-media-v2"],
  { tags: ["catalog"], revalidate: 3600 }
);

function publicMediaPairTitle(asset: MediaAsset, pieceName: string | null) {
  return publicTitle(asset, pieceName).toLowerCase();
}

function publicMediaPairKey(row: GalleryMediaRow) {
  const { asset, pieceName } = row;
  return [
    asset.role,
    asset.pieceSlug ?? "",
    asset.batch,
    publicMediaPairTitle(asset, pieceName),
  ].join("|");
}

function mediaItems(rows: GalleryMediaRow[]): GalleryItem[] {
  const groups: {
    night?: GalleryMediaRow;
    day?: GalleryMediaRow;
    extras: GalleryMediaRow[];
  }[] = [];
  const byKey = new Map<string, (typeof groups)[number]>();

  for (const row of rows) {
    const groupKey = publicMediaPairKey(row);
    let group = byKey.get(groupKey);
    if (!group) {
      group = { extras: [] };
      byKey.set(groupKey, group);
      groups.push(group);
    }

    if (row.asset.sun === "night") {
      if (!group.night) group.night = row;
      else group.extras.push(row);
      continue;
    }

    if (row.asset.sun === "day") {
      if (!group.day) group.day = row;
      else group.extras.push(row);
      continue;
    }

    group.extras.push(row);
  }

  return groups.flatMap((group) => {
    const items: GalleryItem[] = [];
    const primary = group.night ?? group.day;
    if (primary) items.push(mediaItem(primary, group.day?.asset.url));
    for (const extra of group.extras) items.push(mediaItem(extra));
    return items;
  });
}

function pair(src: string, day: string | undefined, copy: GalleryCopy): GalleryItem[] {
  return [framePair(src, day, copy)];
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

const staticSeen = new Set<string>();
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
).filter((item) => {
  const urls = [item.src, item.srcDay].filter((url): url is string => Boolean(url));
  if (urls.some((url) => staticSeen.has(url))) return false;
  urls.forEach((url) => staticSeen.add(url));
  return true;
});

function mergeGallery(...lists: GalleryItem[][]): GalleryItem[] {
  const out: GalleryItem[] = [];
  const seen = new Set<string>();

  for (const list of lists) {
    for (const item of list) {
      const urls = [item.src, item.srcDay].filter((url): url is string => Boolean(url));
      if (urls.some((url) => seen.has(url))) continue;
      urls.forEach((url) => seen.add(url));
      out.push(item);
    }
  }

  return out;
}

export async function getGallery(): Promise<GalleryItem[]> {
  const media = mediaItems(await readPublicGalleryMedia());
  return mergeGallery(media, GALLERY);
}
