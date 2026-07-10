/* The studio verbs, drawn once by the house. The back office set the
   convention (admin/(panel)/icons.tsx); this is its studio cousin, the
   same viewBox, the same 1.6 stroke on currentColor, so a tool tints
   gold the moment its caller adds text-gold. Each rides beside a word,
   never alone: the label keeps the identity, the glyph gives the eye a
   shape to find. */

import type { ReactNode } from "react";

/* The four verbs the studio and the back office share ride straight
   through, so there is one drawing of each in the house. */
export { IconShare, IconEye, IconClose, IconRefresh } from "@/app/admin/(panel)/icons";

type IconProps = { className?: string };

function Svg({ className = "h-4 w-4", children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/* A reticle on the surface: the finder learning where the wall is. */
export function IconAutoFind({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="6.4" />
      <circle cx="12" cy="12" r="1.5" />
      <path d="M12 2.4v2.4" />
      <path d="M12 19.2v2.4" />
      <path d="M2.4 12h2.4" />
      <path d="M19.2 12h2.4" />
    </Svg>
  );
}

/* A plus above a receding plane: one more surface for the preview. */
export function IconAddSurface({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3.6 16 11 11.5h9.4L13 16z" />
      <path d="M12 4v5" />
      <path d="M9.5 6.5h5" />
    </Svg>
  );
}

/* An open basin: the flat pool folded into a box interior. */
export function IconShell({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3.6 8.5h16.8" />
      <path d="M5.4 8.5 7.6 18h8.8l2.2-9.5" />
    </Svg>
  );
}

/* Two stacked planes: near reads bright, far recedes. */
export function IconDepth({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3.2 20 8l-8 4.8L4 8z" />
      <path d="M4 12l8 4.8 8-4.8" />
    </Svg>
  );
}

/* A calm minus in a squircle: take a surface back off. No trash can. */
export function IconRemove({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="5.2" />
      <path d="M8.4 12h7.2" />
    </Svg>
  );
}

/* A thumbtack: hold this look in the history. */
export function IconPin({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 14.6V21" />
      <path d="M8.4 4h7.2l-1.1 6.2 2 2.1v1.1H7.5v-1.1l2-2.1z" />
    </Svg>
  );
}

/* A tray taking a down arrow: save the render. */
export function IconDownload({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3.5v10.5" />
      <path d="M8 10.5 12 14l4-3.5" />
      <path d="M4.5 15.5v3a1.4 1.4 0 0 0 1.4 1.4h12.2a1.4 1.4 0 0 0 1.4-1.4v-3" />
    </Svg>
  );
}

/* A curved arrow back: step to the last snapshot. */
export function IconUndo({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9.5 14 4.5 9l5-5" />
      <path d="M4.5 9h10a5.5 5.5 0 0 1 0 11H10" />
    </Svg>
  );
}

/* Its mirror: step to the next snapshot. */
export function IconRedo({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14.5 14l5-5-5-5" />
      <path d="M19.5 9h-10a5.5 5.5 0 0 0 0 11H14" />
    </Svg>
  );
}

/* Three sliders, each with a knob: the refine surface. */
export function IconRefine({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 7h9" />
      <path d="M17 7h3" />
      <circle cx="15" cy="7" r="2" />
      <path d="M4 12h3" />
      <path d="M11 12h9" />
      <circle cx="9" cy="12" r="2" />
      <path d="M4 17h9" />
      <path d="M17 17h3" />
      <circle cx="15" cy="17" r="2" />
    </Svg>
  );
}

/* An eraser on its baseline: clear the auto-find and fill the frame. */
export function IconClear({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M8.5 19 4 14.5a1.5 1.5 0 0 1 0-2.1l7.4-7.4a1.5 1.5 0 0 1 2.1 0l4.5 4.5a1.5 1.5 0 0 1 0 2.1L11.6 19z" />
      <path d="M8.5 19H20" />
      <path d="M9 9.5 14.5 15" />
    </Svg>
  );
}
