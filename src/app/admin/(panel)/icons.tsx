/* The six verbs the thumb knows, drawn once by the house: back, eye,
   filter, close, share, refresh. Typography stays the identity; these
   stand only where a word would slow the hand. Stroke rides
   currentColor, so each icon dresses in the ink of its line. */

type IconProps = { className?: string };

function Svg({ className = "h-4 w-4", children }: IconProps & { children: React.ReactNode }) {
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

export function IconBack({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}

export function IconEye({ open = true, className }: IconProps & { open?: boolean }) {
  return (
    <Svg className={className}>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
      {!open && <path d="M4 4l16 16" />}
    </Svg>
  );
}

export function IconFilter({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </Svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Svg>
  );
}

export function IconShare({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12" />
      <path d="M12 14.5V3.5" />
      <path d="M8 7l4-4 4 4" />
    </Svg>
  );
}

export function IconRefresh({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M20 12a8 8 0 1 1-2.7-6" />
      <path d="M20 3.5V8h-4.5" />
    </Svg>
  );
}
