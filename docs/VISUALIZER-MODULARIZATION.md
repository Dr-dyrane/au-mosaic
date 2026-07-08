# Visualizer modularization audit

The visualizer is becoming a major feature. Today it is one file,
`src/components/Visualizer.tsx`, about 1,866 lines: pure geometry, canvas
drawing, surface detection, constants, types, and a ~1,230 line client
component holding roughly 40 state and ref hooks, 30 callbacks, 5 effects,
and a dozen JSX blocks. A file this size is hard to test, review, and
extend, and every edit risks the render pipeline. This plan breaks it into
small, single responsibility modules WITHOUT changing behaviour.

## What is in the file today (module scope, lines 24 to 635)

- Types (24 to 52): `Pt`, `SurfaceId`, `LoadSource`, `PrepMode`,
  `Homography`, `SnapResult`, `PendingSnap`, `SurfaceLayer`.
- Geometry, pure math, no DOM: `homography`, `mapPoint`, `clamp`,
  `pointInQuad`, `quadArea`, `isValidQuad`, `quadDelta`, `setCorner`.
- Canvas drawing: `drawTriangle`, `makePattern`, `clipQuad`,
  `sampleQuadColor`, `drawBlurredPhoto`, `drawSource`, `drawSurfaceLayer`.
- Detection: `detectSurfaceFrame`, `detectSurfaceQuad`.
- Constants: the starter quads, `SURFACES`, `CONTEXTS`, `QUICK_SURFACES`,
  `DEFAULT_PIECE`, `STORE_KEY`, `CORNER_LABELS`, `MIN_QUAD_AREA`,
  `FIRST_LAYER_ID`, `LAYER_LABELS`, `PREFERRED_PIECES`, `NEXT_SURFACE`.
- Helpers: `buzz`, `pieceSlugForSurface`, `suggestionText`,
  `shouldKeepCurrentFit`, `readStore`.

The component (636 to end): state and refs; callbacks (`loadImage`,
camera, layer management, `render`, corner drag, `share` and `download`,
the palette editor); effects (initial load, camera stream, cleanups,
localStorage persist, the render animation frame); and JSX consts
(`layerChips`, `starterSurfaceOptions`, `surfaceOptions`, `contextOptions`,
`pieceOptions`, `paletteEditor`, `lightOptions`, `refineControls`,
`mobileRefineSnippets`, `exposedRefinement`, `stage`) plus the returned
shell and two dialogs.

## Target shape

```
src/components/visualizer/
  Visualizer.tsx        orchestrator: owns state, wires hooks and parts
  types.ts
  constants.ts
  lib/geometry.ts       pure, no DOM or React
  lib/draw.ts           canvas 2D drawing
  lib/detect.ts         surface auto detection
  lib/store.ts          readStore and persist
  lib/helpers.ts        buzz, pieceSlugForSurface, suggestionText, shouldKeepCurrentFit
  hooks/useSurfaceLayers.ts
  hooks/useCamera.ts
  hooks/useCanvasRender.ts
  hooks/usePersistedControls.ts
  parts/Stage.tsx           canvas, corner SVG, loupe
  parts/PaletteEditor.tsx
  parts/PieceOptions.tsx
  parts/SurfaceOptions.tsx
  parts/ContextOptions.tsx
  parts/LightOptions.tsx
  parts/LayerChips.tsx
  parts/StarterSurface.tsx
  parts/RefinePanel.tsx     refineControls, mobile snippets, exposed aside
  parts/CameraDialog.tsx
```

The page imports `@/components/Visualizer`. Keep that path working by
leaving the orchestrator at that name, or by re-exporting it from the
folder, so nothing outside the visualizer changes.

## Safety strategy

- Behaviour preserving: only move code and add imports or props. No logic
  edits. No change to the public prop API (`initialPiece`, `pieces`), the
  render math, the effect dependency arrays, or the memoization cascade
  that makes a control change repaint the canvas.
- One phase per commit; `tsc --noEmit` and `eslint --max-warnings=0` after
  each; coordinated with CODEX, who is active in the tree.
- A manual smoke test after Phases 2 and 3: load a photo, auto fit, drag a
  corner, swap a piece, edit the palette, open the camera, share and
  download.
- Everything extracted stays a client module; the whole feature is client
  already.

## Phases, ordered by risk

### Phase 1, pure leaves. Near zero risk, biggest cut.
Move types, constants, geometry, draw, detect, store, and helpers into
their modules; the component imports them. React is untouched. Removes
about 600 lines from the file. Verified by tsc (the types line up) and by
the math being byte identical.

### Phase 2, presentational parts. Medium risk.
Extract the JSX blocks into stateless components that receive props and
callbacks (`Stage`, `PaletteEditor`, the option rows, `RefinePanel`,
`CameraDialog`). Removes another 400 to 500 lines. Care: prop wiring, and
keep handlers by reference. Verified by tsc and the smoke test.

### Phase 3, hooks. Highest risk, optional, last.
Lift the stateful clusters into hooks: `useSurfaceLayers`, `useCamera`,
`useCanvasRender`, `usePersistedControls`. Leaves `Visualizer.tsx` a
roughly 250 line orchestrator. Trickiest part: preserve the exact effect
dependencies and the render cascade. Verified by tsc, a full smoke test,
and an independent review.

## Recommendation

Do Phase 1 now: safe, high value, and it unlocks the rest. Gate and ship,
then Phase 2. Treat Phase 3 as optional polish once the first passes land
clean.
