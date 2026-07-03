import Link from "next/link";
import SceneFrame from "./SceneFrame";
import type { Project } from "@/lib/projects";

/* One project, one frame: cover, honest label, scope on hover. Shared
   by the home strip and the gallery grid. */
export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-none sm:rounded-[26px]">
        <SceneFrame
          dark={project.cover}
          light={project.coverDay}
          alt={project.title}
          fill
          quality={90}
          sizes="(max-width: 640px) 100vw, 50vw"
          className="img-glide media-lux object-cover"
        >
          <div className="scrim-card pointer-events-none absolute inset-0" />
          <div className="scene-deepen absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 p-7 sm:p-8">
            <p className="eyebrow scene-eyebrow">{project.concept ? "Concept study" : "Project"}</p>
            <p className="font-serif scene-title mt-2 text-[26px] leading-snug">{project.title}</p>
            <div className="cap-reveal mt-3">
              <p className="scene-sub max-w-xs text-[14px] leading-relaxed">{project.scope.join(" · ")}</p>
              <span className="link-hair scene-link mt-5">See the project</span>
            </div>
          </div>
        </SceneFrame>
      </div>
    </Link>
  );
}
