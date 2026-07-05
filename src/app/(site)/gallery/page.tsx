import type { Metadata } from "next";
import { GALLERY } from "@/lib/gallery";
import GalleryFeed from "@/components/GalleryFeed";

const description =
  "Every room, pool, and wall the house has dreamed — one scrolling gallery of AU Mosaic in glass, stone, and water.";
export const metadata: Metadata = {
  title: "The gallery",
  description,
  openGraph: { title: "The gallery · AU Mosaic", description },
  twitter: { title: "The gallery · AU Mosaic", description },
};

export default function GalleryPage() {
  return (
    <div className="pb-28 pt-28 sm:pt-32">
      <header className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">The gallery</p>
        <h1 className="font-serif text-display-section mt-3 max-w-xl">Everything, in one scroll.</h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-dusk">
          Rooms, pools, walls, and murals in glass, stone, and water — the whole
          house, un-sorted. Tap any frame to follow it home.
        </p>
      </header>

      <div className="mx-auto mt-10 max-w-[1600px] px-1.5 sm:mt-14 sm:px-6">
        <GalleryFeed items={GALLERY} />
      </div>
    </div>
  );
}
