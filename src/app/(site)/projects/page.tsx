import type { Metadata } from "next";
import { getProjects } from "@/lib/catalog";
import { OWN, DAY } from "@/lib/images";
import { waPool } from "@/lib/wa";
import Reveal from "@/components/Reveal";
import ProjectCard from "@/components/ProjectCard";
import { CtaRow, PageHero, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Mosaic and pool projects in Lagos",
  description:
    "Pools, hammams, and commissioned mosaic murals by AU Mosaic. The work behind the collection.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <>
      <PageHero
        eyebrow="Projects"
        title="The work speaks quietly."
        sub="Pools, interiors, and commissions. Each one starts with a conversation."
        image={OWN.artGallery}
        imageLight={DAY.artGallery}
        alt="A commissioned mosaic art panel of sun, moon, and waves"
        cta={{ href: waPool(), label: "Begin your own" }}
      />

      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="-mx-5 grid gap-x-8 gap-y-20 sm:mx-0 sm:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 2) * 90} className={i % 2 === 1 ? "sm:mt-24" : ""}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <Section
        tint
        eyebrow="Your project"
        title="Build something like this."
        sub="Send the space, the idea, or just the ambition. Photos and a quote follow."
      >
        <CtaRow href={waPool()} label="Start on WhatsApp" />
      </Section>
    </>
  );
}
