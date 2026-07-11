/* Client-side SAM2-tiny, in a Web Worker. Encode once per photo, decode
   per tap. The reply is byte-for-byte the shape the fal segment route
   hands back:

     { type: "mask", mask: <alpha PNG data URI>, maskKind: "alpha", width, height }

   so the only change upstream is the transport: runSam swaps
   submitAndAwaitMask(...) for this worker, and everything after
   "if (data.ok && typeof data.mask === 'string')" stays as it is.

   This worker never runs on its own. A capability-gated bridge (WebGPU
   present, flag ON) spawns it; when the gate is off, or a device has no
   WebGPU, the existing fal /api/visualizer/segment path carries the tap,
   so the app is never worse than today.

   Never imported into an SSR path: it touches OffscreenCanvas, FileReader,
   and the worker global, none of which exist on the server.

   The onnx-community export emits 256x256 mask logits and the g-ronimo
   export emits 1024x1024, and exports disagree on input and output names,
   so nothing here is hardcoded from a table: the session's inputNames and
   outputNames are read at load and every feed and every output is matched
   by name (then by shape) at runtime. */

import * as ort from "onnxruntime-web/webgpu";

/* Same-origin wasm and workers, so a future connect-src 'self' CSP never
   blocks them. Single thread: WebGPU is the fast lane and single-thread
   WASM needs no COOP/COEP, which would otherwise break the page's Vercel
   Blob photos. */
ort.env.wasm.wasmPaths = "/ort/";
ort.env.wasm.numThreads = 1;

/* The model input is a square 1024, ImageNet-normalized. A normalized tap
   (0..1) scales straight into this frame, so no per-axis pixel mapping. */
const SIDE = 1024;
const MEAN = [0.485, 0.456, 0.406] as const;
const STD = [0.229, 0.224, 0.225] as const;

const DEFAULT_BASE = "/models/sam2/";
const DEFAULT_ENCODER = "vision_encoder_fp16.onnx";
const DEFAULT_DECODER = "prompt_encoder_mask_decoder_fp16.onnx";

type LoadMsg = {
  type: "load";
  base?: string;
  encoder?: string;
  decoder?: string;
  /* External-data (weights) file names; default to "<graph>.onnx_data". */
  encoderData?: string;
  decoderData?: string;
};
type EncodeMsg = {
  type: "encode";
  rgba: ArrayBuffer | Uint8ClampedArray;
  w: number;
  h: number;
  id?: number;
};
type SegmentMsg = {
  type: "segment";
  nx: number;
  ny: number;
  label?: 0 | 1;
  id?: number;
};
type InMsg = LoadMsg | EncodeMsg | SegmentMsg;

/* The dedicated worker scope, typed locally: the project's tsconfig loads
   the "dom" lib, not "webworker", so self is otherwise typed as Window and
   its postMessage would demand a targetOrigin. */
type WorkerScope = {
  postMessage(message: unknown): void;
  onmessage: ((ev: MessageEvent) => void) | null;
};
const scope = self as unknown as WorkerScope;

let encoder: ort.InferenceSession | null = null;
let decoder: ort.InferenceSession | null = null;

/* The encode-once cache: every encoder output, keyed by its own name, plus
   the photo dimensions the tap and the mask share. */
let embed: Record<string, ort.Tensor> | null = null;
let origW = 0;
let origH = 0;

function post(message: unknown): void {
  scope.postMessage(message);
}

function postError(id: number | undefined, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  post({ type: "error", id, message });
}

async function load(msg: LoadMsg): Promise<void> {
  const base = msg.base ?? DEFAULT_BASE;
  const encoderName = msg.encoder ?? DEFAULT_ENCODER;
  const decoderName = msg.decoder ?? DEFAULT_DECODER;
  const encoderData = msg.encoderData ?? `${encoderName}_data`;
  const decoderData = msg.decoderData ?? `${decoderName}_data`;

  /* WebGPU first, silent WASM fallback. Each graph is a small .onnx plus a
     large .onnx_data that must travel together and be named through the
     externalData option, or the graph loads with its weights missing. */
  encoder = await ort.InferenceSession.create(base + encoderName, {
    executionProviders: ["webgpu", "wasm"],
    externalData: [{ path: encoderData, data: base + encoderData }],
  });
  decoder = await ort.InferenceSession.create(base + decoderName, {
    executionProviders: ["webgpu", "wasm"],
    externalData: [{ path: decoderData, data: base + decoderData }],
  });

  /* Hand the real I/O names back on a side channel so the bridge can log
     and confirm the export it is actually hosting instead of trusting a
     doc table. The bridge's switch ignores this "info" type, so the agreed
     "ready" message stays exactly its published shape and cannot drift. */
  post({
    type: "info",
    encoderInputs: [...encoder.inputNames],
    encoderOutputs: [...encoder.outputNames],
    decoderInputs: [...decoder.inputNames],
    decoderOutputs: [...decoder.outputNames],
  });
  post({ type: "ready" });
}

/* Squash the untouched photo to 1024x1024, then CHW float32 with ImageNet
   mean and std. The squash matches the tap scaling (nx * 1024), so a
   normalized point lands where the model looks. */
function toCHW1024(rgba: Uint8ClampedArray, w: number, h: number): Float32Array {
  const src = new OffscreenCanvas(w, h);
  const sctx = src.getContext("2d");
  if (!sctx) throw new Error("no-2d");
  const srcImage = new ImageData(w, h);
  srcImage.data.set(rgba);
  sctx.putImageData(srcImage, 0, 0);

  const dst = new OffscreenCanvas(SIDE, SIDE);
  const dctx = dst.getContext("2d");
  if (!dctx) throw new Error("no-2d");
  dctx.drawImage(src, 0, 0, w, h, 0, 0, SIDE, SIDE);
  const px = dctx.getImageData(0, 0, SIDE, SIDE).data;

  const plane = SIDE * SIDE;
  const chw = new Float32Array(3 * plane);
  for (let i = 0, p = 0; i < plane; i += 1, p += 4) {
    chw[i] = (px[p] / 255 - MEAN[0]) / STD[0];
    chw[i + plane] = (px[p + 1] / 255 - MEAN[1]) / STD[1];
    chw[i + 2 * plane] = (px[p + 2] / 255 - MEAN[2]) / STD[2];
  }
  return chw;
}

/* ENCODE ONCE. rgba is the untouched photo (read from originalRef by the
   bridge). Repeat taps reuse the cached embeddings, so the heavy pass runs
   a single time per photo. */
async function encode(msg: EncodeMsg): Promise<void> {
  if (!encoder) throw new Error("load-first");
  const buf = msg.rgba;
  const rgba =
    buf instanceof Uint8ClampedArray ? buf : new Uint8ClampedArray(buf);
  origW = msg.w;
  origH = msg.h;

  const chw = toCHW1024(rgba, msg.w, msg.h);
  const inputName = encoder.inputNames[0];
  const out = await encoder.run({
    [inputName]: new ort.Tensor("float32", chw, [1, 3, SIDE, SIDE]),
  });
  embed = out;
  post({ type: "encoded", id: msg.id });
}

/* Build the decoder feeds against the graph's REAL input names, verified
   against onnx-community/sam2-hiera-tiny-ONNX:
     input_points  [batch, 1, K, 2]   the tap, in the 1024 encode frame
     input_labels  [batch, 1, K]       1 foreground, 0 background
     input_boxes   [batch, B, 4]        empty here: points only
     image_embeddings.0/1/2             the encoder outputs, by exact name
   The three embeddings match the cache by name; points/labels/boxes match
   by pattern with the export's own ranks. Anything unrecognised is left
   UNFED on purpose: the previous handing of a spare encoder tensor to an
   unmatched input is what fed input_points a [1,32,256,256] embedding and
   made the decode throw on the shape. */
function buildFeeds(
  session: ort.InferenceSession,
  cache: Record<string, ort.Tensor>,
  nx: number,
  ny: number,
  label: 0 | 1,
): Record<string, ort.Tensor> {
  const feeds: Record<string, ort.Tensor> = {};
  const points = new ort.Tensor("float32", new Float32Array([nx * SIDE, ny * SIDE]), [1, 1, 1, 2]);
  /* input_labels is int64 on this export, not float: onnxruntime-web takes a
     BigInt64Array for that. Feeding float32 threw "expected: tensor(int64)". */
  const labels = new ort.Tensor("int64", BigInt64Array.from([BigInt(label)]), [1, 1, 1]);
  const boxes = new ort.Tensor("float32", new Float32Array(0), [1, 0, 4]);

  for (const name of session.inputNames) {
    if (cache[name]) {
      feeds[name] = cache[name];
    } else if (/label/i.test(name)) {
      feeds[name] = labels;
    } else if (/point|coord/i.test(name)) {
      feeds[name] = points;
    } else if (/box/i.test(name)) {
      feeds[name] = boxes;
    }
  }
  return feeds;
}

/* Pick the mask and the IoU tensors from the decoder outputs by name, then
   by shape: the 4D (or 3D) tensor is the masks, the small one is the IoU. */
function pickOutputs(out: Record<string, ort.Tensor>): {
  masks: ort.Tensor;
  iou: ort.Tensor | null;
} {
  let masks: ort.Tensor | null = null;
  let iou: ort.Tensor | null = null;
  for (const [name, tensor] of Object.entries(out)) {
    /* Tight names for this export: pred_masks and iou_scores. Not /score/
       or /logit/, or object_score_logits would be taken for one of them. */
    if (/iou/i.test(name)) iou = iou ?? tensor;
    else if (/mask/i.test(name)) masks = masks ?? tensor;
  }
  if (!masks) {
    for (const tensor of Object.values(out)) {
      if (tensor.dims.length >= 3) {
        masks = tensor;
        break;
      }
    }
  }
  if (!iou) {
    for (const tensor of Object.values(out)) {
      if (tensor !== masks && tensor.dims.length <= 2) {
        iou = tensor;
        break;
      }
    }
  }
  if (!masks) throw new Error("no-mask-output");
  return { masks, iou };
}

/* [.., C, H, W] with or without the batch axis. */
function maskShape(dims: readonly number[]): { count: number; mh: number; mw: number } {
  /* pred_masks is [batch, points, masks, H, W] on this export. */
  if (dims.length === 5) return { count: dims[2], mh: dims[3], mw: dims[4] };
  if (dims.length === 4) return { count: dims[1], mh: dims[2], mw: dims[3] };
  if (dims.length === 3) return { count: dims[0], mh: dims[1], mw: dims[2] };
  if (dims.length === 2) return { count: 1, mh: dims[0], mw: dims[1] };
  throw new Error("mask-shape");
}

function asFloat32(data: ort.Tensor["data"]): Float32Array {
  if (data instanceof Float32Array) return data;
  return Float32Array.from(data as ArrayLike<number>);
}

/* Bilinear-resample the low-res logits to the photo size, then threshold at
   zero: alpha opaque where the logit clears zero (foreground), transparent
   elsewhere. RGB is left white so an accidental luma read still sees the
   foreground, though alpha is the contract everything downstream clips by. */
function logitsToAlpha(
  logits: Float32Array,
  mw: number,
  mh: number,
  ow: number,
  oh: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(ow * oh * 4);
  const sx = mw / ow;
  const sy = mh / oh;
  for (let y = 0; y < oh; y += 1) {
    let fy = (y + 0.5) * sy - 0.5;
    if (fy < 0) fy = 0;
    else if (fy > mh - 1) fy = mh - 1;
    const y0 = Math.floor(fy);
    const y1 = Math.min(y0 + 1, mh - 1);
    const wy = fy - y0;
    for (let x = 0; x < ow; x += 1) {
      let fx = (x + 0.5) * sx - 0.5;
      if (fx < 0) fx = 0;
      else if (fx > mw - 1) fx = mw - 1;
      const x0 = Math.floor(fx);
      const x1 = Math.min(x0 + 1, mw - 1);
      const wx = fx - x0;

      const v00 = logits[y0 * mw + x0];
      const v01 = logits[y0 * mw + x1];
      const v10 = logits[y1 * mw + x0];
      const v11 = logits[y1 * mw + x1];
      const top = v00 + (v01 - v00) * wx;
      const bot = v10 + (v11 - v10) * wx;
      const v = top + (bot - top) * wy;

      if (v > 0) {
        const o = (y * ow + x) * 4;
        out[o] = 255;
        out[o + 1] = 255;
        out[o + 2] = 255;
        out[o + 3] = 255;
      }
    }
  }
  return out;
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read-failed"));
    reader.readAsDataURL(blob);
  });
}

async function alphaToPng(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
): Promise<string> {
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-2d");
  const image = new ImageData(w, h);
  image.data.set(rgba);
  ctx.putImageData(image, 0, 0);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return blobToDataUri(blob);
}

/* DECODE PER TAP. nx, ny are the normalized tap (0..1). Resolves the same
   payload shape the fal route returns, so the caller is unchanged. */
async function segment(msg: SegmentMsg): Promise<void> {
  if (!decoder) throw new Error("load-first");
  if (!embed) throw new Error("encode-first");
  if (!origW || !origH) throw new Error("encode-first");

  const label: 0 | 1 = msg.label === 0 ? 0 : 1;
  const feeds = buildFeeds(decoder, embed, msg.nx, msg.ny, label);
  const out = await decoder.run(feeds);

  const { masks, iou } = pickOutputs(out);
  const { count, mh, mw } = maskShape(masks.dims);
  const data = asFloat32(masks.data);
  const plane = mh * mw;

  let best = 0;
  if (iou && count > 1) {
    const scores = asFloat32(iou.data);
    let top = -Infinity;
    for (let i = 0; i < count; i += 1) {
      if (scores[i] > top) {
        top = scores[i];
        best = i;
      }
    }
  }

  const logits = data.subarray(best * plane, (best + 1) * plane);
  const alpha = logitsToAlpha(logits, mw, mh, origW, origH);
  const mask = await alphaToPng(alpha, origW, origH);

  post({
    type: "mask",
    id: msg.id,
    mask,
    maskKind: "alpha",
    width: origW,
    height: origH,
  });
}

async function handleMessage(data: InMsg): Promise<void> {
  switch (data.type) {
    case "load":
      await load(data);
      break;
    case "encode":
      await encode(data);
      break;
    case "segment":
      await segment(data);
      break;
    default:
      break;
  }
}

scope.onmessage = (ev: MessageEvent) => {
  const data = ev.data as InMsg;
  const id = "id" in data ? data.id : undefined;
  handleMessage(data).catch((err) => postError(id, err));
};
