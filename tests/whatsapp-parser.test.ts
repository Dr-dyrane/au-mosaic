import test from "node:test";
import assert from "node:assert/strict";
import { customerWords, parseChat } from "../src/lib/whatsapp/parse-export";

/* The WhatsApp parser, the third path the benchmark named. iPhone
   brackets its timestamps, Android bare-writes them, both may run
   12-hour, and system notices carry no colon. The engine must only
   ever see the customer's words. */

const IPHONE = [
  "[12/07/2026, 14:30:00] Messages and calls are end-to-end encrypted. No one outside of this chat can read them.",
  "[12/07/2026, 14:32:11] Ada: 20 sheets of tiny seed gold",
  "and the white one too",
  "[12/07/2026, 14:33:02] Nonso: On the way",
  "[12/07/2026, 14:34:00] Ada: <attached: 00000012-PHOTO-2026-07-12-14-34-00.jpg>",
].join("\n");

const ANDROID = [
  "12/07/2026, 14:30 - Messages and calls are end-to-end encrypted.",
  "12/07/2026, 14:32 - Ada: How much is silver crystal",
  "12/07/2026, 14:33 - Nonso: Depends on the size",
].join("\n");

test("iPhone exports parse: senders, continuations, system lines", () => {
  const { participants, messages } = parseChat(IPHONE);
  assert.deepEqual(participants, ["Ada", "Nonso"]);
  assert.equal(messages[0].system, true);
  assert.equal(messages[0].sender, null);
  assert.equal(messages[1].sender, "Ada");
  assert.equal(messages[1].text, "20 sheets of tiny seed gold\nand the white one too");
});

test("Android exports parse the bare-dash head", () => {
  const { participants, messages } = parseChat(ANDROID);
  assert.deepEqual(participants, ["Ada", "Nonso"]);
  assert.equal(messages[1].sender, "Ada");
  assert.equal(messages[1].text, "How much is silver crystal");
});

test("12-hour timestamps still open a message", () => {
  const { messages } = parseChat("[12/07/2026, 2:32:11 PM] Ada: ok");
  assert.equal(messages[0].sender, "Ada");
  assert.equal(messages[0].text, "ok");
});

test("customerWords keeps only the customer, drops media stubs", () => {
  const { customerName, text } = customerWords(IPHONE, "Nonso");
  assert.equal(customerName, "Ada");
  assert.ok(text.includes("20 sheets of tiny seed gold"));
  assert.ok(!text.includes("On the way"));
  assert.ok(!text.includes("attached"));
});
