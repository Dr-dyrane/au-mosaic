import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/* One house, many keys. The owner's master key stays in the Vercel
   environment; staff keys live in the staff table as HMAC hashes,
   never plain. The session cookie is an expiry plus the holder's
   name, signed with AUTH_SECRET; the old two-part cookie still
   verifies as the owner, so the upgrade signs nobody out. No auth
   library: this file grew, as promised, instead of being replaced. */

const COOKIE = "aumosaic_admin";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export type Who = { id: string | null; name: string; role: "owner" | "staff" };
export const OWNER: Who = { id: null, name: "The owner", role: "owner" };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set. See .env.example.");
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function b64(s: string) {
  return Buffer.from(s, "utf8").toString("base64url");
}

function unb64(s: string) {
  try {
    return Buffer.from(s, "base64url").toString("utf8");
  } catch {
    return "";
  }
}

export function checkPassword(given: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected === "changeme") return false;
  return safeEqual(given, expected);
}

/* Staff keys are peppered with the house secret before they rest. */
export function hashStaffKey(key: string) {
  return createHmac("sha256", secret()).update(`staff:${key}`).digest("hex");
}

export function makeToken(who: Who = OWNER) {
  const exp = String(Date.now() + THIRTY_DAYS * 1000);
  const w = b64(JSON.stringify(who));
  return `${exp}.${w}.${sign(`${exp}.${w}`)}`;
}

/* Who holds this token, or null. Two parts is the old owner cookie;
   three parts names its holder. */
export function parseToken(token: string | undefined): Who | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length === 2) {
    const [exp, mac] = parts;
    if (!exp || !mac || !safeEqual(mac, sign(exp))) return null;
    return Number(exp) > Date.now() ? OWNER : null;
  }
  if (parts.length === 3) {
    const [exp, w, mac] = parts;
    if (!exp || !w || !mac || !safeEqual(mac, sign(`${exp}.${w}`))) return null;
    if (Number(exp) <= Date.now()) return null;
    try {
      const who = JSON.parse(unb64(w)) as Who;
      if (
        who &&
        typeof who.name === "string" &&
        (who.role === "owner" || who.role === "staff")
      ) {
        return { id: typeof who.id === "string" ? who.id : null, name: who.name, role: who.role };
      }
    } catch {}
    return null;
  }
  return null;
}

export function verifyToken(token: string | undefined) {
  return parseToken(token) !== null;
}

export async function setSession(who: Who = OWNER) {
  (await cookies()).set(COOKIE, makeToken(who), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: THIRTY_DAYS,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function hasSession() {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}

/* Who is holding the door open right now, or null. */
export async function whoAmI(): Promise<Who | null> {
  return parseToken((await cookies()).get(COOKIE)?.value);
}

/* Only the owner may pass the destructive doors. Resolves the current
   holder, returns null when it is the owner so the caller proceeds,
   otherwise a refusal the caller returns as its own result. Shared so
   the key rack, the ledger delete, and the history wipe all read the
   one rule. */
export async function ownerOnly(): Promise<{ ok: false; message: string } | null> {
  const who = await whoAmI();
  if (!who) return { ok: false, message: "Signed out. Sign in again." };
  if (who.role !== "owner") return { ok: false, message: "Only the owner can do that." };
  return null;
}
