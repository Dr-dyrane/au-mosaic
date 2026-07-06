import { SITE } from "./site";

export type AskHouseContext = "general" | "visualizer" | "visit";

export type AskHouseAnswer = {
  title: string;
  body: string;
  href: string;
  actionLabel: string;
  waText: string;
};

export const ASK_HOUSE_PROMPTS = [
  "What tiles work in a swimming pool?",
  "How do I get today's price?",
  "Can I try this in my room first?",
  "Do you deliver outside Lagos?",
  "Can you build or renovate my pool?",
] as const;

const ANSWERS = {
  visualizer: {
    title: "Start with the real surface.",
    body:
      "Use a clean photo of the pool, wall, shower, backsplash, or floor. If old tile fights the preview, choose Primer or Blur, then drag the four stones until the surface feels true.",
    href: "/visualizer",
    actionLabel: "Open visualizer",
    waText: "Hello AU Mosaic, I used the visualizer. Please review this space: ",
  },
  price: {
    title: "Prices stay live.",
    body:
      "Mosaic is priced by range, quantity, and stock. Send the piece you like, rough measurements, and a photo of the space. The house replies with real shelf photos and today's price.",
    href: "/mosaic-tiles",
    actionLabel: "See the ranges",
    waText: "Hello AU Mosaic, please send today's price for: ",
  },
  poolTiles: {
    title: "Glass mosaic belongs underwater.",
    body:
      "For pools, start with glass mosaic. It holds colour under treated water and full sun. Blues, aqua blends, and waterline borders decide how clean, deep, or calm the water reads.",
    href: "/mosaic-tiles#pool-mosaics",
    actionLabel: "See pool mosaics",
    waText: "Hello AU Mosaic, I am choosing pool tiles. My pool size or photo: ",
  },
  poolBuild: {
    title: "One pool, every layer.",
    body:
      "AU Mosaic handles new pools, renovations, and mosaic replacement. Size, depth, finish, and equipment shape the quote. Send the site photo and the pool in your head.",
    href: "/pools",
    actionLabel: "See pools",
    waText: "Hello AU Mosaic, I am planning a pool. Can we talk?",
  },
  materials: {
    title: "The equipment room matters.",
    body:
      "Pumps, filter tanks, sand, skimmers, lights, ladders, gum cement, and grout sit beside the tiles. Share the pool size or material list and the house sizes the right set.",
    href: "/pool-materials",
    actionLabel: "See materials",
    waText: "Hello AU Mosaic, I need pool materials. My list or pool size: ",
  },
  rooms: {
    title: "Match the surface to the room.",
    body:
      "Kitchens and sinks like glass that cleans easily. Bathrooms and showers need wet-room discipline. Sitting rooms, offices, and murals can carry gold, stone, pattern, or picture mosaic.",
    href: "/interiors",
    actionLabel: "See interiors",
    waText: "Hello AU Mosaic, I want mosaic for this room: ",
  },
  art: {
    title: "Pictures can be built in glass.",
    body:
      "For logos, murals, pool floor art, and wall pictures, send the artwork or reference image. The house translates it into mosaic and quotes the surface.",
    href: "/mosaic-tiles#feature-mosaics",
    actionLabel: "See art mosaic",
    waText: "Hello AU Mosaic, I want a mosaic artwork. Here is the idea: ",
  },
  delivery: {
    title: "Pickup or delivery.",
    body:
      "Collect at Agric Market, Orile, Lagos, or ask for delivery to site. Lagos is straightforward. Beyond Lagos, the house arranges transport with your location.",
    href: "/contact",
    actionLabel: "Open contact",
    waText: "Hello AU Mosaic, I need delivery to: ",
  },
  visit: {
    title: "Come to the stock.",
    body: `Visit ${SITE.address}. Open the map before you leave, then ask any trader for AU Mosaic when you reach the market.`,
    href: "/contact",
    actionLabel: "Open contact",
    waText: "Hello AU Mosaic, I want to visit the showroom. Please guide me from: ",
  },
  general: {
    title: "Ask in plain words.",
    body:
      "The house can help with tiles, pools, pool materials, delivery, murals, and the visualizer. For prices, quantities, and site decisions, WhatsApp keeps the answer true today.",
    href: "/contact",
    actionLabel: "Contact the house",
    waText: "Hello AU Mosaic, I would like help with: ",
  },
} satisfies Record<string, AskHouseAnswer>;

const includesAny = (value: string, words: string[]) => words.some((word) => value.includes(word));

export function answerAskHouse(question: string, context: AskHouseContext = "general"): AskHouseAnswer {
  const q = question.trim().toLowerCase();

  if (!q) return context === "visualizer" ? ANSWERS.visualizer : context === "visit" ? ANSWERS.visit : ANSWERS.general;

  if (includesAny(q, ["visual", "picture", "photo", "try", "space", "camera", "preview"])) return ANSWERS.visualizer;
  if (includesAny(q, ["price", "cost", "quote", "how much", "rate", "budget", "discount"])) return ANSWERS.price;
  if (includesAny(q, ["pool tile", "underwater", "waterline", "swimming", "pool mosaic", "re-tile", "retile"])) return ANSWERS.poolTiles;
  if (includesAny(q, ["build", "construct", "renovate", "repair", "leak", "new pool"])) return ANSWERS.poolBuild;
  if (includesAny(q, ["pump", "filter", "skimmer", "ladder", "light", "cement", "grout", "chlorinator", "materials"])) return ANSWERS.materials;
  if (includesAny(q, ["kitchen", "bathroom", "shower", "wall", "floor", "sitting", "office", "backsplash"])) return ANSWERS.rooms;
  if (includesAny(q, ["art", "mural", "logo", "picture", "pattern", "sacred", "custom"])) return ANSWERS.art;
  if (includesAny(q, ["deliver", "delivery", "transport", "ship", "waybill", "send to"])) return ANSWERS.delivery;
  if (includesAny(q, ["address", "location", "visit", "showroom", "where", "map", "direction", "directions"])) return ANSWERS.visit;

  return ANSWERS.general;
}

export function buildAskHouseWa(question: string, answer: AskHouseAnswer) {
  const trimmed = question.trim();
  return trimmed ? `${answer.waText}${trimmed}` : answer.waText;
}
