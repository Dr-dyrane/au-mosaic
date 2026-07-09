import test from "node:test";
import assert from "node:assert/strict";
import { phone234, waChat } from "../src/lib/backoffice";

/* One number, one person: the phone key is the dedupe gate and the
   WhatsApp door, so the normaliser must read every way a Nigerian
   number is written. */

test("phone234 normalises the three shapes to one key", () => {
  assert.equal(phone234("0803 555 1234"), "2348035551234");
  assert.equal(phone234("+234-803-555-1234"), "2348035551234");
  assert.equal(phone234("8035551234"), "2348035551234");
  assert.equal(phone234("2348035551234"), "2348035551234");
});

test("the same line always folds to the same key", () => {
  const forms = ["08035551234", "+234 803 555 1234", "234 (803) 555 1234"];
  const keys = new Set(forms.map(phone234));
  assert.equal(keys.size, 1);
});

test("waChat opens the customer's own chat, text encoded", () => {
  assert.equal(
    waChat("08035551234", "How much?"),
    "https://wa.me/2348035551234?text=How%20much%3F"
  );
  assert.equal(waChat("08035551234"), "https://wa.me/2348035551234");
});
