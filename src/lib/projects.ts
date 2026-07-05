import { DAY, OWN, PROJECT } from "./images";

/* Projects: the proof of work. These four are CONCEPT STUDIES built
   from the house's owned imagery so the owner sees the format and the
   bar; his real completed jobs replace them one by one through the
   same shape. concept: true renders the honest label. */

export type Project = {
  slug: string;
  title: string;
  line: string;
  scope: string[];
  /** Piece slugs used, linking back into the collection. */
  materials: string[];
  story: string;
  cover: string;
  coverDay?: string;
  images: { src: string; srcDay?: string; alt: string }[];
  concept?: boolean;
};

export const PROJECTS: Project[] = [
  {
    slug: "villa-above-the-sea",
    title: "The Villa Above the Sea",
    line: "A pool that holds the last light.",
    scope: ["New pool construction", "Pool mosaic", "Waterline band"],
    materials: ["classic-pool-blues", "patterned-pool-borders", "deep-midnight-blends"],
    story:
      "A long infinity pool for a villa that watches the horizon. The floor runs classic blues into a midnight drop at the deep end; a patterned band carries the waterline. Built to be swum at dusk.",
    cover: OWN.heroDusk,
    coverDay: DAY.heroDusk,
    images: [
      { src: OWN.heroDusk, srcDay: DAY.heroDusk, alt: "The villa pool at dusk" },
      { src: OWN.poolBlues, srcDay: DAY.poolBlues, alt: "Classic pool blues underwater" },
      { src: OWN.borders, alt: "The patterned waterline band" },
      { src: OWN.privatePool, alt: "The ladder and brass outlet detail" },
    ],
    concept: true,
  },
  {
    slug: "terrace-at-the-edge",
    title: "The Terrace at the Edge",
    line: "The edge disappears.",
    scope: ["Infinity edge", "Aqua pool mosaic", "Deck finishing"],
    materials: ["aqua-turquoise-blends", "classic-pool-blues"],
    story:
      "An infinity edge over open water, tiled in bright aqua blends that meet the sea's own colour. The spill wall reads as one sheet of light at swimming hour.",
    cover: OWN.terrace,
    coverDay: DAY.terrace,
    images: [
      { src: OWN.terrace, srcDay: DAY.terrace, alt: "The infinity edge at golden hour" },
      { src: OWN.aquaBlends, srcDay: DAY.aquaBlends, alt: "Aqua blends beneath the surface" },
      { src: OWN.villaPalms, alt: "The still morning after handover" },
    ],
    concept: true,
  },
  {
    slug: "the-private-hammam",
    title: "The Private Hammam",
    line: "Warm stone, quiet hours.",
    scope: ["Interior mosaic", "Heated bench", "Feature lighting"],
    materials: ["gold-metallic-accents", "custom-colours-sizes"],
    story:
      "A steam room clad in honey and umber mosaic, one oculus of light, gold accents where the water runs. Every tile set to be touched, not just seen.",
    cover: OWN.hammam,
    coverDay: DAY.hammam,
    images: [
      { src: OWN.hammam, srcDay: DAY.hammam, alt: "The hammam under its oculus" },
      { src: OWN.goldAccents, srcDay: DAY.goldAccents, alt: "Gold accents catching the light" },
      { src: OWN.darkBath, alt: "The dark bath beyond" },
    ],
    concept: true,
  },
  {
    slug: "gallery-commission",
    title: "A Gallery Commission",
    line: "Creativity is why the house exists.",
    scope: ["Custom murals", "Art mosaic", "Installation"],
    materials: ["pattern-picture-mosaics", "custom-murals", "solid-colour-glass"],
    story:
      "Two commissioned murals, a koi and a scarab, each built from thousands of hand-set tesserae with gold leaf in the glass. Designed, blended, and installed by the house.",
    cover: OWN.koiMural,
    coverDay: DAY.koiMural,
    images: [
      { src: OWN.koiMural, srcDay: DAY.koiMural, alt: "The koi mural" },
      { src: OWN.beetleMural, srcDay: DAY.beetleMural, alt: "The scarab mural" },
      { src: OWN.customColours, srcDay: DAY.customColours, alt: "The blend being composed" },
      { src: OWN.glassJewels, srcDay: DAY.glassJewels, alt: "The glass range behind it" },
    ],
    concept: true,
  },
  {
    slug: "a-stone-feature-wall",
    title: "A Stone Feature Wall",
    line: "Texture that reads at every hour.",
    scope: ["Interior mosaic", "Feature wall", "Grazing light"],
    materials: ["stone-mosaic", "solid-colour-glass"],
    story:
      "A living-room wall run floor to ceiling in split-face stone mosaic — warm greys and umber, grazed by hidden light so the surface changes as the day does. The one wall the room is built around.",
    cover: PROJECT.stoneWall,
    coverDay: PROJECT.stoneWallDay,
    images: [
      { src: PROJECT.stoneWall, srcDay: PROJECT.stoneWallDay, alt: "A stone mosaic feature wall grazed by warm light" },
      { src: OWN.showroomWall, srcDay: DAY.showroomWall, alt: "The stone range on the wall" },
    ],
    concept: true,
  },
  {
    slug: "a-marble-bath",
    title: "A Marble Bath",
    line: "Cool stone, quiet water.",
    scope: ["Interior mosaic", "Bath surround", "Lit niche"],
    materials: ["hexagon-marble", "silver-crystal-mosaic"],
    story:
      "A freestanding bath against a wall of white hexagon marble, a lit niche for oil and candle, brass at the tap. Cool where the hammam is warm — built for the long, quiet end of the day.",
    cover: PROJECT.marbleBath,
    coverDay: PROJECT.marbleBathDay,
    images: [
      { src: PROJECT.marbleBath, srcDay: PROJECT.marbleBathDay, alt: "A freestanding bath against a white hexagon marble mosaic wall" },
      { src: OWN.hammam, srcDay: DAY.hammam, alt: "Warm stone in the room beyond" },
    ],
    concept: true,
  },
];

export const projectBySlug = (slug: string): Project | undefined =>
  PROJECTS.find((p) => p.slug === slug);
