"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { buzz } from "@/lib/backoffice";
import {
  adminActionEventName,
  type AdminActionIntent,
} from "@/components/admin-action-intents";
import {
  clearAdminContextPanel,
  type ContextDeliveryOrderOption,
  type ContextPieceOption,
  type CustomerFilterContext,
  getAdminContextPanel,
  showCustomerFilterPanel,
  showCustomerMotionPanel,
  showDeliveryCreatePanel,
  showMediaFilterPanel,
  showOrderFilterPanel,
  showOrderLinePanel,
  showOrderPaymentPanel,
  showOrderReturnPanel,
  showMediaBatchPanel,
  showMediaCreatePanel,
  showStockFilterPanel,
  type ContextReturnLine,
  type MediaFilterContext,
  type OrderFilterContext,
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
    case "media-filter":
      showMediaFilterPanel(request.current);
      break;
    case "order-filter":
      showOrderFilterPanel(request.current);
      break;
    case "customer-filter":
      showCustomerFilterPanel(request.current);
      break;
    case "customer-motion":
      showCustomerMotionPanel(request.customerId);
      break;
    case "delivery-create":
      showDeliveryCreatePanel(request.orders, request.selectedOrder);
      break;
    case "media-create":
      showMediaCreatePanel(request.pieces);
      break;
    case "media-batch":
      showMediaBatchPanel();
      break;
    case "order-line":
      showOrderLinePanel(request.orderId, request.pieces);
      break;
    case "order-payment":
      showOrderPaymentPanel(request.orderId);
      break;
    case "order-return":
      showOrderReturnPanel(request.orderId, request.lines);
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

function sameMediaFilterContext(a: MediaFilterContext, b: MediaFilterContext) {
  return (
    a.status === b.status &&
    a.role === b.role &&
    a.batch === b.batch &&
    a.totals?.all === b.totals?.all &&
    a.totals?.draft === b.totals?.draft &&
    a.totals?.approved === b.totals?.approved &&
    a.totals?.wired === b.totals?.wired &&
    a.totals?.archived === b.totals?.archived
  );
}

function sameOrderFilterContext(a: OrderFilterContext, b: OrderFilterContext) {
  return a.status === b.status && a.q === b.q;
}

function sameCustomerFilterContext(
  a: CustomerFilterContext,
  b: CustomerFilterContext
) {
  return a.q === b.q && a.sort === b.sort;
}

function sameDeliveryOrders(
  a: ContextDeliveryOrderOption[],
  b: ContextDeliveryOrderOption[]
) {
  return (
    a.length === b.length &&
    a.every((order, index) => order.id === b[index]?.id && order.label === b[index]?.label)
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

function sameReturnLines(a: ContextReturnLine[], b: ContextReturnLine[]) {
  return (
    a.length === b.length &&
    a.every((line, index) => (
      line.id === b[index]?.id &&
      line.name === b[index]?.name &&
      line.unit === b[index]?.unit &&
      line.available === b[index]?.available &&
      line.valueKobo === b[index]?.valueKobo
    ))
  );
}

function sameAdminSurface(panel: AdminContextPanel, request: AdminSurfaceRequest) {
  if (!panel || panel.kind !== request.kind) return false;
  switch (request.kind) {
    case "stock-filter":
      if (panel.kind !== "stock-filter") return false;
      return sameStockFilterContext(panel.current, request.current);
    case "media-filter":
      if (panel.kind !== "media-filter") return false;
      return sameMediaFilterContext(panel.current, request.current);
    case "order-filter":
      if (panel.kind !== "order-filter") return false;
      return sameOrderFilterContext(panel.current, request.current);
    case "customer-filter":
      if (panel.kind !== "customer-filter") return false;
      return sameCustomerFilterContext(panel.current, request.current);
    case "customer-motion":
      if (panel.kind !== "customer-motion") return false;
      return panel.customerId === request.customerId;
    case "delivery-create":
      if (panel.kind !== "delivery-create") return false;
      return (
        panel.selectedOrder === request.selectedOrder &&
        sameDeliveryOrders(panel.orders, request.orders)
      );
    case "media-create":
      if (panel.kind !== "media-create") return false;
      return samePieceOptions(panel.pieces, request.pieces);
    case "media-batch":
      return true;
    case "order-line":
      if (panel.kind !== "order-line") return false;
      return panel.orderId === request.orderId && samePieceOptions(panel.pieces, request.pieces);
    case "order-payment":
      if (panel.kind !== "order-payment") return false;
      return panel.orderId === request.orderId;
    case "order-return":
      if (panel.kind !== "order-return") return false;
      return panel.orderId === request.orderId && sameReturnLines(panel.lines, request.lines);
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
