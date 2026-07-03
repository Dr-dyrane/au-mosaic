import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getProjects, getPieces } from "@/lib/catalog";
import { waPool } from "@/lib/wa";
import Reveal from "@/components/Reveal";
import SceneFrame from "@/components/SceneFrame";
import ThemeImage from "@/components/ThemeImage";
import { CtaRow } from "@/components/ui";

/* A project page reads like a short film: the hero frame, the story,
   the frames, the materials that made it, and one door out. */

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const project = await getProject((await params).slug);
  if (!project) return {};
  return {
    title: project.title,
    description: `${project.line} ${project.scope.join(", ")}.`,
  };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const project = await getProject((await params).slug);
  if (!project) notFound();
  const pieces = await getPieces();
  const used = pieces.filter((p) => project.materials.includes(p.slug));

  return (
    <>
      <section className="relative flex min-h-svh items-end overflow-hidden">
        <SceneFrame
          dark={project.cover}
          light={project.coverDay}
          alt={project.title}
          fill
          priority
          quality={90}
          sizes="100vw"
          className="kenburns media-lux object-cover"
        >
          <div className="scrim-hero pointer-events-none absolute inset-0" />
          <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
            <Reveal>
              <p className="eyebrow scene-eyebrow">{project.concept ? "Concept study" : "Project"}</p>
              <h1 className="font-serif text-display-hero scene-title mt-4 max-w-3xl">{project.title}</h1>
              <p className="scene-sub mt-5 max-w-md text-[16px] leading-relaxed">{project.line}</p>
            </Reveal>
          </div>
        </SceneFrame>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <div className="grid gap-10 md:grid-cols-2">
          <Reveal>
            <p className="eyebrow">The brief</p>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-dusk">{project.story}</p>
          </Reveal>
          <Reveal delay={90}>
            <div className="panel">
              <p className="eyebrow">Scope</p>
              <p className="font-serif mt-3 text-[20px] leading-snug">{project.scope.join(" · ")}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-dusk">
                Materials from stock, installed by the house.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The frames */}
      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <div className="-mx-5 grid gap-6 sm:mx-0 sm:grid-cols-2">
          {project.images.map((img, i) => (
            <Reveal key={img.src} delay={(i % 2) * 80} className={i % 3 === 0 ? "sm:col-span-2" : ""}>
              <div className={`relative overflow-hidden rounded-none sm:rounded-[26px] ${i % 3 === 0 ? "aspect-[21/10]" : "aspect-[4/5]"}`}>
                <ThemeImage
                  dark={img.src}
                  light={img.srcDay}
                  alt={img.alt}
                  fill
                  quality={90}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="media-lux object-cover"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The materials behind it */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <Reveal>
          <p className="eyebrow">The materials behind it</p>
        </Reveal>
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
          {used.map((p) => (
            <Link key={p.slug} href={`/piece/${p.slug}`} className="link-hair text-dusk">
              {p.name}
            </Link>
          ))}
        </div>
        <div className="mt-16">
          <CtaRow
            href={waPool()}
            label="Build something like this"
            secondary={{ href: "/projects", label: "All projects" }}
          />
        </div>
      </section>
    </>
  );
}
