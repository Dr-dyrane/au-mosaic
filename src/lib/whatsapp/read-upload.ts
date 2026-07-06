import { inflateRawSync } from "node:zlib";

/* A WhatsApp export arrives two ways. Android without media can hand
   you the .txt straight. Otherwise, and on iPhone, it is a .zip:
   _chat.txt beside the photos. This reads either into the chat text
   and ignores any media inside. No dependency; it walks the zip's own
   central directory and inflates with Node's built-in zlib. */

const EOCD_SIG = 0x06054b50;
const CEN_SIG = 0x02014b50;

type Entry = { name: string; method: number; compSize: number; localOff: number };

export function isZip(bytes: Uint8Array): boolean {
  return (
    bytes.length > 3 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  );
}

/* Bytes of an upload, out the chat text. A bare .txt comes back as
   itself; a .zip gives up its _chat.txt, or the first .txt it holds. */
export function extractChatText(input: Uint8Array): string {
  const buf = Buffer.from(input);
  if (!isZip(buf)) return stripBom(buf.toString("utf8"));

  const entries = listEntries(buf);
  const pick =
    entries.find((e) => e.name.toLowerCase().endsWith("_chat.txt")) ??
    entries.find((e) => e.name.toLowerCase().endsWith(".txt"));
  if (!pick) throw new Error("no-chat-text-in-zip");
  return stripBom(inflateEntry(buf, pick).toString("utf8"));
}

function stripBom(s: string): string {
  return s.replace(/^﻿/, "");
}

/* The end-of-central-directory record sits near the tail, after an
   optional comment. Scan back for its signature. */
function findEocd(buf: Buffer): number {
  const floor = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= floor; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i;
  }
  throw new Error("not-a-zip");
}

/* Read the directory only, not the data: name, method, size, and
   where each file's local header sits. Cheap, so a zip full of photos
   costs nothing until we inflate the one text we want. */
function listEntries(buf: Buffer): Entry[] {
  const eocd = findEocd(buf);
  const count = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16);
  const out: Entry[] = [];
  for (let i = 0; i < count; i++) {
    if (ptr + 46 > buf.length || buf.readUInt32LE(ptr) !== CEN_SIG) break;
    const method = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOff = buf.readUInt32LE(ptr + 42);
    const name = buf.toString("utf8", ptr + 46, ptr + 46 + nameLen);
    out.push({ name, method, compSize, localOff });
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/* The local header carries its own name and extra lengths, so the
   data start is only known once we read it. Store (0) is raw; deflate
   (8) inflates. WhatsApp uses one of these two. */
function inflateEntry(buf: Buffer, e: Entry): Buffer {
  const nameLen = buf.readUInt16LE(e.localOff + 26);
  const extraLen = buf.readUInt16LE(e.localOff + 28);
  const start = e.localOff + 30 + nameLen + extraLen;
  const raw = buf.subarray(start, start + e.compSize);
  if (e.method === 0) return Buffer.from(raw);
  if (e.method === 8) return inflateRawSync(raw);
  throw new Error(`unsupported-zip-method-${e.method}`);
}
