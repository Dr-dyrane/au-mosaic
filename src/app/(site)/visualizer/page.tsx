import type { Metadata } from "next";
import Visualizer from "@/components/Visualizer";
import { getPieces } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "See it in your space",
  description:
    "Try AU Mosaic colourways on a pool, wall, backsplash, shower, or floor, in your own light.",
};

type Search = Promise<{ piece?: string }>;

export default async function VisualizerPage({ searchParams }: { searchParams: Search }) {
  const { piece } = await searchParams;
  const pieces = await getPieces();
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-32 sm:px-8 sm:pt-44">
        <p className="eyebrow">Visualizer</p>
        <h1 className="font-serif text-display-page mt-4 max-w-2xl">See it in your space.</h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dusk">
          Live camera or one photo. Try stock colourways in your own light.
          Send the result, get a quote.
        </p>
      </section>
      <div className="py-10 sm:py-14">
        <Visualizer initialPiece={piece} pieces={pieces} />
      </div>
    </>
  );
}
