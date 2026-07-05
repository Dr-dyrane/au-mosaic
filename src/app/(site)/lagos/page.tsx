import type { Metadata } from "next";
import Image from "next/image";
import { LAGOS, LAGOS_SCENES } from "@/lib/images";
import { wa } from "@/lib/wa";
import { CtaRow, PageHero, Section } from "@/components/ui";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Rooted in Lagos",
  description:
    "AU Mosaic is a Lagos house: mosaic tiles, pool materials, and pool construction, at Agric Market, Orile since 2016.",
};

const waVisit = () =>
  wa("Hello AU Mosaic, I'd like to visit the showroom at Agric Market. When are you open?");

export default function LagosPage() {
  return (
    <>
      <PageHero
        eyebrow="Rooted in Lagos"
        title="A house built in Lagos, for Lagos light."
        sub="Since 2016, from Agric Market: mosaic tiles, pool materials, and the water they belong to."
        image={LAGOS.villaPool}
        alt="A Lagos villa pool clad in seed-blue mosaic at dusk, framed by palms"
        cta={{ href: waVisit(), label: "Visit the showroom" }}
      />

      <Section eyebrow="Since 2016" title="From Agric Market, Orile.">
        <div className="max-w-2xl space-y-6 text-[16px] leading-relaxed text-dusk">
          <p>
            AU Mosaic grew up at Agric Market, Orile — where Lagos comes to
            build. Since 2016 the work has kept one habit: choose the tile you
            would want in your own home, and stand behind it.
          </p>
          <p>
            We supply mosaic for pools, baths, and walls, and carry the water&apos;s
            hardware beside it — the pumps, the filters, the fittings. One place,
            one responsibility, from the sample board to the running pool.
          </p>
          <p>
            This is a Lagos house, and it dresses in Lagos light. The same tile
            reads one way at noon and another at dusk — so the window keeps two
            suns, and the brand keeps the gold the city already wears.
          </p>
        </div>
      </Section>

      <Section eyebrow="The work" title="In the Lagos light." tint>
        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2">
          {LAGOS_SCENES.map((scene) => (
            <Reveal key={scene.src}>
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-sand">
                  <Image
                    src={scene.src}
                    alt={scene.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="media-lux object-cover"
                  />
                </div>
                <figcaption className="mt-5">
                  <p className="font-serif text-[20px] leading-snug">{scene.place}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">{scene.line}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Come and see"
        title="The samples are on the counter."
        sub="Bring your measurements, or just your picture of the place. We will meet you in Lagos, and the rest starts on WhatsApp."
      >
        <CtaRow
          href={waVisit()}
          label="Visit the showroom"
          secondary={{ href: "/mosaic-tiles", label: "See the tiles" }}
        />
      </Section>
    </>
  );
}
