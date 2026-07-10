/* The depth pass lives here and only here. transformers.js touches
   self, navigator.gpu, and WASM, so confining the import to this module
   worker keeps it out of the SSR graph and off the main thread. The
   model loads once, on first request, then serves every call. */

import {
  pipeline,
  env,
  RawImage,
  type DepthEstimationPipeline,
} from "@huggingface/transformers";

/* Fetch weights from the HF CDN and let the browser Cache API hold them,
   so a reload is near-instant. No committed model files. */
env.allowLocalModels = false;
env.useBrowserCache = true;

/* Single-threaded WASM. The threaded backend wants SharedArrayBuffer,
   which needs cross-origin isolation (COOP and COEP headers) that
   neither the dev server nor Vercel sends by default, so the threaded
   path fails to init and depth would silently fall through. One thread
   always runs. */
if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = 1;

const MODEL = "onnx-community/depth-anything-v2-small";

/* pipeline's overloads fan into a union too wide for the compiler once
   task and dtype meet. We only ever build the one depth pipeline, so
   narrow the signature to that. */
const buildPipeline = pipeline as (
  task: "depth-estimation",
  model: string,
  options: { device: string; dtype: string },
) => Promise<DepthEstimationPipeline>;

/* A dedicated worker's postMessage takes an optional transfer list; the
   DOM Window overload does not, so narrow self to what we use. */
const post = (self as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
}).postMessage;

type Incoming =
  | { id: number; image: ImageBitmap }
  | { id: number; image: { data: Uint8ClampedArray; width: number; height: number } };

let estimator: DepthEstimationPipeline | null = null;
let loading: Promise<DepthEstimationPipeline> | null = null;

/* WebGPU wants fp32; WASM likes q8. Try the fast path, fall back to the
   one that always exists. Whichever wins is reused for every later call. */
async function getEstimator(): Promise<DepthEstimationPipeline> {
  if (estimator) return estimator;
  if (loading) return loading;
  loading = (async () => {
    try {
      return await buildPipeline("depth-estimation", MODEL, {
        device: "webgpu",
        dtype: "fp32",
      });
    } catch {
      return await buildPipeline("depth-estimation", MODEL, {
        device: "wasm",
        dtype: "q8",
      });
    }
  })();
  estimator = await loading;
  loading = null;
  return estimator;
}

/* The stage sends RGBA pixels or an ImageBitmap; either becomes a
   RawImage the pipeline can preprocess. */
function toRawImage(image: Incoming["image"]): RawImage {
  if (image instanceof ImageBitmap) {
    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no-ctx");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height);
    return new RawImage(new Uint8ClampedArray(pixels.data), image.width, image.height, 4);
  }
  return new RawImage(new Uint8ClampedArray(image.data), image.width, image.height, 4);
}

self.addEventListener("message", async (e: MessageEvent<Incoming>) => {
  const { id, image } = e.data;
  try {
    const est = await getEstimator();
    const raw = toRawImage(image);
    const out = await est(raw);
    const { depth } = Array.isArray(out) ? out[0] : out;
    /* depth is a single-channel RawImage, already normalised 0..255.
       Ship the grayscale buffer as transferable so no copy is made. */
    const data = depth.data instanceof Uint8Array ? depth.data : new Uint8Array(depth.data);
    post(
      { type: "result", id, data, width: depth.width, height: depth.height },
      [data.buffer],
    );
  } catch {
    post({ type: "error", id });
  }
});
