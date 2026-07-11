#!/usr/bin/env node
// Self-host the SAM2-tiny weights the in browser SAM path loads at runtime
// from /models/sam2. Each graph is a small .onnx plus a large .onnx_data
// weights file; both must sit together. The files are gitignored (about
// 78MB fp16), so this fetches them once into public/models/sam2 when they
// are missing, and skips quietly when they are already there.
//
// It runs as part of prebuild so a fresh deploy self-hosts the model. It
// never fails the build: a download error logs a warning and leaves the in
// browser SAM path to fall back to the fal finder, so the app is never
// worse than today. Set VIZ_SKIP_MODEL_FETCH=1 to skip entirely.

import { existsSync, mkdirSync, statSync, createWriteStream, rmSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const BASE = "https://huggingface.co/onnx-community/sam2-hiera-tiny-ONNX/resolve/main/onnx/";
const FILES = [
  "vision_encoder_fp16.onnx",
  "vision_encoder_fp16.onnx_data",
  "prompt_encoder_mask_decoder_fp16.onnx",
  "prompt_encoder_mask_decoder_fp16.onnx_data",
];
const destDir = join(process.cwd(), "public", "models", "sam2");

async function fetchTo(name) {
  const to = join(destDir, name);
  // A present, non-empty file is trusted; the weights are immutable.
  if (existsSync(to) && statSync(to).size > 0) return "present";
  const res = await fetch(BASE + name);
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} for ${name}`);
  const tmp = `${to}.part`;
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
  rmSync(to, { force: true });
  const { renameSync } = await import("node:fs");
  renameSync(tmp, to);
  return "fetched";
}

async function main() {
  if (process.env.VIZ_SKIP_MODEL_FETCH) {
    console.log("[fetch-sam-model] VIZ_SKIP_MODEL_FETCH set; skipping.");
    return;
  }
  mkdirSync(destDir, { recursive: true });
  try {
    const results = await Promise.all(FILES.map((f) => fetchTo(f)));
    const fetched = results.filter((r) => r === "fetched").length;
    console.log(
      `[fetch-sam-model] ${fetched} fetched, ${results.length - fetched} already present in public/models/sam2/.`,
    );
  } catch (err) {
    console.warn(
      `[fetch-sam-model] could not fetch the SAM2 weights (${err instanceof Error ? err.message : err}); the in browser SAM path stays off and the fal finder carries the tap.`,
    );
  }
}

main();
