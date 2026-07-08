"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { IconClose } from "@/app/admin/(panel)/icons";
import { track } from "@vercel/analytics";
import { VISUALIZER_SAMPLE } from "@/lib/images";
import type { Piece } from "@/lib/products";
import { SITE } from "@/lib/site";
import { wa } from "@/lib/wa";
import type { Pt, SurfaceId, LoadSource, PrepMode, PendingSnap, SurfaceLayer } from "./visualizer/types";
import { clamp, isValidQuad, setCorner } from "./visualizer/geometry";
import {
  DEFAULT_QUAD,
  SAMPLE_POOL_QUAD,
  SURFACES,
  CONTEXTS,
  DEFAULT_PIECE,
  CORNER_LABELS,
  FIRST_LAYER_ID,
  LAYER_LABELS,
  NEXT_SURFACE,
} from "./visualizer/constants";
import { drawSource, drawSurfaceLayer } from "./visualizer/draw";
import { detectSurfaceQuad } from "./visualizer/detect";
import { buzz, pieceSlugForSurface, suggestionText, shouldKeepCurrentFit, readStore } from "./visualizer/helpers";
import PaletteEditor from "./visualizer/parts/PaletteEditor";
import PieceOptions from "./visualizer/parts/PieceOptions";
import SurfaceOptions from "./visualizer/parts/SurfaceOptions";
import ContextOptions from "./visualizer/parts/ContextOptions";
import StarterSurface from "./visualizer/parts/StarterSurface";
import LightOptions from "./visualizer/parts/LightOptions";
import LayerChips from "./visualizer/parts/LayerChips";
import CameraDialog from "./visualizer/parts/CameraDialog";
import { useObjectUrls } from "./visualizer/hooks/useObjectUrls";
import { usePersistedControls } from "./visualizer/hooks/usePersistedControls";
import { useCamera } from "./visualizer/hooks/useCamera";

export default function Visualizer({ initialPiece, pieces }: { initialPiece?: string; pieces: Piece[] }) {
  const startingPieceSlug = () => {
    if (pieces.some((p) => p.slug === initialPiece)) return initialPiece as string;
    const starter = pieces.find((p) => p.slug === DEFAULT_PIECE);
    if (starter) return starter.slug;
    return pieces[0].slug;
  };
  const [pieceSlug, setPieceSlug] = useState(startingPieceSlug);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [quad, setQuad] = useState<Pt[]>(() => (readStore().quad as Pt[]) || DEFAULT_QUAD);
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
  const [holding, setHolding] = useState(false);
  const [tick, setTick] = useState(0);
  const [loupe, setLoupe] = useState<Pt | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [snapMessage, setSnapMessage] = useState<string | null>(null);
  const [pendingSnap, setPendingSnap] = useState<PendingSnap | null>(null);
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
  const dragging = useRef<number | null>(null);
  const dragFrame = useRef<number | null>(null);
  const dragPoint = useRef<Pt | null>(null);
  const loadSeq = useRef(0);
  const holdingRef = useRef(false);
  const restored = useRef(false);
  const layerSeq = useRef(1);

  const piece = pieces.find((p) => p.slug === pieceSlug)!;
  const pieceMap = useMemo(() => new Map(pieces.map((item) => [item.slug, item])), [pieces]);

  const { objectUrl, revokeObjectUrl } = useObjectUrls();

  const activeLayerSnapshot = useCallback((): SurfaceLayer => ({
    id: activeLayerId,
    label: LAYER_LABELS[surface],
    surface,
    quad,
    pieceSlug,
    tileSize,
    blend,
    prepMode,
    groutLight,
    customColors,
    visible: true,
    accepted: hasFittedSurface,
  }), [activeLayerId, blend, customColors, groutLight, hasFittedSurface, pieceSlug, prepMode, quad, surface, tileSize]);

  const withActiveLayer = useCallback((current: SurfaceLayer[]) => {
    const next = activeLayerSnapshot();
    return current.map((layer) => (
      layer.id === activeLayerId ? { ...layer, ...next, label: LAYER_LABELS[surface] } : layer
    ));
  }, [activeLayerId, activeLayerSnapshot, surface]);

  const selectLayer = useCallback((layer: SurfaceLayer) => {
    setLayers(withActiveLayer);
    setActiveLayerId(layer.id);
    setSurface(layer.surface);
    setQuad(layer.quad);
    setPieceSlug(layer.pieceSlug);
    setTileSize(layer.tileSize);
    setBlend(layer.blend);
    setPrepMode(layer.prepMode);
    setGroutLight(layer.groutLight);
    setCustomColors(layer.customColors);
    setHasFittedSurface(layer.accepted);
    setPendingSnap(null);
    setSnapMessage(`${layer.label} selected.`);
    buzz(3);
  }, [withActiveLayer]);

  const loadImage = useCallback((
    src: string,
    from: LoadSource,
    nextQuad?: Pt[],
    nextSurface = surface,
    acceptedFit = false,
    nextPieceSlug?: string
  ) => {
    const ticket = loadSeq.current + 1;
    loadSeq.current = ticket;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (ticket !== loadSeq.current) {
        revokeObjectUrl(src);
        return;
      }
      const shouldSnap = !nextQuad && (from === "upload" || from === "camera");
      const preferredSlug = nextPieceSlug && pieces.some((item) => item.slug === nextPieceSlug)
        ? nextPieceSlug
        : pieceSlugForSurface(nextSurface, pieces, pieceSlug);
      const targetSurface = nextSurface;
      const targetPieceSlug = from === "default" ? pieceSlug : preferredSlug;
      const targetPrep: PrepMode = from === "default" ? prepMode : "primer";
      const targetTileSize = SURFACES[targetSurface].tileSize;
      const targetPiece = pieces.find((item) => item.slug === targetPieceSlug) ?? piece;
      const suggestion = suggestionText(targetSurface, targetPrep, targetPiece.name);
      const snapped = shouldSnap ? detectSurfaceQuad(img, targetSurface) : null;
      setHasFittedSurface(snapped ? true : acceptedFit);
      setPendingSnap(null);
      setSurface(targetSurface);
      setTileSize(targetTileSize);
      setPieceSlug(targetPieceSlug);
      setCustomColors(null);
      setPrepMode(targetPrep);
      if (snapped) {
        setQuad(snapped.quad);
        setSnapMessage(suggestion);
        track("viz_autosnap", { source: from, surface: targetSurface, confidence: Math.round(snapped.confidence * 100) });
      } else if (nextQuad) {
        setQuad(nextQuad);
        setSnapMessage(suggestion);
      } else if (shouldSnap) {
        setQuad(SURFACES[targetSurface].quad);
        setSnapMessage(suggestion);
        track("viz_autosnap", { source: from, surface: targetSurface, status: "fallback" });
      }
      setPhoto(img);
      if (from !== "default") track("viz_photo", { source: from });
      revokeObjectUrl(src);
    };
    img.onerror = () => {
      if (ticket === loadSeq.current) setSnapMessage("That image did not open. Try another photo.");
      revokeObjectUrl(src);
    };
    img.src = src;
  }, [piece, pieceSlug, pieces, prepMode, revokeObjectUrl, surface]);

  const { cameraOpen, cameraError, clearCameraError, openCamera, snapCamera, stopCamera } = useCamera({
    videoRef,
    objectUrl,
    setSnapMessage,
    surface,
    onCapture: loadImage,
  });

  /* The feature opens on its own before-state. User photos are chosen,
     not silently restored, so the first view always makes sense. */
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    loadImage(VISUALIZER_SAMPLE.pool.src, "default", SAMPLE_POOL_QUAD, "pool", true);
  }, [loadImage]);

  useEffect(() => () => {
    if (dragFrame.current !== null) cancelAnimationFrame(dragFrame.current);
  }, []);

  usePersistedControls({ photo, quad, tileSize, blend, prepMode, groutLight, pieceSlug, customColors, layers, withActiveLayer });

  const chooseStarterSurface = (id: SurfaceId) => {
    const nextPieceSlug = pieceSlugForSurface(id, pieces, pieceSlug);
    const nextPiece = pieces.find((item) => item.slug === nextPieceSlug) ?? piece;
    setLayers(withActiveLayer);
    setSurface(id);
    setTileSize(SURFACES[id].tileSize);
    setPieceSlug(nextPieceSlug);
    setCustomColors(null);
    setPrepMode("primer");
    setQuad(SURFACES[id].quad);
    setPendingSnap(null);
    setHasFittedSurface(false);
    setSnapMessage(suggestionText(id, "primer", nextPiece.name));
    buzz(4);
    track("viz_surface_choice", { surface: id });
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    clearCameraError();
    loadImage(objectUrl(f), "upload", undefined, surface);
  };

  const findSurface = (id = surface) => {
    const found = photo ? detectSurfaceQuad(photo, id) : null;
    if (!found) {
      setSnapMessage("No clean edge yet. Drag corners to refine.");
      setPendingSnap(null);
      track("viz_autosnap", { surface: id, status: "miss" });
      buzz(2);
      return;
    }
    if (shouldKeepCurrentFit(found, quad, hasFittedSurface)) {
      setSurface(id);
      setTileSize(SURFACES[id].tileSize);
      setPendingSnap({ ...found, surface: id });
      setSnapMessage("Found another edge. Current fit kept.");
      track("viz_autosnap", { surface: id, confidence: Math.round(found.confidence * 100), status: "review" });
      buzz(4);
      return;
    }
    setSurface(id);
    setTileSize(SURFACES[id].tileSize);
    setQuad(found.quad);
    setPendingSnap(null);
    setHasFittedSurface(true);
    setSnapMessage(found.confidence > 1.35 ? "Surface found. Drag corners to refine." : "Best edge found. Drag corners to refine.");
    track("viz_autosnap", { surface: id, confidence: Math.round(found.confidence * 100) });
    buzz(8);
  };

  const useDetectedFit = () => {
    if (!pendingSnap) return;
    const found = pendingSnap;
    setSurface(found.surface);
    setTileSize(SURFACES[found.surface].tileSize);
    setQuad(found.quad);
    setPendingSnap(null);
    setHasFittedSurface(true);
    setSnapMessage("Detected fit applied. Drag corners to refine.");
    track("viz_autosnap", { surface: found.surface, confidence: Math.round(found.confidence * 100), status: "accepted" });
    buzz(8);
  };

  const fitSurface = (id: SurfaceId) => {
    const next = SURFACES[id];
    const nextPieceSlug = pieceSlugForSurface(id, pieces, pieceSlug);
    const nextPiece = pieces.find((item) => item.slug === nextPieceSlug) ?? piece;
    setSurface(id);
    setTileSize(next.tileSize);
    setPieceSlug(nextPieceSlug);
    setCustomColors(null);
    setPrepMode("primer");
    const found = photo ? detectSurfaceQuad(photo, id) : null;
    if (found) {
      setQuad(found.quad);
      setSnapMessage(suggestionText(id, "primer", nextPiece.name));
      setHasFittedSurface(true);
      setPendingSnap(null);
    } else {
      setQuad(next.quad);
      setSnapMessage(suggestionText(id, "primer", nextPiece.name));
      setHasFittedSurface(false);
      setPendingSnap(null);
    }
    buzz(4);
    track("viz_surface", { surface: id, autosnap: !!found });
  };

  const loadContext = (id: SurfaceId) => {
    const context = CONTEXTS.find((item) => item.id === id);
    if (!context) return;
    const next = SURFACES[id];
    setSurface(id);
    setTileSize(next.tileSize);
    if (pieces.some((p) => p.slug === context.piece)) setPieceSlug(context.piece);
    loadImage(context.src, "sample", next.quad, id, true, context.piece);
    buzz(6);
    track("viz_context", { surface: id });
  };

  const addSurfaceLayer = () => {
    const committedLayers = withActiveLayer(layers);
    if (!hasFittedSurface) {
      setLayers(committedLayers);
      setSnapMessage(`Find ${LAYER_LABELS[surface]} first.`);
      buzz(2);
      return;
    }
    const used = new Set(committedLayers.map((layer) => layer.surface));
    const nextSurface = NEXT_SURFACE[surface].find((candidate) => !used.has(candidate));
    if (!nextSurface) {
      setLayers(committedLayers);
      setSnapMessage("Every surface type is already in this preview.");
      buzz(2);
      return;
    }
    const nextPieceSlug = pieceSlugForSurface(nextSurface, pieces, pieceSlug);
    const id = `surface-${layerSeq.current + 1}`;
    layerSeq.current += 1;
    const nextLayer: SurfaceLayer = {
      id,
      label: LAYER_LABELS[nextSurface],
      surface: nextSurface,
      quad: SURFACES[nextSurface].quad,
      pieceSlug: nextPieceSlug,
      tileSize: SURFACES[nextSurface].tileSize,
      blend,
      prepMode: "primer",
      groutLight,
      customColors: null,
      visible: true,
      accepted: false,
    };
    setLayers(committedLayers.concat(nextLayer));
    setActiveLayerId(id);
    setSurface(nextSurface);
    setQuad(nextLayer.quad);
    setPieceSlug(nextPieceSlug);
    setCustomColors(null);
    setTileSize(nextLayer.tileSize);
    setPrepMode("primer");
    setHasFittedSurface(false);
    setPendingSnap(null);
    setSnapMessage(`Added ${nextLayer.label}. Find surface, then refine.`);
    buzz(5);
    track("viz_layer_add", { surface: nextSurface });
  };

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
      });
    });
    setTick((t) => t + 1);
  }, [layers, photo, piece, pieceMap, withActiveLayer]);

  useEffect(() => {
    const frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [render]);

  const pointerPos = (e: React.PointerEvent): Pt => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / rect.width, 0.02, 0.98),
      y: clamp((e.clientY - rect.top) / rect.height, 0.02, 0.98),
    };
  };

  const updateCorner = useCallback((index: number, point: Pt) => {
    const safePoint = { x: clamp(point.x, 0.02, 0.98), y: clamp(point.y, 0.02, 0.98) };
    setQuad((current) => {
      const next = setCorner(current, index, safePoint);
      if (isValidQuad(next)) return next;
      return current;
    });
  }, []);

  /* The loupe: what your finger is hiding, shown above it at 2.5x. */
  const drawLoupe = (p: Pt) => {
    const src = canvasRef.current;
    const dst = loupeRef.current;
    if (!src || !dst) return;
    const size = 120;
    dst.width = size;
    dst.height = size;
    const zoom = 2.5;
    const sx = p.x * src.width - size / (2 * zoom);
    const sy = p.y * src.height - size / (2 * zoom);
    const ctx = dst.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(src, sx, sy, size / zoom, size / zoom, 0, 0, size, size);
    ctx.strokeStyle = "#c2a15c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2 - 10);
    ctx.lineTo(size / 2, size / 2 + 10);
    ctx.moveTo(size / 2 - 10, size / 2);
    ctx.lineTo(size / 2 + 10, size / 2);
    ctx.stroke();
  };

  const holdEnd = () => {
    if (!holding) return;
    holdingRef.current = false;
    setHolding(false);
    render();
  };

  const queueCornerDrag = (index: number, point: Pt) => {
    dragPoint.current = point;
    setLoupe(point);
    if (dragFrame.current !== null) return;
    dragFrame.current = requestAnimationFrame(() => {
      dragFrame.current = null;
      const nextPoint = dragPoint.current;
      if (!nextPoint || dragging.current !== index) return;
      updateCorner(index, nextPoint);
      drawLoupe(nextPoint);
    });
  };

  const finishDrag = () => {
    if (dragFrame.current !== null) {
      cancelAnimationFrame(dragFrame.current);
      dragFrame.current = null;
    }
    if (dragging.current !== null && dragPoint.current) {
      updateCorner(dragging.current, dragPoint.current);
      setHasFittedSurface(true);
      setPendingSnap(null);
      setSnapMessage("Fit updated. Add another surface when ready.");
    }
    if (dragging.current !== null) buzz(4);
    dragging.current = null;
    dragPoint.current = null;
    setLoupe(null);
    holdEnd();
  };

  const nudgeCorner = (index: number, dx: number, dy: number) => {
    const current = quad[index];
    const next = { x: clamp(current.x + dx, 0.02, 0.98), y: clamp(current.y + dy, 0.02, 0.98) };
    updateCorner(index, next);
    setHasFittedSurface(true);
    setPendingSnap(null);
    setSnapMessage("Fit updated. Add another surface when ready.");
    setLoupe(next);
    requestAnimationFrame(() => drawLoupe(next));
    buzz(2);
    track("viz_adjust", { corner: index, method: "keyboard" });
  };

  const onCornerKey = (index: number, e: KeyboardEvent<SVGCircleElement>) => {
    const step = e.shiftKey ? 0.04 : 0.012;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    nudgeCorner(index, move[0], move[1]);
  };

  const holdStart = (e: React.PointerEvent) => {
    if ((e.target as Element).tagName === "circle") return;
    if (!originalRef.current || !canvasRef.current) return;
    holdingRef.current = true;
    setHolding(true);
    buzz(6);
    track("viz_compare", {});
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.drawImage(originalRef.current, 0, 0);
  };

  const share = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentLayers = withActiveLayer(layers).filter((layer) => layer.visible);
    const layerSummary = currentLayers.map((layer) => {
      const layerPiece = pieceMap.get(layer.pieceSlug) ?? piece;
      return `${layer.label}: ${layerPiece.name}`;
    }).join("; ");
    const primaryLayer = currentLayers.find((layer) => layer.id === activeLayerId) ?? currentLayers[0];
    const primaryPiece = primaryLayer ? pieceMap.get(primaryLayer.pieceSlug) ?? piece : piece;
    const fileName = currentLayers.length > 1 ? "au-mosaic-visualizer-surfaces.png" : `au-mosaic-${primaryPiece.slug}.png`;
    const shareText = layerSummary || piece.name;
    track("viz_share", { piece: primaryPiece.slug, layers: currentLayers.length });
    buzz(8);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: `${shareText} · ${SITE.url.replace(/^https?:\/\//, "")}` });
          return;
        } catch {}
      }
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = file.name;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setSnapMessage("Preview saved. Attach it in WhatsApp.");
      window.open(wa(`Hello AU Mosaic, I visualised ${shareText} in my space. Please send a quote.`), "_blank");
    }, "image/png");
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentLayers = withActiveLayer(layers).filter((layer) => layer.visible);
    const primaryLayer = currentLayers.find((layer) => layer.id === activeLayerId) ?? currentLayers[0];
    const primaryPiece = primaryLayer ? pieceMap.get(primaryLayer.pieceSlug) ?? piece : piece;
    const fileName = currentLayers.length > 1 ? "au-mosaic-visualizer-surfaces.png" : `au-mosaic-${primaryPiece.slug}.png`;
    track("viz_download", { piece: primaryPiece.slug, layers: currentLayers.length });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }, "image/png");
  };

  /* A clean look at exactly what downloads or sends: the canvas as a
     flat image, none of the editing chrome, shown full in a sheet. */
  const openPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setPreviewUrl(canvas.toDataURL("image/png"));
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

  const selectLayerChip = (layer: SurfaceLayer) =>
    selectLayer(layer.id === activeLayerId ? activeLayerSnapshot() : layer);

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

  const mobileSnippetClass = "group rounded-[26px] bg-shell/45 px-5 py-4 shadow-lift";
  const mobileSummaryClass = "flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden";
  const mobileRefineSnippets = (
    <div className="mt-6 space-y-3 md:hidden" data-viz="mobile-snippets">
      <details className={mobileSnippetClass}>
        <summary className={mobileSummaryClass}>
          <span>
            <span className="eyebrow block">Surface</span>
            <span className="mt-1 block font-serif text-[20px]">{SURFACES[surface].label}</span>
          </span>
          <span className="link-hair text-dusk group-open:text-ink">Choose</span>
        </summary>
        <div className="mt-5">
          <SurfaceOptions surface={surface} onFit={fitSurface} />
          <ContextOptions onLoad={loadContext} />
        </div>
      </details>
      <details className={mobileSnippetClass}>
        <summary className={mobileSummaryClass}>
          <span>
            <span className="eyebrow block">Colourway</span>
            <span className="mt-1 block font-serif text-[20px]">{piece.name}</span>
          </span>
          <span className="link-hair text-dusk group-open:text-ink">Swap</span>
        </summary>
        <div className="mt-5">
          <PieceOptions pieces={pieces} pieceSlug={pieceSlug} onPick={pickPiece} />
          <PaletteEditor colors={activeColors} onEdit={editColor} onAdd={addColor} onRemove={removeColor} />
        </div>
      </details>
      <details className={mobileSnippetClass}>
        <summary className={mobileSummaryClass}>
          <span>
            <span className="eyebrow block">Finish</span>
            <span className="mt-1 block font-serif text-[20px]">{prepMode === "primer" ? "Primer" : prepMode === "blur" ? "Blur" : "Original"}</span>
          </span>
          <span className="link-hair text-dusk group-open:text-ink">Tune</span>
        </summary>
        <div className="mt-5"><LightOptions tileSize={tileSize} blend={blend} prepMode={prepMode} groutLight={groutLight} onTileSize={changeTileSize} onBlend={changeBlend} onPrepMode={changePrepMode} onGroutToggle={toggleGrout} /></div>
      </details>
    </div>
  );

  const exposedRefinement = (
    <aside className="hidden min-w-0 md:block lg:sticky lg:top-28" data-viz="exposed-refinement">
      <div className="mb-6">
        <p className="eyebrow">Refine</p>
        <p className="font-serif mt-2 text-[26px]">Make the surface yours.</p>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-dusk">
          Surface, colour, light, grout.
        </p>
      </div>
      {refineControls}
    </aside>
  );

  const stage = (
    <div
      ref={wrapRef}
      className="relative -mx-5 w-[calc(100%+2.5rem)] min-w-0 overflow-hidden rounded-none sm:mx-0 sm:w-full sm:max-w-full sm:rounded-[26px]"
    >
      <canvas ref={canvasRef} className="block h-auto w-full max-w-full" />
      <div key={tick} className="viz-sweep pointer-events-none absolute inset-0" aria-hidden />
      <p id="viz-corner-help" className="sr-only">
        Focus a brass corner and use the arrow keys to nudge the surface. Hold shift for a larger move.
      </p>
      <svg
        className="absolute inset-0 h-full w-full touch-none"
        aria-describedby="viz-corner-help"
        onPointerDown={holdStart}
        onPointerMove={(e) => {
          if (dragging.current === null) return;
          const p = pointerPos(e);
          queueCornerDrag(dragging.current, p);
        }}
        onPointerUp={finishDrag}
        onPointerLeave={finishDrag}
      >
        {quad.map((p, i) => {
          const n = quad[(i + 1) % 4];
          return (
            <line
              key={i}
              x1={`${p.x * 100}%`}
              y1={`${p.y * 100}%`}
              x2={`${n.x * 100}%`}
              y2={`${n.y * 100}%`}
              stroke="var(--t-brass)"
              strokeWidth="2"
              strokeDasharray="6 5"
              opacity={holding ? 0 : 0.9}
            />
          );
        })}
        {quad.map((p, i) => (
          <circle
            key={`c${i}`}
            cx={`${p.x * 100}%`}
            cy={`${p.y * 100}%`}
            r="14"
            tabIndex={hasFittedSurface ? 0 : -1}
            role="button"
            aria-label={`${CORNER_LABELS[i]} surface corner. Use arrow keys to nudge.`}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            fill="var(--t-brass)"
            fillOpacity={holding ? 0 : 0.9}
            stroke="#14110b"
            strokeWidth="2"
            style={{ cursor: "grab" }}
            onFocus={() => {
              setLoupe(p);
              requestAnimationFrame(() => drawLoupe(p));
            }}
            onBlur={() => setLoupe(null)}
            onKeyDown={(e) => onCornerKey(i, e)}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.target as Element).setPointerCapture(e.pointerId);
              dragging.current = i;
              const p2 = pointerPos(e);
              dragPoint.current = p2;
              buzz(6);
              setLoupe(p2);
              requestAnimationFrame(() => drawLoupe(p2));
              track("viz_adjust", { corner: i });
            }}
          />
        ))}
      </svg>
      {loupe && (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            left: `calc(${loupe.x * 100}% - 60px)`,
            top: `calc(${loupe.y * 100}% - 150px)`,
          }}
        >
          <canvas
            ref={loupeRef}
            className="rounded-full"
            style={{ boxShadow: "0 0 0 2px var(--t-brass), 0 14px 40px -12px rgb(0 0 0 / 0.6)" }}
          />
        </div>
      )}
      {holding && <span className="chip-glass absolute left-1/2 top-4 -translate-x-1/2">Original</span>}
      {!holding && (
        <button
          type="button"
          onClick={openPreview}
          aria-label="Preview the result"
          className="chip-glass absolute right-4 top-4 z-20 font-semibold"
        >
          Preview
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="panel mb-7 flex flex-col items-start gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Your space</p>
          <p className="font-serif mt-2 text-[20px]">Photo or camera.</p>
          <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-dusk">
            We find the surface. You refine it.
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
                  {stage}
                  <p className="mt-3 text-[12px] uppercase tracking-[0.18em] text-mist">
                    Find surface, then drag corners to refine. Press and hold to compare.
                  </p>
                  <div className="mt-4">
                    <LayerChips layers={layers} activeLayerId={activeLayerId} surface={surface} onSelect={selectLayerChip} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-6">
                    <button type="button" onClick={() => findSurface()} className="link-hair text-dusk">
                      Find surface
                    </button>
                    {pendingSnap && pendingSnap.surface === surface && (
                      <button type="button" onClick={useDetectedFit} className="link-hair text-dusk">
                        Use detected fit
                      </button>
                    )}
                    {hasFittedSurface && (
                      <button type="button" onClick={addSurfaceLayer} className="link-hair text-dusk">
                        Add another surface
                      </button>
                    )}
                    {!hasFittedSurface && layers.length > 1 && (
                      <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-mist">
                        Find {LAYER_LABELS[surface]} first
                      </span>
                    )}
                    <p className="text-[12px] uppercase tracking-[0.18em] text-mist" aria-live="polite">
                      {snapMessage ?? "The stones stay editable."}
                    </p>
                  </div>
                </div>
                {exposedRefinement}
              </div>
              {mobileRefineSnippets}
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
              <button onClick={openPreview} className="link-hair text-dusk">
                Preview
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

      <Dialog.Root open={previewUrl !== null} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[94] bg-sand/80 backdrop-blur-[18px]" />
          <Dialog.Content className="fixed inset-0 z-[95] flex flex-col outline-none sm:inset-6 sm:rounded-[28px] sm:bg-shell/80 sm:shadow-lift sm:backdrop-blur-[24px]">
            <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-7 sm:py-5">
              <div>
                <Dialog.Title className="eyebrow">Preview</Dialog.Title>
                <Dialog.Description className="mt-1 text-[14px] leading-relaxed text-dusk">
                  Exactly what downloads or sends.
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close preview"
                className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-dusk transition-colors duration-300 hover:text-ink"
              >
                <IconClose className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center px-5 pb-4 sm:px-7">
              {previewUrl && (
                <div
                  role="img"
                  aria-label="Your visualised space"
                  className="h-full w-full rounded-[18px] bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${previewUrl})` }}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-6 px-5 pb-6 sm:px-7 sm:pb-7">
              <button onClick={download} className="btn-gold">
                Download
              </button>
              <button onClick={share} className="link-hair text-dusk" data-wa="visualizer-preview">
                Send it to the house
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
