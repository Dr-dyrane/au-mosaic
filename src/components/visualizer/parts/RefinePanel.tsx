"use client";

import type { ReactNode } from "react";
import { useState } from "react";

/* The studio's refine surface, one decision at a time. Each section rests
   as a summary (its label and current value) and opens on demand; opening
   one closes the others, so the panel never becomes a wall of controls.
   The bodies are the existing option groups, handed in unchanged, so the
   disclosure changes only how much is shown at once, never what the
   controls do. Lucent shell cells, no lines, concentric inside the panel. */
export interface RefineSection {
  key: string;
  eyebrow: string;
  value: string;
  action: string;
  body: ReactNode;
}

export default function RefinePanel({
  sections,
  defaultOpen = null,
}: {
  sections: RefineSection[];
  defaultOpen?: string | null;
}) {
  const [open, setOpen] = useState<string | null>(defaultOpen);
  return (
    <div className="space-y-3" data-viz="refine-panel">
      {sections.map((section) => {
        const isOpen = open === section.key;
        return (
          <div key={section.key} className="rounded-[26px] bg-shell/45 shadow-lift">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : section.key)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="min-w-0">
                <span className="eyebrow block">{section.eyebrow}</span>
                <span className="mt-1 block truncate font-serif text-[20px] text-ink">{section.value}</span>
              </span>
              <span className={`link-hair shrink-0 ${isOpen ? "text-ink" : "text-dusk"}`}>
                {isOpen ? "Close" : section.action}
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden" aria-hidden={!isOpen}>
                <div className="px-5 pb-5">{section.body}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
