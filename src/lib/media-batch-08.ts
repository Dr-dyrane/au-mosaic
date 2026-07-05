import { readFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const BATCH_08 = "batch-08";
const DRAFT_DIR = "public/media/product-ledger-2026-07-04";

type MediaRole = "card" | "applied" | "window" | "proof" | "contact_sheet";
type MediaSun = "night" | "day" | "single";
type MediaStatus = "draft" | "approved" | "wired" | "archived";

type BatchAsset = {
  file: string;
  title: string;
  sun: MediaSun;
  role: MediaRole;
  status: MediaStatus;
  pieceSlug?: string;
  notes: string;
  source: string;
  width: number;
  height: number;
};

const baseSource =
  "Prepared from the AU Mosaic Instagram harvest and product image ledger.";

export const BATCH_08_ASSETS: BatchAsset[] = [
  {
    file: "gap-aqua-colour-mosaic-light.png",
    title: "Aqua colour mosaic card, light",
    sun: "day",
    role: "card",
    status: "draft",
    pieceSlug: "aqua-turquoise-blends",
    notes: "Shop-style card candidate for aqua stock.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "gap-aqua-colour-mosaic-dark.png",
    title: "Aqua colour mosaic card, dark",
    sun: "night",
    role: "card",
    status: "draft",
    pieceSlug: "aqua-turquoise-blends",
    notes: "Shop-style card candidate for aqua stock.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "gap-deep-midnight-blends-light.png",
    title: "Deep and midnight blends card, light",
    sun: "day",
    role: "card",
    status: "draft",
    pieceSlug: "deep-midnight-blends",
    notes: "Shop-style card candidate for darker blue stock.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "gap-deep-midnight-blends-dark.png",
    title: "Deep and midnight blends card, dark",
    sun: "night",
    role: "card",
    status: "draft",
    pieceSlug: "deep-midnight-blends",
    notes: "Shop-style card candidate for darker blue stock.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "gap-patterned-pool-borders-light.png",
    title: "Patterned pool borders card, light",
    sun: "day",
    role: "card",
    status: "draft",
    pieceSlug: "patterned-pool-borders",
    notes: "Shop-style card candidate for pool waterline and border stock.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "gap-patterned-pool-borders-dark.png",
    title: "Patterned pool borders card, dark",
    sun: "night",
    role: "card",
    status: "draft",
    pieceSlug: "patterned-pool-borders",
    notes: "Shop-style card candidate for pool waterline and border stock.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "gap-mixed-gradient-blends-light.png",
    title: "Mixed and gradient blends card, light",
    sun: "day",
    role: "card",
    status: "draft",
    pieceSlug: "mixed-gradient-blends",
    notes: "Shop-style card candidate for shade planning.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "gap-mixed-gradient-blends-dark.png",
    title: "Mixed and gradient blends card, dark",
    sun: "night",
    role: "card",
    status: "draft",
    pieceSlug: "mixed-gradient-blends",
    notes: "Shop-style card candidate for shade planning.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "gap-container-project-orders-light.png",
    title: "Container and project orders card, light",
    sun: "day",
    role: "card",
    status: "draft",
    pieceSlug: "container-project-orders",
    notes: "Shop-style card candidate for bulk order readiness.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "gap-container-project-orders-dark.png",
    title: "Container and project orders card, dark",
    sun: "night",
    role: "card",
    status: "draft",
    pieceSlug: "container-project-orders",
    notes: "Shop-style card candidate for bulk order readiness.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "gap-custom-colours-sizes-light.png",
    title: "Custom colours and sizes card, light",
    sun: "day",
    role: "card",
    status: "draft",
    pieceSlug: "custom-colours-sizes",
    notes: "Shop-style card candidate for custom matching.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "gap-custom-colours-sizes-dark.png",
    title: "Custom colours and sizes card, dark",
    sun: "night",
    role: "card",
    status: "draft",
    pieceSlug: "custom-colours-sizes",
    notes: "Shop-style card candidate for custom matching.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "showroom-kitchen-backsplash-sink-light.png",
    title: "Kitchen backsplash showroom proof, light",
    sun: "day",
    role: "proof",
    status: "draft",
    pieceSlug: "aqua-turquoise-blends",
    notes: "Showroom proof only. Not a product card and not a client archive.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "showroom-kitchen-backsplash-sink-dark.png",
    title: "Kitchen backsplash showroom proof, dark",
    sun: "night",
    role: "proof",
    status: "draft",
    pieceSlug: "aqua-turquoise-blends",
    notes: "Showroom proof only. Not a product card and not a client archive.",
    source: baseSource,
    width: 1122,
    height: 1402,
  },
  {
    file: "contact-sheet-batch-08-gap-showroom.png",
    title: "Prepared product and showroom review",
    sun: "single",
    role: "contact_sheet",
    status: "draft",
    notes: "Review surface for prepared product and showroom photos.",
    source: baseSource,
    width: 982,
    height: 1322,
  },
];

const PROMOTIONS = [
  {
    pieceSlug: "aqua-turquoise-blends",
    night: "gap-aqua-colour-mosaic-dark.png",
    day: "gap-aqua-colour-mosaic-light.png",
  },
  {
    pieceSlug: "deep-midnight-blends",
    night: "gap-deep-midnight-blends-dark.png",
    day: "gap-deep-midnight-blends-light.png",
  },
  {
    pieceSlug: "patterned-pool-borders",
    night: "gap-patterned-pool-borders-dark.png",
    day: "gap-patterned-pool-borders-light.png",
  },
  {
    pieceSlug: "mixed-gradient-blends",
    night: "gap-mixed-gradient-blends-dark.png",
    day: "gap-mixed-gradient-blends-light.png",
  },
  {
    pieceSlug: "container-project-orders",
    night: "gap-container-project-orders-dark.png",
    day: "gap-container-project-orders-light.png",
  },
  {
    pieceSlug: "custom-colours-sizes",
    night: "gap-custom-colours-sizes-dark.png",
    day: "gap-custom-colours-sizes-light.png",
  },
] as const;

function originalPath(file: string) {
  return `${DRAFT_DIR}/${file}`;
}

async function rowForFile(file: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.mediaAssets)
    .where(and(eq(schema.mediaAssets.batch, BATCH_08), eq(schema.mediaAssets.originalPath, originalPath(file))))
    .limit(1);
  return row;
}

export async function importBatch08Assets() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing.");
  }
  const db = getDb();
  let uploaded = 0;
  let skipped = 0;

  for (const asset of BATCH_08_ASSETS) {
    const localPath = originalPath(asset.file);
    const existing = await rowForFile(asset.file);
    if (existing) {
      skipped++;
      continue;
    }
    const body = await readFile(path.join(process.cwd(), localPath));
    const blob = await put(`media/${BATCH_08}/${asset.file}`, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    await db.insert(schema.mediaAssets).values({
      url: blob.url,
      title: asset.title,
      batch: BATCH_08,
      sun: asset.sun,
      role: asset.role,
      status: asset.status,
      pieceSlug: asset.pieceSlug,
      notes: asset.notes,
      source: asset.source,
      width: asset.width,
      height: asset.height,
      originalPath: localPath,
    });
    uploaded++;
  }

  return { uploaded, skipped, total: BATCH_08_ASSETS.length };
}

export async function promoteBatch08Assets() {
  const db = getDb();
  let wired = 0;

  for (const item of PROMOTIONS) {
    const night = await rowForFile(item.night);
    const day = await rowForFile(item.day);
    if (!night || !day) {
      throw new Error(`Import ${item.pieceSlug} before promotion.`);
    }
    const updated = await db
      .update(schema.pieces)
      .set({
        cardImageNight: night.url,
        cardImageDay: day.url,
        updatedAt: sql`now()`,
      })
      .where(eq(schema.pieces.slug, item.pieceSlug))
      .returning({ slug: schema.pieces.slug });
    if (updated.length === 0) {
      throw new Error(`${item.pieceSlug} is not in the book.`);
    }
    await db
      .update(schema.mediaAssets)
      .set({ status: "wired", updatedAt: sql`now()` })
      .where(and(eq(schema.mediaAssets.batch, BATCH_08), eq(schema.mediaAssets.pieceSlug, item.pieceSlug), eq(schema.mediaAssets.role, "card")));
    wired++;
  }

  for (const file of [
    "showroom-kitchen-backsplash-sink-light.png",
    "showroom-kitchen-backsplash-sink-dark.png",
  ]) {
    await db
      .update(schema.mediaAssets)
      .set({ status: "approved", updatedAt: sql`now()` })
      .where(and(eq(schema.mediaAssets.batch, BATCH_08), eq(schema.mediaAssets.originalPath, originalPath(file))));
  }

  return { wired, proofApproved: 2 };
}
