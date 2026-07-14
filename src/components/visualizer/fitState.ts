import type { FitRequestContext, FitSource, FitState } from "./types";

export function createFitState(): FitState {
  return {
    status: "unfitted",
    source: "default",
    confidence: null,
    requestId: null,
    adjusted: false,
  };
}

export function findingFit(current: FitState, requestId: number): FitState {
  return { ...current, status: "finding", requestId };
}

export function suggestedFit(
  current: FitState,
  source: FitSource,
  confidence: number | null,
): FitState {
  return {
    ...current,
    status: "suggested",
    source,
    confidence,
    requestId: null,
    adjusted: false,
  };
}

export function adjustingFit(current: FitState): FitState {
  return {
    ...current,
    status: "adjusting",
    source: current.status === "suggested" ? current.source : "manual",
    requestId: null,
    adjusted: true,
  };
}

export function acceptedFit(current: FitState): FitState {
  return { ...current, status: "accepted", requestId: null };
}

export function retryFit(current: FitState): FitState {
  return { ...current, status: "unfitted", requestId: null, adjusted: false };
}

export function canExportFit(fit: FitState): boolean {
  return fit.status === "accepted";
}

export function ownsFitRequest(
  request: FitRequestContext,
  current: FitRequestContext,
): boolean {
  return request.id === current.id
    && request.photoRevision === current.photoRevision
    && request.layerId === current.layerId;
}
