/* The shared meters for the visualizer's paid doors. Two kinds of
   guard live here: the in-memory minute window that each route used to
   carry alone, and the durable daily spend counter in Upstash that
   survives a serverless instance dying between taps. Segment and
   analyze both drink from the same daily cup, because the cap is a
   money number, not a feature number. */

export function callerKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const first = fwd ? fwd.split(",")[0].trim() : "";
  if (first) return first;
  const real = req.headers.get("x-real-ip");
  return real ? real.trim() : "unknown";
}

export type RateLimiterOpts = {
  windowMs: number;
  perCallerMax: number;
  globalMax: number;
  now?: () => number;
};

/* One rolling window, two gates: this caller, then everyone. Each call
   to the factory gets its own books, so a route can keep a strict paid
   meter and a generous poll meter side by side. It lives only as long
   as the serverless instance; the daily counter below is the durable
   one. `now` is injectable so the tests can turn the clock by hand. */
export function makeRateLimiter(opts: RateLimiterOpts): (key: string) => boolean {
  const now = opts.now ?? Date.now;
  const callerHits = new Map<string, number[]>();
  const globalHits: number[] = [];

  return (key: string): boolean => {
    const stamp = now();
    const cutoff = stamp - opts.windowMs;

    /* Prune the shop window, oldest first. */
    while (globalHits.length && globalHits[0] < cutoff) globalHits.shift();

    /* If many addresses have passed through, sweep the idle ones so the
       map cannot grow without bound under a flood of fresh callers. */
    if (callerHits.size > 2000) {
      for (const [k, arr] of callerHits) {
        if (arr.length === 0 || arr[arr.length - 1] < cutoff) callerHits.delete(k);
      }
    }

    const prior = callerHits.get(key) ?? [];
    const mine: number[] = [];
    for (const t of prior) {
      if (t >= cutoff) mine.push(t);
    }

    /* An empty record is dropped, never stored, so an idle caller
       leaves no trace. */
    if (mine.length >= opts.perCallerMax || globalHits.length >= opts.globalMax) {
      if (mine.length) callerHits.set(key, mine);
      else callerHits.delete(key);
      return false;
    }

    mine.push(stamp);
    globalHits.push(stamp);
    callerHits.set(key, mine);
    return true;
  };
}

/* The day the counter belongs to, in UTC, so the cap turns over at the
   same moment on every box in the fleet. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dailyCap(): number {
  const raw = Number(process.env.VISUALIZER_DAILY_CAP);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 200;
}

/* The durable daily cap on paid calls, shared by segment and analyze.
   INCR then EXPIRE NX in one pipeline: the key is born with a two-day
   fuse and never has it reset, so a stale counter cleans itself up.
   Counts paid submits only; free status polls never come here.

   Missing env or a failed fetch FAILS OPEN: a boutique prefers a
   working stage over a strict meter, and the in-memory limiter above
   still guards bursts while Redis is away. */
export async function spendAllows(kind: "segment" | "analyze"): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return true;

  /* One shared counter today; the kind is in the signature so a
     per-door cap can arrive without touching the routes. */
  void kind;

  const key = `viz:spend:${dayKey(new Date())}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, "172800", "NX"],
      ]),
      signal: controller.signal,
    });
    if (!res.ok) return true;
    const rows = (await res.json()) as Array<{ result?: unknown }>;
    const count = Number(rows?.[0]?.result);
    if (!Number.isFinite(count)) return true;
    return count <= dailyCap();
  } catch {
    return true;
  } finally {
    clearTimeout(timer);
  }
}
