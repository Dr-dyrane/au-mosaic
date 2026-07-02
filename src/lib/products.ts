/* AU Mosaic · catalogue data. The pool materials list is the owner's own
   stock list, word for word where possible. Prices are quote-per-job, so
   every item leads to WhatsApp. */

export type Product = {
  name: string;
  note?: string;
  variants?: string[];
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
      { name: "Classic pool blues", note: "The timeless look, many shades" },
      { name: "Aqua and turquoise blends", note: "Bright, resort-style water" },
      { name: "Deep and midnight blends", note: "Darker pools, dramatic water" },
      { name: "Patterned pool borders", note: "Waterlines and feature bands" },
    ],
  },
  {
    id: "glass-mosaics",
    title: "Glass mosaics",
    blurb: "Colour and shine for walls, bathrooms, and features.",
    items: [
      { name: "Solid colour glass", note: "Every colour, by the sheet" },
      { name: "Mixed and gradient blends" },
      { name: "Gold and metallic accents" },
    ],
  },
  {
    id: "feature-mosaics",
    title: "Art and feature mosaics",
    blurb: "Murals, patterns, and statement walls. Creativity is why this business exists.",
    items: [
      { name: "Pattern and picture mosaics" },
      { name: "Custom murals", note: "Made to your design" },
    ],
  },
  {
    id: "bulk-orders",
    title: "Bulk and factory orders",
    blurb: "Large quantity? We order directly from our factory in Foshan, China, at factory prices.",
    items: [
      { name: "Container and project orders", note: "For contractors, resellers, estates" },
      { name: "Custom colours and sizes", note: "Made to order" },
    ],
  },
];

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
