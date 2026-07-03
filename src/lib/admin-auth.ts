import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/* One owner, one credential, one signed cookie. No auth library: the
   session token is an expiry timestamp signed with AUTH_SECRET, and
   the password check hashes both sides before comparing so the
   comparison is constant-time regardless of length. Staff accounts,
   if he hires, become a table and this file grows; it does not get
   replaced. */

const COOKIE = "aumosaic_admin";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set. See .env.example.");
  return s;
}

function sign(exp: string) {
  return createHmac("sha256", secret()).update(exp).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(given: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected === "changeme") return false;
  return safeEqual(given, expected);
}

export function makeToken() {
  const exp = String(Date.now() + THIRTY_DAYS * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token: string | undefined) {
  if (!token) return false;
  const [exp, mac] = token.split(".");
  if (!exp || !mac) return false;
  if (!safeEqual(mac, sign(exp))) return false;
  return Number(exp) > Date.now();
}

export async function setSession() {
  (await cookies()).set(COOKIE, makeToken(), {
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
