#!/usr/bin/env node
// Copy the onnxruntime-web runtime assets next to the app so the browser
// fetches them same origin. ORT compiles its own .wasm and loads helper
// .mjs proxy modules; at runtime we point it at these with
// ort.env.wasm.wasmPaths = "/ort/". Keeping them under public/ort means
// there is no CDN host to allow in connect-src and no cross origin
// surprises.
//
// This runs as predev and prebuild. onnxruntime-web is an optional, not
// yet installed dependency of the in browser SAM path (default off), so
// when it is absent this script skips quietly and never fails the build.
// The app is never worse than today.

import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  statSync,
} from "node:fs";
import { join, sep } from "node:path";

const projectRoot = process.cwd();
const destDir = join(projectRoot, "public", "ort");

// Find node_modules/onnxruntime-web/dist across the common layout and a
// hoisted layout, without assuming the package exposes ./package.json.
function findDistDir() {
  const candidates = [
    join(projectRoot, "node_modules", "onnxruntime-web", "dist"),
  ];
  try {
    const require = createRequire(import.meta.url);
    const entry = require.resolve("onnxruntime-web");
    const marker = `${sep}onnxruntime-web${sep}`;
    const at = entry.indexOf(marker);
    if (at >= 0) {
      const pkgRoot = entry.slice(0, at + marker.length - 1);
      candidates.push(join(pkgRoot, "dist"));
    }
  } catch {
    // resolve throws when the package is not installed; the first
    // candidate still covers the ordinary node_modules layout.
  }
  for (const dir of candidates) {
    if (existsSync(dir) && statSync(dir).isDirectory()) return dir;
  }
  return null;
}

// Copy again only when the destination is missing, a different size, or
// older than the source, so repeat dev and build runs stay quiet.
function shouldCopy(from, to) {
  if (!existsSync(to)) return true;
  const a = statSync(from);
  const b = statSync(to);
  return a.size !== b.size || a.mtimeMs > b.mtimeMs;
}

function main() {
  const distDir = findDistDir();
  if (!distDir) {
    console.log(
      "[copy-ort] onnxruntime-web is not installed; skipping. The in browser SAM path stays off until it is added.",
    );
    return;
  }

  // Only the wasm runtime files ORT fetches at wasmPaths are served from
  // here; the ort.*.mjs entry bundles are compiled into the app by the
  // bundler, not loaded from public/ort. The worker runs the WebGPU
  // (jsep) build, so keep the jsep wasm plus the base wasm fallback and
  // drop the asyncify and jspi variants the WebGPU path never loads. This
  // trims the staged runtime from ~97MB to under 40MB.
  const KEEP = /^ort-wasm-simd-threaded\.(jsep\.)?(wasm|mjs)$/;
  const assets = readdirSync(distDir).filter((name) => KEEP.test(name));
  if (assets.length === 0) {
    console.log(
      `[copy-ort] no .wasm or .mjs assets found in ${distDir}; nothing to copy.`,
    );
    return;
  }

  mkdirSync(destDir, { recursive: true });

  let copied = 0;
  for (const name of assets) {
    const from = join(distDir, name);
    const to = join(destDir, name);
    if (shouldCopy(from, to)) {
      copyFileSync(from, to);
      copied += 1;
    }
  }

  console.log(
    `[copy-ort] ${copied} of ${assets.length} onnxruntime-web asset(s) refreshed into public/ort/.`,
  );
}

main();
