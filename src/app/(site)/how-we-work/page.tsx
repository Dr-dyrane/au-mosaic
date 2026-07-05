import type { Metadata } from "next";
import { HOW, HOW_STEPS } from "@/lib/images";
import { wa } from "@/lib/wa";
import { CtaRow, PageHero, Section } from "@/components/ui";
import ThemeImage from "@/components/ThemeImage";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "How we work",
  description:
    "From the sample wall to the running pool: choose the colour, take samples home, gather the materials, and we build or supply.",
};

const waStart = () =>
  wa("Hello AU Mosaic, I'd like to start a project. Here's a picture and the size: ");

export default function HowWeWorkPage() {
  return (
    <>
      <PageHero
        eyebrow="The way it goes"
        title="How we work."
        sub="From the sample wall to the running pool — the order, and the honesty, of a job done well."
        image={HOW.library.night}
        imageLight={HOW.library.day}
        alt="A wall of glass-mosaic sample boards and open sample trays on a stone counter"
        cta={{ href: waStart(), label: "Start with a picture" }}
      />

      <Section eyebrow="Four steps" title="Colour first, water last.">
        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2">
          {HOW_STEPS.map((s) => (
            <Reveal key={s.title}>
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-sand">
                  <ThemeImage
                    dark={s.night}
                    light={s.day}
                    alt={s.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="media-lux object-cover"
                  />
                </div>
                <figcaption className="mt-5">
                  <p className="eyebrow">Step {s.step}</p>
                  <p className="font-serif mt-2 text-[20px] leading-snug">{s.title}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">{s.line}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Begin"
        title="Send a picture and a size."
        sub="That is all it takes to start. We will tell you what the space can hold, what it needs, and what it costs — honestly, per job."
      >
        <CtaRow href={waStart()} label="Start on WhatsApp" secondary={{ href: "/pool-materials", label: "The materials" }} />
      </Section>
    </>
  );
}
