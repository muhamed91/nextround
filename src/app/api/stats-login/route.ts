import { clientKey, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STATS_SECRET;
  if (!secret) return new Response(null, { status: 404 });
  if (!rateLimit(`stats-login:${clientKey(req)}`, 10, 15 * 60 * 1000)) return new Response(null, { status: 429 });

  let password = "";
  try {
    password = String(((await req.json()) as { password?: string }).password ?? "");
  } catch {}
  if (password !== secret) return new Response(null, { status: 401 });

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": `nextround_stats=${encodeURIComponent(secret)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86_400}${secure}`,
    },
  });
}
