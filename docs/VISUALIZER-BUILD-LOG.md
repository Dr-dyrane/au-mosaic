# The Visualizer Build Log

The running record of the studio visualizer rebuild: what shipped, what
we learned, and what is next. Read this first when you pick up the
visualizer. The other visualizer docs each hold one slice of the truth;
this one ties them together.

- `docs/VISUALIZER-STUDIO.md` is the vision and the horizon (where we
  are going, and the owner's standing rules).
- `docs/QA.md` is the evidence ledger (proof per pass, never rewritten).
- `docs/AGENT-HANDSHAKE.md` is the lane channel (who holds which files
  right now).
- `docs/VISUALIZER-MODULARIZATION.md` is the file-structure plan.
- This log is the journey plus the lessons plus the plan.

## How we work (the harness and the doctrine)

Every substantive change runs the same loop, and the loop is the point.

1. Claim a lane in the handshake, pin a rollback commit.
2. Implement from a surgical spec that cites the exact files and lines,
   run by a subagent so the main context stays lean.
3. An adversarial reviewer hunts the change before the gates do, with a
   fix round if needed. This has paid for itself in nearly every lane.
4. Gate: `npx tsc --noEmit`, `npx eslint src tests --max-warnings=0`,
   `npm run test`, `npx next build`, the dash and en-dash scan, and the
   modularity budget (no visualizer file above ~500 lines).
5. Prove it live in the browser harness. Code that compiles is not code
   that works; drive the real flow and watch it. Screenshots and
   network traces are the proof, and every phase re-runs the earlier
   proofs as regression.
6. Ledger the evidence in QA.md, close the lane, one story commit,
   push. Then a horizon note: propose the strongest existing-technology
   variant beyond the current plan, unprompted.

The test harness: `.claude/launch.json` runs the dev server; the browser
tools drive `/visualizer`. The stage's pointer handler lives on the SVG
overlay `svg[aria-describedby="viz-corner-help"]`; synthetic pointer
events do not reach it, so taps go through a real click on that
selector. With the shell on, the eight stones can sit under the click
center, so a center click may start a drag instead of the finder; tap
open water or use the guided walk's programmatic tap.

Owner rules that bind every session:
- No em dashes or en dashes anywhere. Apple-terse copy.
- The fidelity law: the render shows the exact tile the customer buys.
  AI may find, read, and relight; it may never paint the mosaic.
- New auto-magic ships flag-gated and meets the owner's eye on a real
  phone before it goes public. Two features were rolled back same-day
  for shipping unrequested magic; a wrong guess is worse than no guess.
- The owner's imagination is not the ceiling. Propose the frontier.
- Keep the code aggressively modular; the feature cobwebs fast.
- Dependencies are the owner's decision.

## What is done

Read newest first. Each entry: commit, outcome, lesson.

### Phase 4c slice 1 (in flight) - depth oracle base case
Lane open at `7187552`. The flagship's first runtime ML dependency
(transformers.js), Depth Anything V2 small in a Web Worker, flag-gated
behind NEXT_PUBLIC_VIZ_DEPTH, proving only that a sane depth map
computes in this Turbopack app without breaking the build. No geometry
consumes depth yet.

### Phase 4b slice 2 - `e76f45c` - the shell reads its own floor
shellFit.ts derives the basin floor from interior crease lines (erode
the mask, Sobel the luma inside it, Hough, gate on inside-rim and area
and coverage, null-safe). Wired to fire when a pool wears its shell,
and the guided walk auto-shells the pool. Nine node tests.
**Lesson, recorded honestly**: the auto-shell and the graceful fallback
were proven live, but a successful live derivation was NOT witnessed on
the rendered starter photos; their floor creases are too soft for the
conservative confidence floor, and one mask for the whole shell is
geometrically ambiguous. This is what pointed at the per-face-mask
architecture (see the plan). Also learned: a test can pass without
proving the invariant it names; the inside-rim filter had no
load-bearing test until one was added and verified by removing the
filter and watching only it fail.

### Phase 4b slice 1 - `0a9a0c1` - the pool becomes a shell
One pool layer became a connected box: the rim stays the quad, four
floor points join it, and shared-vertex faces mean seams cannot gape.
Eight stones drag the box; the one SAM mask clips every face. In the
same lane the modularity budget was paid down: the orchestrator fell
from ~1100 to 689 lines (Stage.tsx, usePhotoDesk, useShareDownload
extracted), and fit.ts split into fitMask.ts and fitQuad.ts with the
untouched fit suite as the API-preservation proof.
**Lesson**: fold the modularity paydown into the feature lane, not a
later cleanup. The review caught each face's finish veils washing the
basin five times; per-face mask cuts fixed it. The live reload proof
caught the shaped floor not persisting like the rim.

### Phase 4 - `700b3e2` - the house learns to see
One Haiku glance (claude-haiku-4-5, forced tool) names the scene and up
to five surfaces; the guided walk (behind NEXT_PUBLIC_VIZ_SCAN) walks
Tile it across them, each mask landing in its own layer.
**Lesson**: the scan first keyed on photo identity and would have
burned a metered call on every page view through the auto-loaded
sample; the review caught it, and it now keys on the load source. Cost
the owner nothing because the review ran before the proof.

### Phase 3 - `4e98d85` - the finder learns patience, the till counts
Segmentation moved to fal SAM 3 over the queue API at a flat half cent,
behind a provider seam (VISUALIZER_SAM_PROVIDER=sam2 escape hatch), with
one shared limiter and a durable daily spend cap on Upstash.
**Lesson**: four smoke calls settled the real schema first and caught
that SAM 3's prompt field defaults to the word "wheel", so tap-only use
must send an explicit empty string. The pixels decide the mask alpha,
not the server tag, so one guardian keeps the alpha invariant.

### Phase 2 - `a3e98fa` - the corners learn to look
fit.ts turns a mask into a quad: Hough boundary lines for walls, the
plane-basis fit for floors, clip for occluded shapes. Node-tested.
**Lesson**: the live proof caught Hough laying diagonal courses across
the pool basin, so the regime keys on surface kind, not just mask
solidity; a floor's outline is not its plane.

### Phase 1 - `b4b12bd` - every surface keeps its own shape
Each layer owns its SAM mask (maskSrc), committed and restored like the
quad. Adding or selecting a surface appends instead of replacing.
**Lesson**: the whole reconstruction turned on one shared React slot.
The root cause was traced and reproduced live before a line changed.

### Before the rebuild
`b50a84c` set the test-harness keys. `f2d1942` and earlier lifted the
orchestrator's clusters into hooks (the modularization lane). The
refine disclosure lane (`269a7c8`) is still open; it owns RefinePanel
and the exposedRefinement assemblies, so the studio UI lane must
coordinate with it.

## Lessons, consolidated

- **The review round earns its keep.** It caught the per-page-view scan
  burn, the diagonal pool courses, the veils washing the basin, the
  stranded shell on retag, and an unproven filter, each before a
  customer or the owner would have seen it. Keep it in every lane.
- **Live proof catches what tests cannot.** Coordinate-space drift,
  render regressions, persistence gaps, and cost leaks live in the wiring
  between correct units. Drive the real flow.
- **Report faithfully, especially the gaps.** Slice 2's honest "success
  not witnessed live" is worth more than a claimed win. The owner
  decides with the truth.
- **One mask for a whole shell is ambiguous.** Per-face masks are the
  cleaner architecture and were the owner's instinct from the first
  message ("four calls to fal").
- **Conservative is correct for auto-magic.** Declining a soft photo
  beats folding a wall at a line the water never drew.
- **Fold modularity into the feature lane.** Files cross 500 lines fast;
  extract as you go, verify moves verbatim with an untouched test suite.
- **Smoke the real vendor schema before wiring.** Two cents saved a
  baffling "wheel" default bug.

## Key facts

- Segmentation: fal SAM 3 (`fal-ai/sam-3/image` over the queue), flat
  ~$0.005; provider seam in `src/lib/visualizer-sam.ts`,
  VISUALIZER_SAM_PROVIDER=sam2 falls back to the old sync path.
- Vision: Claude Haiku 4.5 (`claude-haiku-4-5`), forced tool, in
  `src/lib/visualizer-ai.ts`.
- Geometry: pure TypeScript, no model, no cost (`fit.ts`, `fitMask.ts`,
  `fitQuad.ts`, `shell.ts`, `shellFit.ts`, `geometry.ts`).
- Depth (4c, in flight): Depth Anything V2 small via transformers.js in
  a worker, browser-side, zero per-session cost after the one download.
- Flags: NEXT_PUBLIC_VIZ_SCAN (guided scan), NEXT_PUBLIC_VIZ_DEPTH
  (depth preview). Both off in the template until the owner's phone
  demo; flip in Vercel to launch.
- Spend cap: Upstash daily counter `viz:spend:YYYY-MM-DD`, UTC.
- Tests: `tests/visualizer-{fit,shell,shellfit,scan,limits}.test.ts`,
  run by `npm run test`.

## The plan

The forward order, owner-approved, detail in `docs/VISUALIZER-STUDIO.md`
"The horizon" and in the deploy foresight the design panel is producing.

1. **4c depth oracle** (in flight, slice 1). Slice 2: RANSAC plane fit
   from depth replaces the crease guess, and gives true nearness
   occlusion.
2. **Per-face masks and the meta tag.** The Haiku scan returns a shape
   field (single surface vs shell) and enumerates faces; the
   orchestrator makes one SAM call per face (text or tap prompt), and
   each face fits to its own clean mask. This is what makes the shell
   derivation reliable.
3. **Numbered snap points.** When a fit flattens, reposition the stones
   to a sane default, label them 1 to 8 for a shell and 1 to 4 for a
   surface so they read left to right, and magnet them to corners
   detected in the image.
4. **Studio UI/UX.** Drop the page max-width for a full-bleed studio,
   custom tool icons like the backroom, succinct labels, mobile
   icon-first progressive disclosure. Coordinate with the open refine
   disclosure lane.
5. **Phase 5 review, Phase 6 owner gates** (light finisher, WhatsApp
   backstop), as in the horizon.

Update this log at every lane close: the entry, the lesson, and any
change to the plan.
