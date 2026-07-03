/* AU Mosaic · imagery. Every frame is the house's own: generated for the
   maison, eye-gated, compressed, and served from public/media. This module
   is the ONLY place media paths live. Nonso's real photography joins the
   same way: drop, gate, wire. */

/* Owned assets. */
export const OWN = {
  duskVilla: "/media/dusk-villa.jpg",
  duskVillaPoster: "/media/dusk-villa-poster.jpg",
  poolBlues: "/media/pool-blues.jpg",
  craftHands: "/media/craft-hands.jpg",
  glassJewels: "/media/glass-jewels.jpg",
  terrace: "/media/terrace.jpg",
  hammam: "/media/hammam.jpg",
  darkBath: "/media/dark-bath.jpg",
  koiMural: "/media/koi-mural.jpg",
  beetleMural: "/media/beetle-mural.jpg",
  borders: "/media/borders.jpg",
  villaPalms: "/media/villa-palms.jpg",
  privatePool: "/media/private-pool.jpg",
};

/* Film: slow ambient loops, owned. The hero film's poster is its own first
   frame, so still and motion are the same image; blocked autoplay, save
   data, or reduced motion all hold that frame. The loop is a ping-pong of
   the owner's generated shot: seamless by construction. */
export const FILM = {
  heroLoop: "/media/dusk-villa-loop.mp4",
};

/* Environments: the dream first. Materials follow. */
export const ENVIRONMENTS = [
  {
    src: OWN.duskVilla,
    place: "The Dusk Villa",
    line: "Water holds the last light.",
    materials: "Pool mosaic in midnight blend, coping stone, warm lighting",
    href: "/mosaic-tiles#pool-mosaics",
  },
  {
    src: OWN.terrace,
    place: "The Infinity Terrace",
    line: "The edge disappears.",
    materials: "Aqua pool mosaic, clay deck tiles, glass waterline",
    href: "/mosaic-tiles#pool-mosaics",
  },
  {
    src: OWN.hammam,
    place: "The Private Hammam",
    line: "Warm stone, quiet hours.",
    materials: "Stone mosaic, heated surfaces, brass fittings",
    href: "/mosaic-tiles#feature-mosaics",
  },
  {
    src: OWN.darkBath,
    place: "The Dark Bath",
    line: "Shadow, texture, calm.",
    materials: "Textured dark mosaic, matte grout, warm light",
    href: "/mosaic-tiles#glass-mosaics",
  },
];
