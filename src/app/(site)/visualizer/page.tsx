import type { Metadata } from "next";
import Visualizer from "@/components/Visualizer";
import { getPieces } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Mosaic tile visualizer",
  description:
    "Try AU Mosaic colourways on a pool, wall, backsplash, shower, or floor, in your own light.",
};

type Search = Promise<{ piece?: string }>;

export default async function VisualizerPage({ searchParams }: { searchParams: Search }) {
  const { piece } = await searchParams;
  const pieces = await getPieces();
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-36 sm:px-8 sm:pt-44">
        <p className="eyebrow">The visualizer</p>
        <h1 className="font-serif text-display-page mt-4 max-w-2xl">See it in your space.</h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dusk">
          A pool, wall, backsplash, shower, or floor. Any colourway from
          stock, laid in your own light. Send the result, get a quote.
        </p>
      </section>
      <div className="py-14">
        <Visualizer initialPiece={piece} pieces={pieces} />
      </div>
    </>
  );
}
