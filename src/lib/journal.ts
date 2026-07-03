import { wa } from "./wa";

/* The Journal: intent guides in house voice. Each one answers a
   search the customers actually make (PLAN Phase 6), teaches
   honestly, and ends in the chat, because that is how the house
   sells. No invented numbers anywhere: prices live in WhatsApp,
   where they are true today. Titles speak search-plain; the pages
   beneath keep house voice. */

export type Guide = {
  slug: string;
  title: string;
  h1: string;
  line: string;
  description: string;
  sections: { h: string; body: string[] }[];
  faq: { q: string; a: string }[];
  waText: string;
  waLabel: string;
  related: { href: string; label: string };
};

export const GUIDES: Guide[] = [
  {
    slug: "mosaic-tiles-in-lagos",
    title: "Mosaic tiles in Lagos: how to choose",
    h1: "Choosing mosaic, calmly.",
    line: "What to know before you buy, and what to bring to the chat.",
    description:
      "A short guide to buying mosaic tiles in Lagos: glass, ceramic, and stone, sheets and coverage, colour lots, and how to get a real price fast.",
    sections: [
      {
        h: "Where mosaic belongs",
        body: [
          "Mosaic is the finish for the places water and light touch: pools, bathrooms, feature walls, and the floors that want to be looked at.",
          "It is sold by the sheet. Small tiles arrive already spaced on a mesh backing, so a wall of thousands of pieces lays like tilework, not surgery.",
        ],
      },
      {
        h: "Glass, ceramic, stone",
        body: [
          "Glass mosaic carries colour deepest and never fades. It is the pool standard and the jewel of feature walls.",
          "Ceramic is warmer underfoot and kind to budgets. Stone brings texture and quiet.",
          "If the surface lives underwater, start with glass. If it lives under bare feet, ask about the rest.",
        ],
      },
      {
        h: "Sheets and coverage",
        body: [
          "Most sheets run about thirty by thirty centimetres, so roughly eleven sheets cover one square metre. The exact count depends on the range.",
          "Measure the surface and add a little for cuts and corners. The chat turns your measurements into a sheet count for the exact range you choose.",
        ],
      },
      {
        h: "Colour lots matter",
        body: [
          "Mosaic is made in batches, and batches drift. Two orders placed months apart can sit beside each other slightly out of tune.",
          "Largest stock on ground means a whole job can come from one lot. It is the quiet reason to buy where the stock is.",
        ],
      },
      {
        h: "Bring this to the chat",
        body: [
          "A photo of the space. The measurements, even rough ones. The look you are after, in anyone's picture.",
          "With those three, real photos from the shelf and today's price come back the same day.",
        ],
      },
    ],
    faq: [
      {
        q: "What do mosaic tiles cost in Lagos?",
        a: "It depends on the range: plain ceramic and premium glass sit far apart, and art mosaic is its own world. Send the piece you like on WhatsApp and today's price comes back with real photos.",
      },
      {
        q: "How many sheets make a square metre?",
        a: "Most ranges run about eleven sheets to the square metre. Share your measurements and we count it for the exact range.",
      },
      {
        q: "Can I see the tiles before buying?",
        a: "Yes. The showroom at Agric Market, Lagos holds the stock, and the chat sends real photos from the shelf the same day.",
      },
      {
        q: "Do you deliver?",
        a: "Yes, we deliver in Lagos and arrange transport beyond it. Ask in the chat with your location.",
      },
    ],
    waText: "Hello AU Mosaic, I am choosing mosaic tiles. Here is my space: ",
    waLabel: "Ask about mosaic tiles",
    related: { href: "/mosaic-tiles", label: "See the ranges" },
  },
  {
    slug: "swimming-pool-tiles-nigeria",
    title: "Swimming pool tiles in Nigeria: what works underwater",
    h1: "Tiles that live underwater.",
    line: "Why pools ask more of a tile, and what answers.",
    description:
      "Choosing swimming pool tiles in Nigeria: why glass mosaic is the pool standard, what water and sun ask of a tile, and how renovations work.",
    sections: [
      {
        h: "Water is a hard client",
        body: [
          "A pool tile lives in treated water and full sun, year round.",
          "It must hold colour against chlorine, hold its grip against water, and hold its face against a decade of light. Most tiles cannot. Glass mosaic can.",
        ],
      },
      {
        h: "Why pools read blue",
        body: [
          "Water borrows its colour from what it sits in.",
          "Blues and turquoise blends return the sky and make the water read clean and deep. Darker blends make a pool read still and expensive. Sand and white make it read shallow and bright.",
          "There is no wrong answer, only the mood you want at three in the afternoon.",
        ],
      },
      {
        h: "The unglamorous heroes",
        body: [
          "A pool finish is only as good as what holds it: the gum cement that fixes the sheets and the grout that closes the lines.",
          "Pool-grade adhesive is not a place to save. It is the difference between a finish and a repair.",
        ],
      },
      {
        h: "Renovating an old pool",
        body: [
          "Old pools come back. The shell is inspected, the tired finish comes off, the surface is trued, and new mosaic goes on.",
          "A renovation is measured like a new finish: the surface area decides the sheets, the condition decides the preparation.",
        ],
      },
    ],
    faq: [
      {
        q: "What is the best tile for a swimming pool?",
        a: "Glass mosaic. It is colourfast against treated water and sun, and it is what we put in our own projects.",
      },
      {
        q: "How long does a pool finish last?",
        a: "A glass mosaic finish laid on sound preparation is a decade-plus finish. The preparation is most of the answer.",
      },
      {
        q: "Can you re-tile an existing pool?",
        a: "Yes. Renovations and mosaic replacement are half the work we do. Send photos of the pool as it stands.",
      },
      {
        q: "What is gum cement?",
        a: "The adhesive that fixes mosaic sheets to the pool shell. We stock pool-grade gum cement beside the tiles.",
      },
    ],
    waText: "Hello AU Mosaic, I am choosing pool tiles. My pool: ",
    waLabel: "Talk pool tiles",
    related: { href: "/mosaic-tiles", label: "See the pool mosaics" },
  },
  {
    slug: "pool-construction-lagos",
    title: "Pool construction in Lagos: what a build involves",
    h1: "From first talk to first swim.",
    line: "The honest shape of a pool build.",
    description:
      "What building a swimming pool in Lagos involves: the four stages, what shapes the cost, the equipment that matters, and honest timelines.",
    sections: [
      {
        h: "Four stages",
        body: [
          "Talk: your space, your budget, your picture of the pool.",
          "Plan: size, depth, finish, and equipment, with a clear quote per job.",
          "Build: structure, plumbing, tiling. Our materials, our hands.",
          "Swim: handover with the water running and the lights on.",
        ],
      },
      {
        h: "What shapes the cost",
        body: [
          "Size and depth first: they decide concrete, steel, and water.",
          "Then the finish: plain ceramic and premium glass mosaic sit far apart.",
          "Then the equipment room: pump, filter, lights, and the extras like heating or a waterfall.",
          "Two pools of the same length can honestly sit far apart in price. The quote per job exists because the job is the price.",
        ],
      },
      {
        h: "The equipment is the pool",
        body: [
          "The shell holds water; the equipment keeps it worth swimming in.",
          "A right-sized pump and filter, a skimmer that catches the surface, and lights that earn the evening. We stock Astral equipment and stand behind it.",
        ],
      },
      {
        h: "Timelines, honestly",
        body: [
          "A straightforward residential build runs in weeks, not days, and weather has a vote.",
          "The plan stage sets a schedule; the build keeps to it or tells you why early.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does a swimming pool cost in Lagos?",
        a: "It is quoted per job: size, depth, finish, and equipment each move the number. Share your space and the picture in your head, and a real quote follows.",
      },
      {
        q: "How long does a pool take to build?",
        a: "Weeks for a straightforward residential pool, longer for large or complicated sites. The plan gives you a schedule before work starts.",
      },
      {
        q: "Do you renovate existing pools?",
        a: "Yes. Renovations, re-tiling, and equipment replacement are everyday work here.",
      },
    ],
    waText: "Hello AU Mosaic, I am planning a pool. Can we talk?",
    waLabel: "Start the pool talk",
    related: { href: "/pools", label: "How we build" },
  },
  {
    slug: "pool-pump-price-nigeria",
    title: "Pool pump prices in Nigeria: what decides the cost",
    h1: "The pump is the heart.",
    line: "What a pool pump does, and why prices differ.",
    description:
      "Pool pump prices in Nigeria: how pumps are sized to a pool, why prices differ, and how to buy the right one the first time.",
    sections: [
      {
        h: "What the pump does",
        body: [
          "The pump turns the pool over: it moves the water through the filter and back, so the pool stays a pool and not a pond.",
          "Everything else in the equipment room waits on it.",
        ],
      },
      {
        h: "Size decides price first",
        body: [
          "A pump is sized to the water it must move. A small home pool and a hotel pool need different hearts.",
          "The trade's rule of thumb: the pump should turn the whole pool over in about eight hours. Volume decides flow, and flow decides the pump.",
        ],
      },
      {
        h: "Brand is spare parts",
        body: [
          "A pump is a machine that runs daily in heat. One day it will want a seal, a bearing, an impeller.",
          "A brand with parts on ground, like the Astral line we stock, is cheaper the day something wears. The no-name pump is only cheap on day one.",
        ],
      },
      {
        h: "Buying it right",
        body: [
          "Come with the pool volume, in litres or in metres.",
          "Tell the chat the pool size and whether it is a new build or a replacement. The right size and today's price come back together.",
        ],
      },
    ],
    faq: [
      {
        q: "Why do pool pump prices differ so much?",
        a: "Flow rate, motor quality, and brand. A bigger pool needs a bigger pump, and a serviceable brand costs less over its life.",
      },
      {
        q: "What size pump do I need?",
        a: "Enough to turn your pool over in about eight hours. Share the pool dimensions and we size it for you.",
      },
      {
        q: "Do you stock pool pumps in Lagos?",
        a: "Yes. Astral pumps and the rest of the equipment room, on ground at Agric Market.",
      },
    ],
    waText: "Hello AU Mosaic, I need a pool pump. My pool size: ",
    waLabel: "Ask about pumps",
    related: { href: "/pool-materials", label: "The equipment room" },
  },
  {
    slug: "mosaic-tile-prices-lagos",
    title: "Mosaic tile prices in Lagos: how a quote is built",
    h1: "What a quote weighs.",
    line: "The honest anatomy of a mosaic price.",
    description:
      "How mosaic tile prices work in Lagos: what moves the price per sheet, why art mosaic is different, and how to get today's price fast.",
    sections: [
      {
        h: "By the sheet",
        body: [
          "Mosaic sells by the sheet, and the range decides the sheet price.",
          "Plain ceramic sits at one end. Glass blends climb with colour depth and finish. Gold-leaf and art mosaic are their own conversation.",
        ],
      },
      {
        h: "What moves the number",
        body: [
          "Material first: glass carries more than ceramic.",
          "Then the work in it: blends cost more than plains, and murals more than blends.",
          "Then the quantity: a container order from our factory line in Foshan prices differently from ten sheets off the shelf.",
        ],
      },
      {
        h: "Why we quote per job",
        body: [
          "A price list ages; stock and rates move.",
          "A quote per job means the number you get is true the day you get it, for the exact range and count you need. It is the honest way to price imported material.",
        ],
      },
      {
        h: "Today's price, fast",
        body: [
          "Send the piece you like, or a photo of the look you want, with rough measurements.",
          "Real photos from the shelf and today's price come back the same day. That is the whole process.",
        ],
      },
    ],
    faq: [
      {
        q: "What is the price of mosaic tiles per square metre in Lagos?",
        a: "It depends on the range. About eleven sheets make a square metre, and the sheet price runs from friendly ceramic to premium glass. Name the range in the chat and the metre price comes back today.",
      },
      {
        q: "Is there a discount for bulk?",
        a: "Volume changes the conversation, and container orders come factory-direct. Tell the chat your quantities.",
      },
      {
        q: "How much is gold mosaic?",
        a: "Gold-leaf mosaic is priced per sheet and moves with the market. Ask with your quantity for today's number.",
      },
    ],
    waText: "Hello AU Mosaic, please send me today's price for: ",
    waLabel: "Get today's price",
    related: { href: "/mosaic-tiles", label: "See the ranges" },
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);

export const waGuide = (g: Guide) => wa(g.waText);
