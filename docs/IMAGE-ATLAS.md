# The Image Atlas — a home for every frame

228 frames exist. This gives each one a place, at the right layer, without
breaking the maison quality bar. It extends `docs/client/PRODUCT-IMAGE-LEDGER.md`
and obeys `docs/DESIGN.md`. The one door for public media stays
`src/lib/images.ts`: drop → eye-gate → process to `.jpg` → wire. Raw generator
drops never ship raw.

## The promise, said plainly

"Use everything" does not mean ship everything. It means no frame is orphaned:
each has a defined home, and the home is honest about the frame's quality and
job. A contact sheet is not a hero. A pre-processing master is not a second
card. But both have a place, and both stay findable.

## The census (228)

- **97 shipped `.jpg`** — already live across the site, and (once the backfill
  runs) in the Photos room. Home: public.
- **1 logo mark** — brand chrome.
- **130 raw `.png` drops**, kept local:
  - **9 contact / review sheets** → admin review sheets.
  - **~36 masters** — the hi-res `.png` source of a frame we already ship →
    provenance behind that frame.
  - **~85 distinct compositions** not yet shipped (70 in the ledger + 15 in the
    brand batches) → new public surfaces, one eye-gate at a time.

  (The master-vs-distinct split is a first-pass estimate; the eye-gate settles
  each frame as we reach it.)

## The four homes

1. **Public scene** — shipped, eye-gated, wired through `images.ts`. The bar is
   the flagship's: sharp, on-palette, earns its place.
2. **Review sheet** — admin only, `contact_sheet` role. The QA surface, never
   public.
3. **Master / provenance** — the hi-res original linked to its shipped frame,
   for zoom, reprint, or record. Findable, not a duplicate card.
4. **Archive** — kept, not shown. Weak or superseded takes. `archived` status,
   never a delete.

## New rooms for the ~85 distinct frames (the imaginative part)

Each is a real surface the platform can carry, and each earns its imagery from
a set we already generated:

- **Rooted in Lagos** — `brand-batch-lagos` (6). A heritage thread tied to the
  Oba house: the local identity, majesty not gulf pastiche. Enriches About, or
  a standalone journal feature, or a section on the home cinema.
- **The Atelier** — `brand-batch-01` (5, the Renaissance / Palazzo scenes). The
  maison's craft-grandeur story: a lookbook or the About heritage band.
- **Interiors & room examples** — `brand-batch-02` (4) + the ledger interiors.
  Applied-scene proof on product pages, and a gallery of "in a real room."
- **How we work** — the ledger's process and sample scenes (sample library,
  quote counter, sample trays, consultation, pool colour families). The
  pools / consultation flow, and a "how we work" page.
- **The portfolio** — applied scenes as `projects/[slug]` case studies.

Every new frame walks the same road: drop → eye-gate → process to `.jpg` →
wire through `images.ts` → owner gate. No shortcuts, no raw drops in public.

## The sequence (one step at a time)

- **Phase 0 — built, awaiting your run.** The 97 shipped frames → the Photos
  room, via `scripts/media-backfill.ts` (`npx tsx …`, needs `DATABASE_URL`).
- **Phase 1 — this document.** The map.
- **Phase 2 — admin homes (built, awaiting your run).**
  `scripts/media-raw-import.ts` uploads all 130 raw drops to Vercel Blob — they
  are gitignored, so local paths would 404 in production — and registers them
  non-public: **55 archived** (11 review sheets + 44 masters) and **75 draft**
  candidates. Dedups against batch-08. Needs `DATABASE_URL` +
  `BLOB_READ_WRITE_TOKEN`. After this, every one of the 228 frames has a row in
  the Photos room.
- **Phase 3 — public surfaces, one at a time.** Build the new rooms for the
  distinct frames. Each is eye-gated frame by frame and owner-gated as a
  surface. Order is the owner's call; a natural first is **Rooted in Lagos**
  (tight set, strong brand fit, one page).

## Guardrails (unchanged)

- `images.ts` stays the one door; raw drops never ship raw.
- Every new surface obeys `DESIGN.md`: concentric geometry, two suns, the six
  houses, one gold action, no borders.
- Eye-gate every frame; owner-gate every surface.
- Nothing is deleted. Archive is a status, not a trash can.
- The Photos room becomes the single source of truth: every frame, whatever
  its home, has a row there.
