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
    <div className={classes("panel overflow-hidden p-0", className)}>
      <div className={classes("relative bg-sand/35", compact ? "h-44" : "h-72")}>
        <iframe
          title="OpenStreetMap near AU Mosaic showroom"
          src={SHOWROOM_MAP.embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full"
          style={{ border: 0 }}
        />
      </div>
      <div className="p-5">
        <p className="eyebrow">Open map</p>
        <h3 className="font-serif mt-3 text-[20px] leading-tight">{SHOWROOM_MAP.label}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-dusk">{SHOWROOM_MAP.note}</p>
        <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3">
          <a href={SHOWROOM_MAP.openUrl} target="_blank" rel="noopener" className="link-hair text-dusk">
            Open map
          </a>
          <a href={SHOWROOM_MAP.directionsUrl} target="_blank" rel="noopener" className="link-hair text-dusk">
            Directions
          </a>
        </div>
      </div>
    </div>
  );
}
