# The Studio Visualizer

A build plan for turning the visualizer from a flat overlay into a studio
surface tool: drop in any room photo and see a real AU Mosaic piece laid
onto the wall, floor, or pool, with perspective, odd shapes, and
obstructions all handled. Roomvo class, built for a business that sells
the actual tile.

Source of the brief: Nonso's review, 2026-07-08 (voice note, transcribed
and summarised). The audit of his complaints sits in the section below.

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

1. Compute home for the AI stages: browser or served endpoint. Leaning
   served, with manual stage 1 offline as the floor.
2. Segmentation and depth model choices, once the home is set.
3. Whether stage 4 uses a generative harmonisation pass at all, or stays
   fully deterministic. Decide after seeing stage 3 output.

## The careful order

Ship stage 1 first. It resolves the two defects and the hand-control ask
with no model, no cost, and no network, and it proves the decoupling. Then
add the models stage by stage, each one gated and each one useful the day
it lands.
