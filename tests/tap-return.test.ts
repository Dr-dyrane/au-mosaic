import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTapMessage,
  cleanInternalPath,
  stripTapReturnParams,
  tapReturnFromMessage,
  withTapReturnParams,
} from "../src/lib/tap-return";

/* The tap receipt: a same-site return path rides the enquiry message
   and must never open a door off the house. These codify the helper
   checks earlier passes ran by hand. */

test("withTapReturnParams writes the receipt and keeps the hash", () => {
  assert.equal(
    withTapReturnParams("/mosaic-tiles", "hero", 0, 0),
    "/mosaic-tiles?wa_src=hero&wa_i=0&wa_y=0"
  );
  assert.equal(
    withTapReturnParams("/piece/solid-colour-glass?shade=blue#buy", "card", 2, 640),
    "/piece/solid-colour-glass?shade=blue&wa_src=card&wa_i=2&wa_y=640#buy"
  );
});

test("stripTapReturnParams removes only the receipt", () => {
  assert.equal(
    stripTapReturnParams("/p?wa_src=hero&wa_i=2&wa_y=10&keep=1"),
    "/p?keep=1"
  );
});

test("cleanInternalPath refuses every road out of the house", () => {
  assert.equal(cleanInternalPath("https://evil.example/x"), null);
  assert.equal(cleanInternalPath("//evil.example"), null);
  assert.equal(cleanInternalPath("/piece/x?a=1#buy"), "/piece/x?a=1#buy");
});

test("the message round-trips: build, then read back", () => {
  const returnPath = withTapReturnParams("/mosaic-tiles", "hero", 0, 0);
  const message = buildTapMessage("hero", returnPath, returnPath);
  const read = tapReturnFromMessage(message);
  assert.equal(read.path, "/mosaic-tiles");
  assert.equal(read.returnPath, returnPath);
});
