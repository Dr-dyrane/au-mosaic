import test from "node:test";
import assert from "node:assert/strict";
import { naira, parseNaira } from "../src/lib/backoffice";
import { csvCell, csvLine, nairaPlain, ymd } from "../src/app/admin/(panel)/export/csv";

/* The money math. Kobo in the book, naira in the hand, and the two
   crossing points must never lose a digit. These are the paths the
   benchmark named first: money, exact, always. */

test("parseNaira reads the forms people actually type", () => {
  assert.equal(parseNaira("250,000"), 25_000_000);
  assert.equal(parseNaira("₦250000"), 25_000_000);
  assert.equal(parseNaira("250000.50"), 25_000_050);
  assert.equal(parseNaira(" 12,345.67 "), 1_234_567);
  assert.equal(parseNaira("0.1"), 10);
});

test("parseNaira refuses what is not money", () => {
  assert.equal(parseNaira("abc"), 0);
  assert.equal(parseNaira("-500"), 0);
  assert.equal(parseNaira(""), 0);
});

test("naira formats whole naira from kobo", () => {
  assert.equal(naira(25_000_000), "₦250,000");
  assert.equal(naira(0), "₦0");
});

test("nairaPlain splits digits, never divides", () => {
  assert.equal(nairaPlain(1_234_567), "12345.67");
  assert.equal(nairaPlain(1), "0.01");
  assert.equal(nairaPlain(0), "0.00");
  assert.equal(nairaPlain(-50), "-0.50");
  assert.equal(nairaPlain(200), "2.00");
});

test("csvCell guards spreadsheet formulas and quotes", () => {
  assert.equal(csvCell("=SUM(A1)"), "'=SUM(A1)");
  assert.equal(csvCell("+2348035551234"), "'+2348035551234");
  assert.equal(csvCell("-5"), "'-5");
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("plain"), "plain");
});

test("csvLine joins cells with their guards on", () => {
  assert.equal(csvLine(["a", "b,c", 5]), 'a,"b,c",5');
});

test("ymd stamps a date the filename way", () => {
  assert.equal(ymd("2026-07-08T10:00:00Z"), "2026-07-08");
});
