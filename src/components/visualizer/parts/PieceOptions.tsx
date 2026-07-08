"use client";

import type { Piece } from "@/lib/products";

interface Props {
  pieces: Piece[];
  pieceSlug: string;
  onPick: (slug: string) => void;
}

export default function PieceOptions({ pieces, pieceSlug, onPick }: Props) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 py-3 sm:-mx-2 sm:px-2">
      {pieces.map((p) => (
        <button
          key={p.slug}
          onClick={() => onPick(p.slug)}
          aria-pressed={p.slug === pieceSlug}
          title={p.name}
          className={`flex h-12 shrink-0 items-center gap-2 rounded-full px-4 transition-all duration-300 active:scale-95 ${
            p.slug === pieceSlug ? "scale-[1.04] bg-shell text-ink shadow-lift" : "bg-shell/40 text-dusk hover:bg-shell/60"
          }`}
        >
          <span className="flex gap-0.5">
            {(p.colors || []).slice(0, 4).map((c, i) => (
              <span key={`${c}-${i}`} className="h-4 w-4 rounded-[4px]" style={{ background: c }} />
            ))}
          </span>
          <span className="whitespace-nowrap text-[12px] font-semibold">{p.name}</span>
        </button>
      ))}
    </div>
  );
}
