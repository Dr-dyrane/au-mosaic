# The Studio Visualizer

A build plan for turning the visualizer from a flat overlay into a studio
surface tool: drop in any room photo and see a real AU Mosaic piece laid
onto the wall, floor, or pool, with perspective, odd shapes, and
obstructions all handled. Roomvo class, built for a business that sells
the actual tile.

Source of the brief: Nonso's review, 2026-07-08 (voice note, transcribed
and summarised). The audit of his complaints sits in the section below.

## Status, 2026-07-09: the reconstruction, four phases live

The rebuild promised below happened in one owner-directed day: four
phases, each implemented by agents from a traced spec, adversarially
reviewed, gated, proven live in the browser against real vendors, and
pushed. Evidence lives in docs/QA.md; the story is in the handshake.

- Phase 1 (b4b12bd): every surface layer owns its SAM mask, so adding
  or selecting a surface appends instead of replacing. A new photo
  resets the desk.
- Phase 2 (a3e98fa): the fit engine, pure TypeScript in fit.ts. Walls
  take Hough boundary lines intersected into a quad; pools and floors
  keep the plane-basis fit, because a floor's outline is not its plane;
  occluded shapes clip instead of guessing. Node-tested.
- Phase 3 (4e98d85): segmentation moved to fal SAM 3 at a flat half
  cent per request through the queue API, behind a provider seam with
  an env hatch back to SAM 2. One limiter module plus a durable daily
  spend cap on Upstash. Tap points are validated against the image's
  true size before money moves.
- Phase 4 (700b3e2): the scene scan and the guided session behind
  NEXT_PUBLIC_VIZ_SCAN. One Haiku glance names the scene and its
  surfaces; Tile it walks them in sequence, each mask landing in its
  own layer. Off in the template until the owner demos on a real phone.

Stage 2b below is therefore shipped, in served form, and stage 1's
extent-and-occlusion decoupling is superseded by per-layer SAM masks:
the mask is the extent and the occlusion in one.

## The horizon, 2026-07-09: the owner set a rule

The owner's imagination must never be the ceiling. The strongest
existing-technology variant gets proposed unprompted at every phase
close, and the agreed forward order is:

1. Phase 4b, the pool shell. One layer holding faces that share corner
   points: rim p0 to p3, floor p4 to p7, walls joining them. Seams
   meet perfectly by construction, eight stones instead of sixteen, and
   the one-layer-per-kind constraint dissolves inside the group. The
   first slice ships hand-draggable shells with no AI; the derivation
   from the basin mask and its interior creases lands second. Tile
   courses break at internal corners on purpose; real tilers do the
   same, so per-face homographies with shared edges are the honest
   model.
2. Phase 4c, the depth oracle. Depth Anything V2 small in the browser
   (about 50MB once, under 200ms on WebGPU): automatic plane
   orientation inside any SAM mask, true occlusion ordering from
   nearness, and the shell's eight points derived from one photo. Zero
   cost per session. This is stage 3 below, now with a proven home.
3. Phase 4d, text-driven masks and the waterline. SAM 3 text prompts
   ("every wall", "the pool waterline") end the need for tap points and
   open the waterline band as its own face: a mosaic-house signature
   and an upsell chip.
4. Phase 4e, light that belongs to the photo. Transfer the photo's own
   local luminance onto the laid tiles, pure canvas math, SKU-exact by
   construction. Stage 4's deterministic half; any generative
   harmonisation stays an owner decision after seeing this one.
5. Phase 5, the numbers-gated review, now judging shell coherence and
   depth consistency instead of four disconnected quads. The
   corner-drag user lock rides here.
6. Phase 6, owner gates: the True light finisher and the WhatsApp
   backstop, send us your photo and we prepare it within a day.
7. Parked, named: live AR placement. iPhones take the USDZ Quick Look
   export path when this wakes.

Hard-photo testing (curved pools, low-contrast walls, busy kitchens,
furniture crossing the surface) rides every phase's device pass rather
than standing as its own errand.

## Status, 2026-07-08: the hand tools were pulled

Stages 1 and 2a (the paint-surface, paint-out, and magic-wand tools)
shipped, then came back off the live site the same day on the owner's
call: the mode toggle plus tap-versus-drag plus strength slider asked too
much, and the colour-based wand is least reliable on a plain wall, its
best case. The public visualizer is back to the known-good flow: it finds
the surface on load, and the four brass corners drag to fit. The
direction below still stands; the rebuild of obstruction-hiding and the
learned model will be simpler, guided in plain words, and tested on a
real device before it returns.

## The fidelity law (locked)

We sell the tile, so the render must show the tile the customer buys.
When someone picks small-seed-gold, the image shows small-seed-gold, not
a plausible gold mosaic an image model invented.

So the spine stays geometric: warp the real tile texture. AI is the
assistant, never the painter. It may find the surface, read the
geometry, and relight the result. It may not decide what the mosaic
looks like. Any generative step is harmonisation of a real texture, not
generation of a fake one.

This law is what makes the tool honest for a materials seller. Guard it
in every stage.

## What Nonso is actually asking for

Every complaint is a symptom of one gap: today the mosaic is painted onto
the photo, not installed in it.

1. Not realistic. The compositing is client-side canvas only. A multiply
   tint follows the wall shading, so it reads as a filter, not real tiles
   with grout, shadow, and lighting.
2. Obstructions get covered. The mosaic clips to a rectangle and paints
   over everything inside it, including the light and the chair that sit
   in front of the wall. There is no foreground masking.
3. Find the surface is inaccurate. Detection is an edge-strength
   heuristic that fits a rectangle to the strongest gradients. It does
   not know what a wall is, so in a furnished room it lands off.
4. No hand control. The only control is dragging four corners. He wants
   to paint the exact area with his hand.
5. Fuse it, then preview. He wants the mosaic fused into the wall as a
   believable photo, and a preview of that before download. We shipped
   the preview and download split, but it previews the overlay, which is
   not the thing worth previewing yet.

Points 2 and 3 are defects in the current approach. Points 1, 4, and 5
are one direction change: from overlay to a masked, geometry-aware,
relit composite of the real tile.

## The pipeline

The finished flow, in order:

1. Mask the surface. Which pixels are the wall or floor, any shape.
2. Read the geometry. Per-pixel orientation, so tiles recede and bend
   correctly, including a wall that deviates or turns.
3. Warp the real tiles along that geometry.
4. Cut out the foreground, so obstructions stay in front.
5. Relight to match the room, so it reads as installed.
6. Preview the real composite, then download.

## The stages

Each stage ships on its own and earns its keep. We do not need the whole
pipeline before the desk feels the difference.

### Stage 1: hand mastery, no AI

The decoupling that unlocks everything. Today one rectangle carries three
jobs at once. Split them:

- Perspective. Keep a four-point frame. It drives the homography and how
  tiles recede. This is the existing `quad`.
- Extent. A freeform painted region for where the surface actually is.
  Any shape, so a cut-off wall or an L-return works. A coplanar deviation
  (a wall that steps but stays flat) is fully handled here.
- Occlusion. A paint-out region for what sits in front. Subtracted from
  the extent so the light and the chair are never covered.

The mosaic is warped across the perspective frame as it is now, but shown
only through (extent minus occlusion) instead of clipped to the
rectangle. This reuses the warp and the homography untouched;
`pointInQuad` already handles arbitrary polygons.

What it adds for the desk: a polygon and a brush. Tap to drop surface
points, drag to paint, a second brush to paint out obstructions.

Acceptance:

- A wall with a cut-off corner tiles correctly, the mosaic following the
  true edge, not a forced rectangle.
- A lamp or chair in front of the wall stays in front.
- No auto-detect needed; the hand is enough.
- Fully offline. No model, no network.

Code touched: `types.ts` (add `extent` and `occlude` to `SurfaceLayer`),
`draw.ts` (composite through the mask, not the quad clip), the stage UI
in the orchestrator and a new brush part. `detect.ts` stays as an
optional first guess.

### Stage 2a: magic-wand tap-to-select (shipped, no model)

The first assisted pass needs no model at all. A tap grows a region of
colour-alike pixels out from the point, a classic region grow on the
untouched photo, traces its outline, and hands it to the surface or the
paint-out. Tap the wall to find it, tap the chair to paint it out, then
refine by hand. A strength slider widens or tightens the grab. It runs
in the browser, offline, with no dependency and no download. It answers
find the surface for plain walls and floors; textured or patterned walls
are where the learned model earns its place.

Shipped: `src/components/visualizer/magicwand.ts` (floodSelect,
traceMaskOutline, maskToPolygon), wired into the paint tools as a tap
versus a drag, verified by a node check of the pure functions on a
rectangle, a concave L, and a two-colour split.

### Stage 2b: learned segmentation (later, needs the real env)

For any photo, including textured walls, add a small segmentation model
(SAM family, MobileSAM class) via ONNX in the browser, so one tap
proposes a pixel-precise surface or occlusion that the hand refines.
This is a dependency plus a first-use model download, and it cannot be
verified in the build sandbox (no browser, no model fetch), so it is
built and tested on a device or a preview deploy, opt-in, always falling
back to 2a and the hand tools.

Acceptance: on ten varied room photos, one tap plus light refinement
gives a clean surface and foreground mask in a few seconds, and the
manual tools still work when the model is off or still loading.

### Stage 3: real geometry

Add monocular depth and surface normals (Depth Anything class). Per-pixel
orientation drives the warp: perspective-correct grout scale, tiles that
shrink with distance, surfaces that bend out of plane. This is what
handles the deviation Nonso described without ever enumerating a single
junction; the normals turn and the texture follows.

Acceptance: a curved or angled wall shows tiles that follow the bend, and
grout that scales with depth rather than staying uniform.

### Stage 4: realism pass

Sell the install. Transfer the room's shading and add contact shadows and
grout ambient occlusion onto the tiles from the depth and light estimate.
Optionally a light generative harmonisation pass, low strength, to marry
edges and lighting. It refines a real texture; it never repaints the
mosaic. Then the preview shows the real composite.

Acceptance: a side by side of photo and render reads as the same room with
the tiles installed, and the tile colour still matches the SKU swatch.

## Compute and infra (open decision)

Stages 2 to 4 need models. Two homes:

- In browser, via ONNX or WASM. Zero per-render cost, works offline once
  loaded, private. But the model download is tens to over a hundred MB and
  inference is slow on cheap phones, which is much of the Lagos audience.
- A small served endpoint with a GPU. Snappy and centralised, extends the
  visualizer AI endpoint we already rate-limit and budget. Costs per
  render and needs the network.

Recommendation: run the AI stages on a served endpoint, and keep stage 1
as a fully manual, fully offline fallback so a cheap phone with no signal
still gets a real result by hand. Realism when online, dignity when not.
This mirrors the field-kit ethos already in the app. Owner's call.

## Code map

Reused as is: `geometry.ts` homography and point tests, the warp loop in
`draw.ts`, the palette editor, the preview and download split, the layer
model, the camera and persisted-controls hooks.

Changed or added: `types.ts` grows `extent` and `occlude` per layer;
`draw.ts` composites through the mask; a brush part and stage UI arrive in
the orchestrator; `detect.ts` demotes to an optional first guess; stages 2
to 4 add a masking service, a geometry service, and a relight step behind
a clean interface so the home (browser or server) can change without
touching the pipeline.

## Coordination with CODEX

The visualizer is shared ground. Before stage 1 code lands, claim the
studio-visualizer lane in AGENT-HANDSHAKE.md, work from the latest
origin, gate with tsc and eslint and the dash and arrow scan, and
object-push only our own files with the origin guard. No moving the
shared quad model without a note in the handshake, since CODEX also
touches these files.

## Open decisions

1. Resolved 2026-07-09: served endpoint for segmentation (fal SAM 3
   over the queue, metered and capped), the hand as the offline floor.
   Depth runs in the browser when Phase 4c lands, since its model is
   small enough and its per-session cost is zero.
2. Resolved 2026-07-09: SAM 3 for masks, Depth Anything V2 small for
   depth, claude-haiku-4-5 for the scene read.
3. Whether the realism pass uses a generative harmonisation step at
   all, or stays fully deterministic. Owner decides in Phase 6 after
   seeing the deterministic light transfer of Phase 4e.

## The careful order

Ship stage 1 first. It resolves the two defects and the hand-control ask
with no model, no cost, and no network, and it proves the decoupling. Then
add the models stage by stage, each one gated and each one useful the day
it lands.

## The deploy blueprint (2026-07-10, from the foresight design panel)

A read-only multi-agent design panel foresaw the whole studio deploy and
synthesized this sequenced plan. It is the master map for the remaining
lanes. One invariant composes it all: the mask answers WHERE, depth
answers HOW IT SITS and WHAT IS IN FRONT, the fit engine is the
guaranteed floor, the snap layer makes failure legible, and the studio
UI is the shell that holds it. Confidence is the currency traded between
them. The fidelity law is the boundary every layer respects: find, read,
relight, warp the real tile, never invent the mosaic.

### The deployed studio, as the customer meets it

Full-bleed studio, the stage the hero across every width, held in a 26px
squircle in the page gutter. Upload or shoot. A quiet Haiku scan reads
the scene and offers Tile it. One tap walks the surface: a flat wall
finds one clean shape; a pool finds each face on its own (left, back,
right wall, floor), one clean SAM cut per face, so the basin reads as a
real box with seams that meet by construction. Depth reads how each
plane sits and carves out anything standing in front (a ladder, a chair,
a person) so the tile falls behind it. Eight brass stones land labelled
1 to 8 (1 to 4 flat), left to right; a dragged stone leans into the
nearest real corner the image offers and snaps home. If a fit flattens,
the stones reposition to a sane on-surface default and say so. Refine
discloses one decision at a time (Surface, Colourway, Finish, Depth),
phone and desktop alike. Tools read as drawn icons with one-word labels,
gold when active; on the phone the tool rail is a floating glass
capsule, icons only at rest. The one loud thing is the gold Send capsule
to WhatsApp with the look attached.

### The lanes, in build order

Each is its own handshake lane with a live proof and a flag. They
collide on Visualizer.tsx, useSamAutofind.ts, Stage.tsx, and draw.ts, so
they serialize; the order is chosen so each builds on finished data.

- L0a Close the depth oracle lane (4c slice 1). DONE at this writing.
- L0b Close the open RefinePanel disclosure lane, releasing RefinePanel
  and the exposedRefinement assemblies for the studio UI. DONE
  2026-07-10: the disclosure work shipped at 269a7c8, so the lane is a
  stale claim now marked done; the studio UI touches RefinePanel
  additively only.
- L1 Types and fit-engine export foundation, one additive commit:
  types.ts gains faceMasks, ShellFaceId, the scan shape and faces types,
  CornerCandidate, SnapState; fitQuad widens exports; constants gains the
  snap, flatten, and RANSAC thresholds.
- L2 Server meta tag and segment prompt (dark): visualizer-ai.ts scan
  returns shape (single_surface or shell) and an enumerated faces array
  with per-face tap and text prompt; the segment route forwards the SAM 3
  text prompt it currently drops.
- L3 Pure geometry modules with node tests: shellFaceFit (reconcile 8
  shared points from 4 masks), samMaskClient (extract submit/poll/alpha
  from useSamAutofind for the 500-line law), fitRecover (isFlatFit, sane
  defaults, assignStoneNumbers), cornerCandidates, depthPlane (fitPlane,
  planeQuad, carveOcclusion), depthShell.
- L4 Per-face mask backbone (flag NEXT_PUBLIC_VIZ_FACES): one SAM call
  per enumerated face into a faceMasks map, sequential and cap-aware
  (keep the faces landed if the cap trips); draw.ts uses each face's own
  mask; the guided walk branches on shape. This retires the ambiguous
  single-shell mask and the soft crease derivation. It also solves the
  CORNER-CORRESPONDENCE problem the owner named (2026-07-10): when one
  shell mask returns and the fit flattens, the corners scatter and
  nothing says which point belongs to which side. Per-face masks make
  each corner's side unambiguous by construction, because the left-wall
  mask's corners ARE the left wall's corners. shellFaceFit reconciles
  the eight shared points from the four masks, so every point knows its
  side before the hand ever touches it.
- L5 Depth geometry (flag NEXT_PUBLIC_VIZ_DEPTH): RANSAC plane fit from
  the depth map inside a mask gives a face its perspective quad where it
  beats the fit engine; carveOcclusion subtracts nearer-than-plane pixels
  before the mask reaches state; depthShell intersects wall planes with
  the floor plane for eight coherent points. A higher-authority parallel
  path chosen by confidence, never a rewrite. Over any plane inverse
  depth is affine in image coordinates, and Depth Anything's unknown
  global affine preserves affineness, so planarity needs no camera
  intrinsics; planeQuad assumes a centre principal point and a focal near
  0.9x the long edge, correctable by hand.
- L6 Numbered snap points (flag NEXT_PUBLIC_VIZ_SNAP): on clip or
  isFlatFit or a null derivation, fitRecover repositions and marks
  recovered; stones render numbers 1-8 (4 flat) and magnet to candidate
  corners (Hough, contour, extremes, creases, and depth corners) with a
  snap radius, reduced motion respected. The NUMBER IS THE CORNER'S
  IDENTITY, not decoration (owner insight, 2026-07-10): at the moment a
  mask returns, each reconciled point is assigned its side by its angle
  around the centroid (tl, tr, br, bl per face) and numbered left to
  right, so both the auto-alignment and the hand know which stone is
  which side even when the raw fit flattened. assignStoneNumbers writes
  that identity; the geometry routes each point to its edge by it. L4
  supplies the per-face correspondence, L6 makes it legible and
  draggable; together they end the flattened-scatter confusion.
- L7 Studio full-bleed layout and the icon module: drop the page
  max-width so the stage eats width; a visualizer/icons.tsx mirroring the
  back office (viewBox 24, stroke currentColor 1.6), re-exporting the
  five shared verbs.
- L8 ToolRail, chrome swap, mobile refine sheet: a ToolRail part
  replaces the button wall, gold Send loud, the rest quiet; the phone
  rail is icons at rest with the active tool's word; a Refine tool opens
  the sheet rendering the real RefinePanel.

### Owner decisions on the blueprint (recommendation each)

1. Render-clamp bump for full-bleed sharpness (fidelity-adjacent):
   raise the render clamp to track displayed width times device pixel
   ratio, capped near 2200, eye-gated on a phone and a wide monitor.
2. The per-face cost multiplier: a pool shell is up to four SAM submits
   against the shared daily cap; request only enumerated faces, keep
   partial results on a cap trip, and consider a per-session soft cap.
3. The depth model download on metered mobile (50 to 100MB once): keep
   depth lazy and dark until the owner accepts the one-time cost on a
   real phone; self-host to Blob later.
4. Assumed camera intrinsics: ship the assumption, treat it as graceful,
   revisit only if foreshortening reads wrong on the owner's phone.
5. Flag proliferation: keep VIZ_SCAN, VIZ_FACES, VIZ_SNAP, VIZ_DEPTH
   separate through the per-piece phone demos, then collapse the three
   new ones into one NEXT_PUBLIC_VIZ_STUDIO flag at launch.
6. The RefineSection icon slot and lifting shared icons to a top-level
   module both touch other hands' files; propose additively in the
   handshake, land inside or after those lanes, never unilaterally.
