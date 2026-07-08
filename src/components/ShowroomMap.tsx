import { SHOWROOM_MAP } from "@/lib/maps";

type ShowroomMapProps = {
  compact?: boolean;
  className?: string;
};

function classes(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function ShowroomMap({ compact = false, className }: ShowroomMapProps) {
  return (
    <div
      className={classes(
        "relative isolate overflow-hidden rounded-[28px] bg-shell/60",
        compact ? "h-64" : "h-[min(72svh,34rem)] min-h-80",
        className
      )}
      aria-label="AU Mosaic showroom map"
    >
      <iframe
        title="Map to AU Mosaic showroom"
        src={SHOWROOM_MAP.embedSrc}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.18] opacity-75 grayscale-[0.62] saturate-[0.38] contrast-[0.88] brightness-[0.94]"
        style={{ border: 0 }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sand/0 via-sand/20 to-sand/70" />
      <div className="glass absolute inset-x-4 bottom-4 flex flex-col gap-4 rounded-[24px] px-4 py-4 sm:inset-x-5 sm:bottom-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-[14px] font-semibold text-ink">{SHOWROOM_MAP.mapName}</p>
          <p className="mt-0.5 text-[14px] leading-relaxed text-dusk">{SHOWROOM_MAP.address}</p>
        </div>
        <a
          href={SHOWROOM_MAP.directionsUrl}
          target="_blank"
          rel="noopener"
          className="link-hair shrink-0 text-ink"
        >
          Directions
        </a>
      </div>
    </div>
  );
}
