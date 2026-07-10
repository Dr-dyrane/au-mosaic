"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconClose } from "@/app/admin/(panel)/icons";
import { track } from "@vercel/analytics";
import { VISUALIZER_SAMPLE } from "@/lib/images";
import type { Piece } from "@/lib/products";
import type { Pt, SurfaceId, LoadSource, PrepMode, SurfaceLayer } from "./visualizer/types";
import {
  DEFAULT_QUAD,
  SAMPLE_POOL_QUAD,
  SURFACES,
  DEFAULT_PIECE,
  FIRST_LAYER_ID,
  LAYER_LABELS,
} from "./visualizer/constants";
import { drawSource, drawSurfaceLayer } from "./visualizer/draw";
import { buildShellFaces, defaultShellFloor } from "./visualizer/shell";
import { isValidQuad } from "./visualizer/geometry";
import { hydrateMask } from "./visualizer/maskCache";
import { buzz, readStore } from "./visualizer/helpers";
import PaletteEditor from "./visualizer/parts/PaletteEditor";
import PieceOptions from "./visualizer/parts/PieceOptions";
import SurfaceOptions from "./visualizer/parts/SurfaceOptions";
import ContextOptions from "./visualizer/parts/ContextOptions";
import StarterSurface from "./visualizer/parts/StarterSurface";
import LightOptions from "./visualizer/parts/LightOptions";
import LayerChips from "./visualizer/parts/LayerChips";
import RefinePanel from "./visualizer/parts/RefinePanel";
import CameraDialog from "./visualizer/parts/CameraDialog";
import ScanOffer from "./visualizer/parts/ScanOffer";
import Stage from "./visualizer/parts/Stage";
import { useObjectUrls } from "./visualizer/hooks/useObjectUrls";
import { usePersistedControls } from "./visualizer/hooks/usePersistedControls";
import { useSnapshots } from "./visualizer/hooks/useSnapshots";
import { useSamAutofind } from "./visualizer/hooks/useSamAutofind";
import { useCornerDrag } from "./visualizer/hooks/useCornerDrag";
import { useSurfaceLayers } from "./visualizer/hooks/useSurfaceLayers";
import { useSurfaceSession } from "./visualizer/hooks/useSurfaceSession";
import { usePhotoDesk } from "./visualizer/hooks/usePhotoDesk";
import { useShareDownload } from "./visualizer/hooks/useShareDownload";

/* The guided scan ships dark until the owner demos it on a real phone.
   NEXT_PUBLIC vars inline at build, so this is a constant. */
const scanFlag = process.env.NEXT_PUBLIC_VIZ_SCAN === "on";

export default function Visualizer({ initialPiece, pieces }: { initialPiece?: string; pieces: Piece[] }) {
  const startingPieceSlug = () => {
    if (pieces.some((p) => p.slug === initialPiece)) return initialPiece as string;
    const starter = pieces.find((p) => p.slug === DEFAULT_PIECE);
    if (starter) return starter.slug;
    return pieces[0].slug;
  };
  const [pieceSlug, setPieceSlug] = useState(startingPieceSlug);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  /* Who chose this photo: the scan only spends money on a person's pick. */
  const [photoSource, setPhotoSource] = useState<LoadSource>("default");
  const [quad, setQuad] = useState<Pt[]>(() => (readStore().quad as Pt[]) || DEFAULT_QUAD);
  /* The active layer's shell floor, live beside the quad. Null means the
     surface is flat, which every layer is until the Shell toggle. A floor
     the visitor shaped survives a reload like the rim does: four points,
     guarded before trust. */
  const storedShellFloor = () => {
    const v = readStore().shellFloor;
    return Array.isArray(v) && v.length === 4 ? (v as Pt[]) : null;
  };
  const [shellFloor, setShellFloor] = useState<Pt[] | null>(storedShellFloor);
  const [surface, setSurface] = useState<SurfaceId>("pool");
  const [tileSize, setTileSize] = useState(() => (readStore().tileSize as number) || 26);
  const [blend, setBlend] = useState(() => {
    const b = readStore().blend;
    return typeof b === "number" ? b : 0.85;
  });
  const [prepMode, setPrepMode] = useState<PrepMode>(() => {
    const p = readStore().prepMode;
    return p === "none" || p === "blur" || p === "primer" ? p : "primer";
  });
  const [groutLight, setGroutLight] = useState(() => {
    const g = readStore().groutLight;
    return typeof g === "boolean" ? g : true;
  });
  const [customColors, setCustomColors] = useState<string[] | null>(null);
  const [tick, setTick] = useState(0);
  const [refineOpen, setRefineOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [samMask, setSamMask] = useState<HTMLImageElement | null>(null);
  const [samMaskSrc, setSamMaskSrc] = useState<string | null>(null);
  const [snapMessage, setSnapMessage] = useState<string | null>(null);
  const [activeLayerId, setActiveLayerId] = useState(FIRST_LAYER_ID);
  const [hasFittedSurface, setHasFittedSurface] = useState(false);
  const [layers, setLayers] = useState<SurfaceLayer[]>(() => [
    {
      id: FIRST_LAYER_ID,
      label: LAYER_LABELS.pool,
      surface: "pool",
      quad: (readStore().quad as Pt[]) || DEFAULT_QUAD,
      pieceSlug: startingPieceSlug(),
      tileSize: (readStore().tileSize as number) || 26,
      blend: typeof readStore().blend === "number" ? (readStore().blend as number) : 0.85,
      prepMode: readStore().prepMode === "none" || readStore().prepMode === "blur" ? (readStore().prepMode as PrepMode) : "primer",
      groutLight: typeof readStore().groutLight === "boolean" ? (readStore().groutLight as boolean) : true,
      customColors: null,
      maskSrc: null,
      shellFloor: storedShellFloor(),
      visible: true,
      accepted: false,
    },
  ]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restored = useRef(false);
  /* Owned here, above render, because render reads them: which corner is
     live, and whether a press-and-hold compare is on. useCornerDrag writes
     through the same refs. */
  const draggingRef = useRef<number | null>(null);
  const holdingRef = useRef(false);

  const piece = pieces.find((p) => p.slug === pieceSlug)!;
  const pieceMap = useMemo(() => new Map(pieces.map((item) => [item.slug, item])), [pieces]);

  /* A mask decoding late needs exactly one more paint. The canvas only
     repaints when render runs, so the paint effect keeps the latest
     render in this ref and the mask cache schedules one frame from it. */
  const renderRef = useRef<() => void>(() => {});
  const schedulePaint = useCallback(() => {
    requestAnimationFrame(() => renderRef.current());
  }, []);

  const { objectUrl, revokeObjectUrl } = useObjectUrls();

  /* The undo memory lives in its own hook now; it reads these live
     controls to checkpoint and writes them back to restore. */
  const { history, pushSnapshot, stepHistory, pinLook } = useSnapshots({
    photo,
    layers,
    activeLayerId,
    surface,
    quad,
    shellFloor,
    pieceSlug,
    tileSize,
    blend,
    prepMode,
    groutLight,
    customColors,
    hasFittedSurface,
    samMask,
    samMaskSrc,
    setLayers,
    setActiveLayerId,
    setSurface,
    setQuad,
    setShellFloor,
    setPieceSlug,
    setTileSize,
    setBlend,
    setPrepMode,
    setGroutLight,
    setCustomColors,
    setHasFittedSurface,
    setSamMask,
    setSamMaskSrc,
    setSnapMessage,
  });

  const { withActiveLayer, addSurfaceLayer, removeSurfaceLayer, selectLayerChip, activateLayerKind } = useSurfaceLayers({
    layers,
    setLayers,
    activeLayerId,
    setActiveLayerId,
    surface,
    setSurface,
    quad,
    setQuad,
    shellFloor,
    setShellFloor,
    pieceSlug,
    setPieceSlug,
    tileSize,
    setTileSize,
    blend,
    setBlend,
    prepMode,
    setPrepMode,
    groutLight,
    setGroutLight,
    customColors,
    setCustomColors,
    hasFittedSurface,
    setHasFittedSurface,
    setSamMask,
    samMaskSrc,
    setSamMaskSrc,
    setSnapMessage,
    pushSnapshot,
    pieces,
  });

  const { samBeta, samBusy, runSam, armSam, clearSam } = useSamAutofind({
    originalRef,
    surface,
    quad,
    setQuad,
    shellFloor,
    setShellFloor,
    setSamMask,
    setSamMaskSrc,
    setHasFittedSurface,
    setSnapMessage,
    pushSnapshot,
  });

  /* The guided session: scan a fresh photo, offer the found surfaces,
     then walk the finder across the accepted ones. Off unless flagged. */
  const session = useSurfaceSession({
    enabled: scanFlag,
    photo,
    photoSource,
    samBusy,
    quad,
    setShellFloor,
    addSurfaceLayer,
    activateLayerKind,
    runSam,
    setSnapMessage,
  });

  /* How photos arrive and what a retag does; the camera rides inside. */
  const {
    loadImage, chooseStarterSurface, onFile, fitSurface, loadContext,
    cameraOpen, cameraError, openCamera, snapCamera, stopCamera,
  } = usePhotoDesk({
    pieces, piece, pieceSlug, surface, shellFloor, blend, prepMode, groutLight,
    withActiveLayer, objectUrl, revokeObjectUrl, videoRef,
    setPhoto, setPhotoSource, setSurface, setQuad, setShellFloor,
    setTileSize, setPieceSlug, setPrepMode, setCustomColors, setSamMask,
    setSamMaskSrc, setLayers, setActiveLayerId, setHasFittedSurface, setSnapMessage,
  });

  /* The feature opens on its own before-state. User photos are chosen,
     not silently restored, so the first view always makes sense. */
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    loadImage(VISUALIZER_SAMPLE.pool.src, "default", SAMPLE_POOL_QUAD, "pool");
  }, [loadImage]);

  usePersistedControls({ photo, quad, shellFloor, tileSize, blend, prepMode, groutLight, pieceSlug, customColors, layers, withActiveLayer });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo) return;
    const sourceW = photo.naturalWidth;
    const sourceH = photo.naturalHeight;
    const maxW = 1400;
    const scale = Math.min(1, maxW / sourceW);
    const W = Math.round(sourceW * scale);
    const Hh = Math.round(sourceH * scale);
    canvas.width = W;
    canvas.height = Hh;
    const ctx = canvas.getContext("2d")!;
    drawSource(ctx, photo, sourceW, sourceH, W, Hh, false);

    /* Keep the untouched photo for press-and-hold compare. */
    const orig = document.createElement("canvas");
    orig.width = W;
    orig.height = Hh;
    const origCtx = orig.getContext("2d")!;
    drawSource(origCtx, photo, sourceW, sourceH, W, Hh, false);
    originalRef.current = orig;

    if (holdingRef.current) return;

    const drawableLayers = withActiveLayer(layers);
    drawableLayers.forEach((layer) => {
      const layerPiece = pieceMap.get(layer.pieceSlug) ?? piece;
      const mask = layer.id === activeLayerId ? (samMask ?? hydrateMask(layer.maskSrc, schedulePaint)) : hydrateMask(layer.maskSrc, schedulePaint);
      if (layer.shellFloor) {
        /* A shelled pool is five quads sharing eight points. Each face
           draws as its own surface under the layer's one mask, so a SAM
           basin cut-out dresses the whole shell. The mask is cut to each
           face's quad on the way in, or every face's prep and finish
           would stamp the whole basin and bury its siblings. */
        buildShellFaces(layer.quad, layer.shellFloor).forEach((face) => {
          if (!face.visible || !isValidQuad(face.quad)) return;
          drawSurfaceLayer({
            ctx,
            origCtx,
            photo,
            sourceW,
            sourceH,
            width: W,
            height: Hh,
            layer: { ...layer, quad: face.quad },
            piece: layerPiece,
            mask,
            finish: draggingRef.current === null,
            clipMaskToQuad: true,
          });
        });
        return;
      }
      drawSurfaceLayer({
        ctx,
        origCtx,
        photo,
        sourceW,
        sourceH,
        width: W,
        height: Hh,
        layer,
        piece: layerPiece,
        mask,
        finish: draggingRef.current === null,
      });
    });
    setTick((t) => t + 1);
  }, [activeLayerId, layers, photo, piece, pieceMap, samMask, schedulePaint, withActiveLayer]);

  useEffect(() => {
    renderRef.current = render;
    const frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [render]);

  const {
    dragPoint, loupe, setLoupe, holding, pointerPos, holdStart,
    queueCornerDrag, finishDrag, drawLoupe, onCornerKey,
  } = useCornerDrag({
    quad,
    setQuad,
    shellFloor,
    setShellFloor,
    setHasFittedSurface,
    setSnapMessage,
    render,
    draggingRef,
    holdingRef,
    canvasRef,
    wrapRef,
    loupeRef,
    originalRef,
  });

  const { share, download } = useShareDownload({
    canvasRef, layers, activeLayerId, piece, pieceMap, withActiveLayer, setSnapMessage,
  });

  /* One tap folds the flat pool into a box interior: the rim keeps its
     four stones, four more shape the floor. Tap again to lie flat. */
  const toggleShell = () => {
    if (shellFloor) {
      setShellFloor(null);
      pushSnapshot("Shell off", { shellFloor: null });
      setSnapMessage("Back to one flat surface.");
    } else {
      const nextFloor = defaultShellFloor(quad);
      setShellFloor(nextFloor);
      pushSnapshot("Shell on", { shellFloor: nextFloor });
      setSnapMessage("A shell now. Eight stones shape it.");
    }
    buzz(4);
  };

  /* Preview just clears the drag controls off the stage so the mosaic
     reads clean, in place. Tap again to bring the corners back. */
  const togglePreview = () => {
    setPreviewMode((p) => !p);
    buzz(4);
    track("viz_preview", {});
  };

  /* The visitor's own colourway, laid over the piece. Null means the
     piece paints itself; the first edit seeds from what is showing. */
  const activeColors = customColors ?? (piece.colors ?? ["#3aa9d6"]);
  const editColor = (i: number, v: string) =>
    setCustomColors(activeColors.map((c, j) => (j === i ? v : c)));
  const addColor = () => {
    setCustomColors([...activeColors, "#1179a8"]);
    buzz(3);
    track("viz_palette", { action: "add" });
  };
  const removeColor = (i: number) => {
    if (activeColors.length <= 1) return;
    setCustomColors(activeColors.filter((_, j) => j !== i));
    buzz(3);
    track("viz_palette", { action: "remove" });
  };

  const pickPiece = (slug: string) => {
    setPieceSlug(slug);
    setCustomColors(null);
    buzz(4);
    track("viz_piece", { piece: slug });
  };

  const changeTileSize = (value: number) => {
    setTileSize(value);
    buzz(2);
  };

  const changeBlend = (value: number) => {
    setBlend(value);
    buzz(2);
  };

  const changePrepMode = (mode: PrepMode) => {
    setPrepMode(mode);
    buzz(3);
    track("viz_prep", { mode });
  };

  const toggleGrout = () => {
    setGroutLight(!groutLight);
    buzz(4);
  };

  const refineControls = (
    <>
      <SurfaceOptions surface={surface} onFit={fitSurface} />
      <ContextOptions onLoad={loadContext} />
      <div className="mt-8">
        <p className="eyebrow">Colourway</p>
        <div className="mt-2"><PieceOptions pieces={pieces} pieceSlug={pieceSlug} onPick={pickPiece} /></div>
        <PaletteEditor colors={activeColors} onEdit={editColor} onAdd={addColor} onRemove={removeColor} />
      </div>
      <div className="mt-8"><LightOptions tileSize={tileSize} blend={blend} prepMode={prepMode} groutLight={groutLight} onTileSize={changeTileSize} onBlend={changeBlend} onPrepMode={changePrepMode} onGroutToggle={toggleGrout} /></div>
    </>
  );

  const prepLabel = prepMode === "primer" ? "Primer" : prepMode === "blur" ? "Blur" : "Original";
  const finishSummary = `${prepLabel}, ${groutLight ? "light" : "dark"} grout`;

  const refineSections = [
    {
      key: "surface",
      eyebrow: "Surface",
      value: SURFACES[surface].label,
      action: "Choose",
      body: (
        <>
          <SurfaceOptions surface={surface} onFit={fitSurface} />
          <ContextOptions onLoad={loadContext} />
        </>
      ),
    },
    {
      key: "colour",
      eyebrow: "Colourway",
      value: piece.name,
      action: "Swap",
      body: (
        <>
          <PieceOptions pieces={pieces} pieceSlug={pieceSlug} onPick={pickPiece} />
          <PaletteEditor colors={activeColors} onEdit={editColor} onAdd={addColor} onRemove={removeColor} />
        </>
      ),
    },
    {
      key: "finish",
      eyebrow: "Finish",
      value: finishSummary,
      action: "Tune",
      body: (
        <LightOptions tileSize={tileSize} blend={blend} prepMode={prepMode} groutLight={groutLight} onTileSize={changeTileSize} onBlend={changeBlend} onPrepMode={changePrepMode} onGroutToggle={toggleGrout} />
      ),
    },
  ];

  const exposedRefinement = (
    <aside className="min-w-0 lg:sticky lg:top-28" data-viz="refine-panel">
      <div className="mb-6">
        <p className="eyebrow">Refine</p>
        <p className="font-serif mt-2 text-[26px]">Make the surface yours.</p>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-dusk">
          One decision at a time.
        </p>
      </div>
      <RefinePanel sections={refineSections} defaultOpen="surface" />
    </aside>
  );

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="panel mb-7 flex flex-col items-start gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Your space</p>
          <p className="font-serif mt-2 text-[20px]">Photo or camera.</p>
          <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-dusk">
            Drag the four corners onto your surface.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-5 sm:w-auto sm:min-w-[420px]">
          <StarterSurface surface={surface} onChoose={chooseStarterSurface} />
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-gold"
              aria-label={`Use your photo for ${SURFACES[surface].label}`}
            >
              Use your photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                onFile(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={openCamera}
              className="link-hair text-dusk"
              aria-describedby={cameraError && !cameraOpen ? "viz-camera-error" : undefined}
            >
              Use camera
            </button>
          </div>
          {cameraError && !cameraOpen && (
            <p id="viz-camera-error" className="text-[14px] leading-relaxed text-dusk" aria-live="polite">
              {cameraError}
            </p>
          )}
        </div>
      </div>

      {photo && (
        <>
          {!cameraOpen && (
            <>
              <div
                className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-10"
                data-viz="workspace"
              >
                <div className="min-w-0">
                  <Stage
                    wrapRef={wrapRef} canvasRef={canvasRef} loupeRef={loupeRef}
                    draggingRef={draggingRef} dragPoint={dragPoint} tick={tick}
                    quad={quad} shellFloor={shellFloor} holding={holding}
                    loupe={loupe} setLoupe={setLoupe}
                    previewMode={previewMode} togglePreview={togglePreview}
                    samBeta={samBeta} samBusy={samBusy} hasFittedSurface={hasFittedSurface}
                    pointerPos={pointerPos} runSam={runSam} holdStart={holdStart}
                    queueCornerDrag={queueCornerDrag} finishDrag={finishDrag}
                    drawLoupe={drawLoupe} onCornerKey={onCornerKey}
                  />
                  <p className="mt-3 text-[13px] leading-relaxed text-mist">
                    Drag the corners onto your surface. Press and hold to compare.
                  </p>
                  <div className="mt-4">
                    <LayerChips layers={layers} activeLayerId={activeLayerId} surface={surface} onSelect={selectLayerChip} />
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      {!samMaskSrc && !samBusy && (
                        <button type="button" onClick={armSam} className="link-hair font-semibold text-ink">
                          {samBeta ? "Tap the wall now" : "Auto-find the surface"}
                        </button>
                      )}
                      {samMaskSrc && (
                        <button type="button" onClick={clearSam} className="link-hair text-dusk">
                          Clear auto-find
                        </button>
                      )}
                      {hasFittedSurface && (
                        <button type="button" onClick={() => addSurfaceLayer()} className="link-hair text-dusk">
                          Add surface
                        </button>
                      )}
                      {surface === "pool" && (
                        <button type="button" onClick={toggleShell} className="link-hair text-dusk">
                          {shellFloor ? "Flat" : "Shell"}
                        </button>
                      )}
                      {layers.length > 1 && (
                        <button type="button" onClick={removeSurfaceLayer} className="link-hair text-dusk">
                          Remove
                        </button>
                      )}
                      {(hasFittedSurface || history.snaps.length > 1) && (
                        <span className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:ml-auto">
                          {hasFittedSurface && (
                            <button type="button" onClick={pinLook} className="link-hair text-dusk">
                              Pin this look
                            </button>
                          )}
                          {history.snaps.length > 1 && (
                            <span className="inline-flex items-center gap-3" role="group" aria-label="Snapshot history">
                              <button
                                type="button"
                                onClick={() => stepHistory(-1)}
                                disabled={history.i <= 0}
                                className="link-hair text-dusk disabled:opacity-40"
                                aria-label="Previous snapshot"
                              >
                                Back
                              </button>
                              <span className="text-[12px] tabular-nums text-mist" aria-live="polite">
                                {history.i + 1} / {history.snaps.length}
                              </span>
                              <button
                                type="button"
                                onClick={() => stepHistory(1)}
                                disabled={history.i >= history.snaps.length - 1}
                                className="link-hair text-dusk disabled:opacity-40"
                                aria-label="Next snapshot"
                              >
                                Forward
                              </button>
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    {scanFlag && session.scan && (session.offerOpen || session.sessionRunning) && (
                      <ScanOffer
                        scan={session.scan}
                        steps={session.steps}
                        running={session.sessionRunning}
                        onAccept={session.accept}
                        onDismiss={session.dismiss}
                      />
                    )}
                    <p className="text-[12px] leading-relaxed text-mist" aria-live="polite">
                      {snapMessage ?? "The stones stay editable."}
                    </p>
                  </div>
                </div>
                {exposedRefinement}
              </div>
            </>
          )}

          <Dialog.Root open={refineOpen} onOpenChange={setRefineOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[92] bg-sand/70 backdrop-blur-[18px]" />
              <Dialog.Content className="filter-surface fixed inset-x-0 bottom-0 z-[93] max-h-[86svh] overflow-y-auto rounded-t-[28px] px-5 py-7 outline-none sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,980px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:px-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <Dialog.Title className="eyebrow">Refine</Dialog.Title>
                    <Dialog.Description className="mt-2 text-[14px] leading-relaxed text-dusk">
                      Choose the surface, colour, light, and grout.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close
                    aria-label="Close refine panel"
                    className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-dusk transition-colors duration-300 hover:text-ink"
                  >
                    <IconClose className="h-4 w-4" />
                  </Dialog.Close>
                </div>
                <div className="mt-7">{refineControls}</div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {!cameraOpen && (
            <div className="mt-10 flex flex-wrap items-center gap-8">
              <button onClick={share} className="btn-gold" data-wa="visualizer">
                Send it to the house
              </button>
              <button onClick={togglePreview} className="link-hair text-dusk">
                {previewMode ? "Adjust" : "Preview"}
              </button>
              <button onClick={download} className="link-hair text-dusk">
                Download
              </button>
            </div>
          )}
        </>
      )}

      <CameraDialog
        open={cameraOpen}
        onOpenChange={(open) => !open && stopCamera()}
        videoRef={videoRef}
        cameraError={cameraError}
        onCapture={snapCamera}
      />

    </div>
  );
}
