import { IMG, OWN } from "./images";

/* AU Mosaic · catalogue data. The pool materials list is the owner's own
   stock list, word for word where possible. Prices are quote-per-job, so
   every item leads to WhatsApp. */

export type Product = {
  name: string;
  note?: string;
  variants?: string[];
  /** Colourway rendered as a glass tile sheet on product cards. */
  colors?: string[];
  /** Real photo (Pexels now, Nonso's own at launch). Wins over colors. */
  image?: string;
  /** Stable id: the piece page URL today, the CRM product key tomorrow. */
  slug?: string;
};

export type ProductGroup = {
  id: string;
  title: string;
  blurb: string;
  items: Product[];
};

/* ---- mosaic tiles ---------------------------------------------------------- */

export const MOSAIC_RANGES: ProductGroup[] = [
  {
    id: "pool-mosaics",
    title: "Pool mosaics",
    blurb: "Our best sellers. The classic choice for swimming pools, in blues and beyond.",
    items: [
      { slug: "classic-pool-blues", name: "Classic pool blues", note: "The timeless look, many shades", image: OWN.poolBlues, colors: ["#1179a8", "#1e8fc0", "#3aa9d6", "#6cc4e6", "#a8def2"] },
      { slug: "aqua-turquoise-blends", name: "Aqua and turquoise blends", note: "Bright, resort-style water", colors: ["#0fb5c9", "#2ecddd", "#63e0ea", "#98ecf2", "#c8f6f9"] },
      { slug: "deep-midnight-blends", name: "Deep and midnight blends", note: "Darker pools, dramatic water", colors: ["#0b2e4f", "#123f66", "#1a527f", "#25689a", "#3b81b3"] },
      { slug: "patterned-pool-borders", name: "Patterned pool borders", note: "Waterlines and feature bands", image: IMG.bluePatternTiles, colors: ["#1e8fc0", "#f5f1e8", "#134e5e", "#f5f1e8", "#3aa9d6", "#c05f2b"] },
    ],
  },
  {
    id: "glass-mosaics",
    title: "Glass mosaics",
    blurb: "Colour and shine for walls, bathrooms, and features.",
    items: [
      { slug: "solid-colour-glass", name: "Solid colour glass", note: "Every colour, by the sheet", image: OWN.glassJewels, colors: ["#c0392b", "#e67e22", "#f1c40f", "#27ae60", "#2980b9", "#8e44ad"] },
      { slug: "mixed-gradient-blends", name: "Mixed and gradient blends", colors: ["#134e5e", "#0e7490", "#2fb9cf", "#67d6e5", "#a5e8f0", "#e8f8fa"] },
      { slug: "gold-metallic-accents", name: "Gold and metallic accents", colors: ["#8a6d1a", "#b8942d", "#d9b64a", "#edd27a", "#f7e7ae"] },
    ],
  },
  {
    id: "feature-mosaics",
    title: "Art and feature mosaics",
    blurb: "Murals, patterns, and statement walls. Creativity is why this business exists.",
    items: [
      { slug: "pattern-picture-mosaics", name: "Pattern and picture mosaics", image: IMG.fishMosaicPool, colors: ["#0e7490", "#c05f2b", "#f5f1e8", "#134e5e", "#e8b48e", "#38cfe0"] },
      { slug: "custom-murals", name: "Custom murals", note: "Made to your design", image: IMG.beetleMosaicArt, colors: ["#c05f2b", "#e8b48e", "#f5f1e8", "#4c6270", "#0d2430", "#38cfe0"] },
    ],
  },
  {
    id: "bulk-orders",
    title: "Bulk and factory orders",
    blurb: "Large quantity? We order directly from our factory in Foshan, China, at factory prices.",
    items: [
      { slug: "container-project-orders", name: "Container and project orders", note: "For contractors, resellers, estates", colors: ["#155e75", "#0e7490", "#1a94ad", "#4c6270", "#8aa0ab"] },
      { slug: "custom-colours-sizes", name: "Custom colours and sizes", note: "Made to order", colors: ["#38cfe0", "#c05f2b", "#f1c40f", "#27ae60", "#8e44ad", "#f5f1e8"] },
    ],
  },
];

/* ---- pieces ------------------------------------------------------------------ */
/* Every mosaic item, flattened with its collection. The /piece/[slug] URL
   space keys off this list; a CRM swaps the array for a database table and
   nothing above the data layer changes. */

export type Piece = Product & { slug: string; collection: string; groupId: string };

export const PIECES: Piece[] = MOSAIC_RANGES.flatMap((g) =>
  g.items
    .filter((i): i is Product & { slug: string } => typeof i.slug === "string")
    .map((i) => ({ ...i, collection: g.title, groupId: g.id }))
);

export const pieceBySlug = (slug: string): Piece | undefined =>
  PIECES.find((p) => p.slug === slug);

/* ---- pool materials (the owner's stock list) --------------------------------- */

export const POOL_MATERIALS: ProductGroup[] = [
  {
    id: "tiling-finishing",
    title: "Tiling and finishing",
    blurb: "Everything that makes the pool surface last. Quality here is why tiles stay on.",
    items: [
      { name: "Clay deck tiles", variants: ["Edge", "Surface"] },
      { name: "Gum cement", variants: ["Spanish Kerakoll", "Nigerian Cecamix", "Nigerian Linma"], note: "The difference between mosaics that stay and mosaics that fall" },
      { name: "White cement" },
      { name: "Genesis edge" },
      { name: "Coping edge tiles" },
    ],
  },
  {
    id: "filtration",
    title: "Filtration and circulation",
    blurb: "Clean, moving water. Astral equipment.",
    items: [
      { name: "Filter tanks", variants: ["450mm", "600mm", "750mm"] },
      { name: "Pumps", variants: ["1.5 hp", "2 hp", "3 hp"] },
      { name: "Big skimmer" },
      { name: "Floor drain" },
      { name: "Filter sand" },
      { name: "Nozzle" },
      { name: "Flange" },
    ],
  },
  {
    id: "access-features",
    title: "Access and features",
    blurb: "Ladders, lights, and the touches that make a pool yours.",
    items: [
      { name: "Step ladders", variants: ["3 step", "4 step"] },
      { name: "Pool light with remote" },
      { name: "Pool light transformer", note: "300W" },
      { name: "Waterfalls", variants: ["2ft", "3ft", "4ft"] },
      { name: "Water bar" },
    ],
  },
  {
    id: "treatment",
    title: "Water treatment",
    blurb: "Keep it swimmable.",
    items: [
      { name: "Chlorinator" },
    ],
  },
];

/* ---- pool services ------------------------------------------------------------ */

export const POOL_SERVICES = [
  {
    title: "New pools, from scratch",
    body: "Design, construction, tiling, and equipment. One team from first sketch to first swim.",
  },
  {
    title: "Pool renovation",
    body: "Tired pool, new life. Retiling, equipment upgrades, leak and finish repairs.",
  },
  {
    title: "Mosaic replacement",
    body: "Falling or faded mosaics replaced properly, with gum cement that holds.",
  },
];

/* ---- how buying works (the owner's real sales journey) -------------------------- */

export const BUYING_STEPS = [
  { title: "Tell us what you need", body: "The tile or material, where it's going, the colour, the quantity." },
  { title: "We send photos and videos", body: "Real samples from stock, on WhatsApp, same day." },
  { title: "Agree a price", body: "Quote per job. Fair, and negotiable like the market." },
  { title: "Pickup or delivery", body: "Collect at Agric Market, or we deliver to your site." },
];
