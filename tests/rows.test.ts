import test from "node:test";
import assert from "node:assert/strict";
import { rowsOf } from "../src/db";

/* The driver envelope that reached production once: neon-http answers
   a raw execute with an object carrying rows, the query builder with
   a plain array. rowsOf is the one normaliser; here its promise is
   pinned. Importing the module is safe because getDb stays lazy. */

test("rowsOf reads both driver shapes", () => {
  assert.deepEqual(rowsOf<number>([1, 2]), [1, 2]);
  assert.deepEqual(rowsOf<number>({ rows: [3] }), [3]);
});

test("rowsOf answers empty for an envelope with no rows", () => {
  assert.deepEqual(rowsOf<number>({}), []);
});
