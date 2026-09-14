import { ANALYTICS_EVENTS, type AnalyticsEvent } from "@/lib/analytics";
import { clientKey, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

type Body = { event?: string; props?: Record<string, unknown>; path?: string; ts?: number };

const MAX_PROPS = 20;

function sanitizeProps(input: unknown): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!input || typeof input !== "object") return out;
  for (const [k, v] of Object.entries(input as Record<string, unknown>).slice(0, MAX_PROPS)) {
    const key = k.replace(/[^a-z0-9_]/gi, "").slice(0, 40);
    if (!key) continue;
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    else if (typeof v === "boolean") out[key] = v;
    else if (typeof v === "string") out[key] = v.slice(0, 200);
  }
  return out;
}

function deviceClass(ua: string) {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

export async function POST(req: Request) {
  if (!rateLimit(`track:${clientKey(req)}`, 600, 60 * 60 * 1000)) {
    return new Response(null, { status: 204 });
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(null, { status: 204 });
  }

  const event = String(body.event ?? "") as AnalyticsEvent;
  if (!ANALYTICS_EVENTS.includes(event)) return new Response(null, { status: 204 });

  const record = {
    event,
    props: sanitizeProps(body.props),
    path: String(body.path ?? "").slice(0, 120),
    ts: new Date(typeof body.ts === "number" ? body.ts : Date.now()).toISOString(),
    country: req.headers.get("x-vercel-ip-country") ?? "",
    device: deviceClass(req.headers.get("user-agent") ?? ""),
  };

  // 1) Always visible in the Vercel runtime logs (filter for "[track]").
  console.log("[track]", JSON.stringify(record));

  // 2) Optional durable sink: any webhook that accepts JSON (Google Sheets Apps Script, Make, n8n, Supabase edge fn, …).
  const webhook = process.env.ANALYTICS_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.ANALYTICS_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.ANALYTICS_WEBHOOK_SECRET}` } : {}),
        },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(3000),
      });
    } catch (err) {
      console.warn("[track] webhook failed:", err instanceof Error ? err.message : err);
    }
  }

  return new Response(null, { status: 204 });
}
