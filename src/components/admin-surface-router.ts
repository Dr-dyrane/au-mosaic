"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { buzz } from "@/lib/backoffice";
import {
  adminActionEventName,
  type AdminActionIntent,
} from "@/components/admin-action-intents";
import {
  clearAdminContextPanel,
  getAdminContextPanel,
  showMediaBatchPanel,
  showMediaCreatePanel,
  showStockFilterPanel,
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

function sameAdminSurface(panel: AdminContextPanel, request: AdminSurfaceRequest) {
  return panel?.kind === request.kind;
}

export function useAdminSurface(
  request: AdminSurfaceRequest,
  options: { id: string; intent?: AdminActionIntent }
) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const desktop = useSyncExternalStore(subscribeDesktopSurface, getDesktopSurface, () => false);
  const panel = useSyncExternalStore(subscribeAdminContextPanel, getAdminContextPanel, () => null);
  const railOpen = sameAdminSurface(panel, request);
  const visible = railOpen || (sheetOpen && !desktop);

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
