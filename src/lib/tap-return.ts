export const TAP_RETURN_PARAMS = ["wa_src", "wa_i", "wa_y"] as const;

const TAP_ORIGIN = "https://tap-return.local";

export type TapReturn = {
  path: string | null;
  returnPath: string | null;
};

export function cleanInternalPath(value: unknown, limit = 260): string | null {
  const raw = String(value ?? "").trim().slice(0, limit);
  if (!raw || raw.startsWith("//")) return null;
  try {
    const url = new URL(raw, TAP_ORIGIN);
    if (url.origin !== TAP_ORIGIN) return null;
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith("/") && !path.startsWith("//") ? path.slice(0, limit) : null;
  } catch {
    return null;
  }
}

export function stripTapReturnParams(path: string): string {
  const url = new URL(path, TAP_ORIGIN);
  for (const key of TAP_RETURN_PARAMS) url.searchParams.delete(key);
  const search = url.searchParams.toString();
  return `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
}

export function withTapReturnParams(path: string, source: string, index: number, y: number): string {
  const url = new URL(cleanInternalPath(path) ?? "/", TAP_ORIGIN);
  for (const key of TAP_RETURN_PARAMS) url.searchParams.delete(key);
  url.searchParams.set("wa_src", source.slice(0, 40));
  url.searchParams.set("wa_i", String(Math.max(0, index)));
  url.searchParams.set("wa_y", String(Math.max(0, Math.round(y))));
  return `${url.pathname}${url.search}${url.hash}`;
}

export function buildTapMessage(source: string, path: string | null, returnPath: string | null): string {
  const cleanPath = path ? stripTapReturnParams(path) : null;
  if (cleanPath && returnPath) return `Tapped from ${source} on ${cleanPath}. Return: ${returnPath}`;
  if (cleanPath) return `Tapped on ${cleanPath}`;
  if (returnPath) return `Tapped from ${source}. Return: ${returnPath}`;
  return "";
}

export function tapReturnFromMessage(message: string): TapReturn {
  const returnMarker = " Return: ";
  const returnIndex = message.lastIndexOf(returnMarker);
  const returnPath =
    returnIndex >= 0 ? cleanInternalPath(message.slice(returnIndex + returnMarker.length)) : null;
  const sentence = returnIndex >= 0 ? message.slice(0, returnIndex) : message;
  const onIndex = sentence.lastIndexOf(" on ");
  const rawPath = onIndex >= 0 ? sentence.slice(onIndex + 4).replace(/\.$/, "") : "";
  const path = cleanInternalPath(rawPath) ?? (returnPath ? stripTapReturnParams(returnPath) : null);

  return {
    path,
    returnPath,
  };
}
