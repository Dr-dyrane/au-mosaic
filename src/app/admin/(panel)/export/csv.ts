/* CSV for the accountant, house rules: session-checked, kobo turned
   to naira with integer arithmetic (never floats), a BOM so Excel
   reads names right, and the date in the filename. Neutral file:
   both export routes read from here. */

export function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvLine(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",");
}

/* 1234567 kobo becomes "12345.67": digits split, never divided. */
export function nairaPlain(kobo: number): string {
  const sign = kobo < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(kobo));
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function ymd(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

export function csvResponse(name: string, lines: string[]): Response {
  const today = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="aumosaic-${name}-${today}.csv"`,
      "cache-control": "no-store",
    },
  });
}
