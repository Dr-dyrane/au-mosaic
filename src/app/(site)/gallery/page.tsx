import type { Metadata } from "next";
import { getGallery } from "@/lib/gallery";
import GalleryFeed from "@/components/GalleryFeed";

const description =
  "Rooms, pools, product plates, and murals by AU Mosaic in glass, stone, and water.";
export const metadata: Metadata = {
  title: "The gallery",
  description,
  openGraph: { title: "The gallery · AU Mosaic", description },
  twitter: { title: "The gallery · AU Mosaic", description },
};

export default async function GalleryPage() {
  const items = await getGallery();

  return (
    <div className="pb-28 pt-28 sm:pt-32">
      <header className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="eyebrow">The gallery</p>
        <h1 className="font-serif text-display-section mt-3 max-w-xl">
          The house, in frames.
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">
          Rooms, pools, product plates, and murals in glass, stone, and water.
          Tap a frame to follow it home.
        </p>
      </header>

      <div className="mx-auto mt-10 max-w-7xl px-5 sm:mt-14 sm:px-8">
        <GalleryFeed items={items} />
      </div>
    </div>
  );
}
