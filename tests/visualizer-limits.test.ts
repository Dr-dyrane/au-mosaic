import test from "node:test";
import assert from "node:assert/strict";
import { dayKey, makeRateLimiter } from "../src/lib/visualizer-limits";
import { readImageSize } from "../src/lib/visualizer-sam";

/* The meters on the paid doors. A caller gets a window, the shop gets
   a window, and the day gets a name in UTC so every box turns the page
   at the same midnight. The clock is injected so the tests can turn it
   by hand. */

test("the per caller window fills, refuses, then breathes again", () => {
  let clock = 1_000;
  const allows = makeRateLimiter({
    windowMs: 60_000,
    perCallerMax: 2,
    globalMax: 100,
    now: () => clock,
  });

  assert.equal(allows("lagos"), true);
  clock += 1_000;
  assert.equal(allows("lagos"), true);
  clock += 1_000;
  assert.equal(allows("lagos"), false);

  /* The first stamp falls out of the window and the door opens. */
  clock = 62_000;
  assert.equal(allows("lagos"), true);
});

test("the shop gate holds even when each caller is polite", () => {
  let clock = 1_000;
  const allows = makeRateLimiter({
    windowMs: 60_000,
    perCallerMax: 10,
    globalMax: 3,
    now: () => clock,
  });

  assert.equal(allows("a"), true);
  assert.equal(allows("b"), true);
  assert.equal(allows("c"), true);
  assert.equal(allows("d"), false);

  /* The whole minute evicts and the fourth caller gets a turn. */
  clock = 70_000;
  assert.equal(allows("d"), true);
});

test("a refusal never spends a stamp", () => {
  let clock = 1_000;
  const allows = makeRateLimiter({
    windowMs: 60_000,
    perCallerMax: 1,
    globalMax: 100,
    now: () => clock,
  });

  assert.equal(allows("x"), true);
  assert.equal(allows("x"), false);
  assert.equal(allows("x"), false);
  clock = 62_000;
  assert.equal(allows("x"), true);
});

test("dayKey names the day in UTC across midnight", () => {
  assert.equal(dayKey(new Date("2026-07-09T23:59:59.999Z")), "2026-07-09");
  assert.equal(dayKey(new Date("2026-07-10T00:00:00.000Z")), "2026-07-10");
  assert.equal(dayKey(new Date("2026-07-09T12:00:00Z")), "2026-07-09");
});

/* The header readers. A hand built PNG and a hand built JPEG walk, so
   the route can refuse a tap that points outside the photo before any
   money moves. */

function minimalPng(width: number, height: number): string {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write("IHDR", 12, "ascii");
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  b[24] = 8; // bit depth
  b[25] = 6; // colour type RGBA
  return b.toString("base64");
}

function syntheticJpeg(width: number, height: number): string {
  const parts: number[] = [0xff, 0xd8];
  /* APP0, sixteen bytes of payload the walker must step over. */
  parts.push(0xff, 0xe0, 0x00, 0x10);
  for (let i = 0; i < 14; i += 1) parts.push(0x4a);
  /* DHT sits inside the SOF range and must not be read as a frame. */
  parts.push(0xff, 0xc4, 0x00, 0x04, 0x00, 0x00);
  /* SOF0 at last: length, precision, height, width, one component. */
  parts.push(0xff, 0xc0, 0x00, 0x08, 0x08);
  parts.push((height >> 8) & 0xff, height & 0xff);
  parts.push((width >> 8) & 0xff, width & 0xff);
  parts.push(0x01);
  return Buffer.from(parts).toString("base64");
}

test("readImageSize reads a PNG header", () => {
  assert.deepEqual(readImageSize(minimalPng(768, 512), "image/png"), {
    width: 768,
    height: 512,
  });
});

test("readImageSize walks JPEG segments to the frame", () => {
  assert.deepEqual(readImageSize(syntheticJpeg(640, 480), "image/jpeg"), {
    width: 640,
    height: 480,
  });
});

test("readImageSize refuses what it cannot read", () => {
  assert.equal(readImageSize("bm90IGFuIGltYWdl", "image/jpeg"), null);
  assert.equal(readImageSize(minimalPng(100, 100), "image/webp"), null);
  assert.equal(readImageSize(syntheticJpeg(10, 10), "image/png"), null);
});
