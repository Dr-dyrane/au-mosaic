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

export function IconMore({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="6.5" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/* The nine rooms, drawn for wayfinding. Unlike the verbs above, these
   never stand alone: the label rides beside them, so typography keeps the
   identity and the icon only gives the eye a shape to find. Same weight,
   same family. AdminNav maps them by room id; active tints gold. */

export function IconHome({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.2 10.3V19h11.6v-8.7" />
      <path d="M9.8 19v-4.2h4.4V19" />
    </Svg>
  );
}

export function IconStock({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3.2 4.5 7v10L12 20.8 19.5 17V7Z" />
      <path d="M4.7 7 12 11l7.3-4" />
      <path d="M12 11v9.6" />
    </Svg>
  );
}

export function IconOrders({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M7 3.5h6.4L18 8v12.5H7Z" />
      <path d="M13.2 3.6V8h4.6" />
      <path d="M9.7 12.4h6" />
      <path d="M9.7 15.7h4.2" />
    </Svg>
  );
}

export function IconPeople({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8.4" r="3.3" />
      <path d="M5.6 20a6.4 6.4 0 0 1 12.8 0" />
    </Svg>
  );
}

export function IconOwed({ className }: IconProps) {
  return (
    <Svg className={className}>
      <ellipse cx="12" cy="7.4" rx="6.2" ry="2.7" />
      <path d="M5.8 7.4v3.4c0 1.5 2.78 2.7 6.2 2.7s6.2-1.2 6.2-2.7V7.4" />
      <path d="M5.8 10.8v3.4c0 1.5 2.78 2.7 6.2 2.7s6.2-1.2 6.2-2.7v-3.4" />
    </Svg>
  );
}

export function IconDeliveries({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3.5 6.5h10.5v9H3.5Z" />
      <path d="M14 9.5h3.6L20.5 12.4v3.1H14Z" />
      <circle cx="7" cy="17.6" r="1.7" />
      <circle cx="16.8" cy="17.6" r="1.7" />
    </Svg>
  );
}

export function IconPhotos({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.8" y="5.2" width="16.4" height="13.6" rx="2.6" />
      <circle cx="8.6" cy="10" r="1.5" />
      <path d="M4.4 16.8 9 12.4l3.4 3.2 3-2.8 4.4 4" />
    </Svg>
  );
}

export function IconInsights({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 19.5h15" />
      <path d="M8 19.5v-4.6" />
      <path d="M12 19.5v-8.6" />
      <path d="M16 19.5v-6.2" />
    </Svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 8.6h14" />
      <path d="M5 15.4h14" />
      <circle cx="9" cy="8.6" r="2.1" />
      <circle cx="15" cy="15.4" r="2.1" />
    </Svg>
  );
}
