import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptedFit,
  adjustingFit,
  canExportFit,
  createFitState,
  findingFit,
  ownsFitRequest,
  retryFit,
  suggestedFit,
} from "../src/components/visualizer/fitState";

test("a default fit is editable but not exportable", () => {
  const fit = createFitState();
  assert.equal(fit.status, "unfitted");
  assert.equal(canExportFit(fit), false);
});

test("automatic geometry stays suggested until the customer accepts it", () => {
  const finding = findingFit(createFitState(), 7);
  const suggested = suggestedFit(finding, "segmentation", 0.91);
  assert.equal(suggested.status, "suggested");
  assert.equal(suggested.confidence, 0.91);
  assert.equal(canExportFit(suggested), false);
  assert.equal(canExportFit(acceptedFit(suggested)), true);
});

test("manual correction returns to one accepted checkpoint", () => {
  const suggested = suggestedFit(createFitState(), "analysis", null);
  const adjusting = adjustingFit(suggested);
  assert.equal(adjusting.status, "adjusting");
  assert.equal(adjusting.source, "analysis");
  assert.equal(adjusting.adjusted, true);
  assert.equal(acceptedFit(adjusting).status, "accepted");
});

test("retry makes a suggestion provisional again", () => {
  const suggested = suggestedFit(createFitState(), "analysis", null);
  assert.equal(retryFit(suggested).status, "unfitted");
});

test("a result owns only its original request, photo, and layer", () => {
  const request = { id: 4, photoRevision: 2, layerId: "surface-1" };
  assert.equal(ownsFitRequest(request, { ...request }), true);
  assert.equal(ownsFitRequest(request, { ...request, id: 5 }), false);
  assert.equal(ownsFitRequest(request, { ...request, photoRevision: 3 }), false);
  assert.equal(ownsFitRequest(request, { ...request, layerId: "surface-2" }), false);
});
