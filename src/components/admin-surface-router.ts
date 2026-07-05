"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { buzz } from "@/lib/backoffice";
import {
  adminActionEventName,
  type AdminActionIntent,
} from "@/components/admin-action-intents";
import {
  clearAdminContextPanel,
  type ContextPieceOption,
  getAdminContextPanel,
  showMediaBatchPanel,
  showMediaCreatePanel,
  showStockFilterPanel,
  type StockFilterContext,
  subscribeAdminContextPanel,
  type AdminContextPanel,
} from "@/components/admin-context-panel-store";

export const ADMIN_DESKTOP_SURFACE_QUERY = "(min-width: 1280px)";

export type AdminSurfaceRequest = NonNullable<AdminContextPanel>;

function subscribeDesktopSurface(listener: () => void) {
  const query = window.matchMedia(ADMIN_DESKTOP_SURFACE_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function getDesktopSurface() {
  return window.matchMedia(ADMIN_DESKTOP_SURFACE_QUERY).matches;
}

function showAdminSurface(request: AdminSurfaceRequest) {
  switch (request.kind) {
    case "stock-filter":
      showStockFilterPanel(request.current);
      break;
    case "media-create":
      showMediaCreatePanel(request.pieces);
      break;
    case "media-batch":
      showMediaBatchPanel();
      break;
  }
}

function sameStockFilterContext(a: StockFilterContext, b: StockFilterContext) {
  return (
    a.family === b.family &&
    a.low === b.low &&
    a.hue === b.hue &&
    a.app === b.app &&
    a.sort === b.sort
  );
}

function samePieceOptions(a: ContextPieceOption[], b: ContextPieceOption[]) {
  return (
    a.length === b.length &&
    a.every((piece, index) => (
      piece.slug === b[index]?.slug &&
      piece.name === b[index]?.name
    ))
  );
}

function sameAdminSurface(panel: AdminContextPanel, request: AdminSurfaceRequest) {
  if (!panel || panel.kind !== request.kind) return false;
  switch (request.kind) {
    case "stock-filter":
      if (panel.kind !== "stock-filter") return false;
      return sameStockFilterContext(panel.current, request.current);
    case "media-create":
      if (panel.kind !== "media-create") return false;
      return samePieceOptions(panel.pieces, request.pieces);
    case "media-batch":
      return true;
  }
}

export function useAdminSurface(
  request: AdminSurfaceRequest,
  options: { id: string; intent?: AdminActionIntent }
) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const desktop = useSyncExternalStore(subscribeDesktopSurface, getDesktopSurface, () => false);
  const panel = useSyncExternalStore(subscribeAdminContextPanel, getAdminContextPanel, () => null);
  const railKindOpen = panel?.kind === request.kind;
  const railOpen = sameAdminSurface(panel, request);
  const visible = railOpen || (sheetOpen && !desktop);

  useEffect(() => {
    if (!desktop || !railKindOpen || railOpen) return;
    showAdminSurface(request);
  }, [desktop, railKindOpen, railOpen, request]);

  const openSurface = useCallback(() => {
    buzz(3);
    if (desktop) {
      setSheetOpen(false);
      if (railOpen) clearAdminContextPanel();
      else showAdminSurface(request);
      return;
    }
    if (railOpen) clearAdminContextPanel();
    setSheetOpen(true);
  }, [desktop, railOpen, request]);

  useEffect(() => {
    if (!options.intent) return;
    const eventName = adminActionEventName(options.intent);
    const openFromEvent = () => openSurface();
    window.addEventListener(eventName, openFromEvent);
    return () => window.removeEventListener(eventName, openFromEvent);
  }, [openSurface, options.intent]);

  return {
    desktop,
    railOpen,
    sheetOpen: sheetOpen && !desktop,
    setSheetOpen,
    closeSheet: () => setSheetOpen(false),
    openSurface,
    triggerProps: {
      "aria-controls": visible ? options.id : undefined,
      "aria-expanded": visible,
      onClick: openSurface,
    },
  };
}
