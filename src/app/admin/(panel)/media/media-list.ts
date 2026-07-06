import { schema } from "@/db";

type MediaAsset = typeof schema.mediaAssets.$inferSelect;

export type MediaListRawRow = {
  asset: MediaAsset;
  piece: { name: string; slug: string } | null;
};

export type MediaTwin = {
  id: string;
  url: string;
  title: string;
  sun: string;
};

export type MediaListRow = {
  asset: {
    id: string;
    url: string;
    title: string;
    sun: string;
    role: string;
    status: string;
    pieceSlug: string | null;
    notes: string;
    twin: MediaTwin | null;
  };
  piece: { name: string; slug: string } | null;
};

function pairTitle(value: string) {
  return value
    .replace(/^sku\s+/i, "")
    .replace(/^window\s+/i, "")
    .replace(/\s+card,\s*(light|dark)$/i, "")
    .replace(/,\s*(light|dark)$/i, "")
    .replace(/\s+(light|dark|day|night)$/i, "")
    .replace(/\s+stock$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function mediaPairKey(asset: Pick<MediaAsset, "title" | "role" | "pieceSlug" | "batch">) {
  return [asset.role, asset.pieceSlug ?? "", asset.batch, pairTitle(asset.title)].join("|");
}

function asTwin(asset: MediaAsset): MediaTwin {
  return {
    id: asset.id,
    url: asset.url,
    title: asset.title,
    sun: asset.sun,
  };
}

function findTwins(rows: MediaListRawRow[]) {
  const groups = new Map<string, { night?: MediaAsset; day?: MediaAsset }>();
  for (const { asset } of rows) {
    if (asset.sun !== "night" && asset.sun !== "day") continue;
    const key = mediaPairKey(asset);
    const group = groups.get(key) ?? {};
    if (asset.sun === "night" && !group.night) group.night = asset;
    if (asset.sun === "day" && !group.day) group.day = asset;
    groups.set(key, group);
  }

  const twins = new Map<string, MediaTwin>();
  for (const group of groups.values()) {
    if (!group.night || !group.day) continue;
    twins.set(group.night.id, asTwin(group.day));
    twins.set(group.day.id, asTwin(group.night));
  }
  return twins;
}

export function asMediaListRows(rows: MediaListRawRow[]): MediaListRow[] {
  const twins = findTwins(rows);
  return rows.map(({ asset, piece }) => ({
    asset: {
      id: asset.id,
      url: asset.url,
      title: asset.title,
      sun: asset.sun,
      role: asset.role,
      status: asset.status,
      pieceSlug: asset.pieceSlug,
      notes: asset.notes,
      twin: twins.get(asset.id) ?? null,
    },
    piece,
  }));
}
