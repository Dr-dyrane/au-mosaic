/* JSON for a script tag, made safe for one: JSON.stringify escapes
   quotes but not the two sequences that can close or reopen a
   script element, so a piece named after </script> could break out
   of the tag now that names flow from the book. Every structured
   data block walks through here. */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
