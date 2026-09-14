/**
 * Minimal Upstash Redis REST client (no dependency). Used for the built-in stats dashboard.
 * Configure via UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Vercel Marketplace also injects KV_REST_API_URL/TOKEN).
 */
type Cmd = Array<string | number>;

/** Find an env var by exact name or with any prefix Vercel adds (e.g. "nextround_KV_REST_API_URL"). */
function envVar(...names: string[]): string | undefined {
  for (const n of names) {
    if (process.env[n]) return process.env[n];
    const hit = Object.keys(process.env).find((k) => k.endsWith(`_${n}`) && process.env[k]);
    if (hit) return process.env[hit];
  }
  return undefined;
}

function config() {
  const url = envVar("UPSTASH_REDIS_REST_URL", "KV_REST_API_URL");
  const token = envVar("UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN");
  return url && token ? { url, token } : null;
}

export function storeConfigured() {
  return config() !== null;
}

/** Run several commands in one round trip. Returns the result per command (or null on failure). */
export async function pipeline<T = unknown>(cmds: Cmd[]): Promise<T[] | null> {
  const c = config();
  if (!c || cmds.length === 0) return null;
  try {
    const res = await fetch(`${c.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmds),
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);
    const data = (await res.json()) as Array<{ result?: T; error?: string }>;
    return data.map((d) => (d.error ? (null as T) : (d.result as T)));
  } catch (err) {
    console.warn("[store]", err instanceof Error ? err.message : err);
    return null;
  }
}

/** YYYY-MM-DD in Swiss local time, so "today" matches what the user expects. */
export function dayKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function lastDays(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(dayKey(new Date(Date.now() - i * 86_400_000)));
  return out;
}
