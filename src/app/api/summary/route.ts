import { ai } from "@/lib/ai";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { MAX_ANSWER_LENGTH, QUESTION_COUNT } from "@/lib/types";

export const runtime = "nodejs";

type Item = { question?: string; category?: string; score?: number; answer?: string; improvement?: string };
type Body = { profession?: string; company?: string | null; items?: Item[] };

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {}

  const profession = String(body.profession ?? "").trim().slice(0, 80) || "Allgemeine Lehrstelle";
  const company = body.company ? String(body.company).trim().slice(0, 80) : null;
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, QUESTION_COUNT).map((it) => ({
    question: String(it.question ?? "").trim().slice(0, 300),
    category: String(it.category ?? "").trim().slice(0, 30) || "general",
    score: Math.min(10, Math.max(1, Math.round(Number(it.score) || 1))),
    answer: String(it.answer ?? "").trim().slice(0, MAX_ANSWER_LENGTH) || "(keine Antwort gespeichert)",
    improvement: String(it.improvement ?? "").trim().slice(0, 300),
  }));

  if (items.length === 0 || items.some((it) => !it.question)) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  if (!rateLimit(`summary:${clientKey(req)}`, 20, 60 * 60 * 1000)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const summary = await ai.summarizeInterview({ profession, company, items });
    return Response.json(summary);
  } catch (err) {
    console.error("[api/summary]", err instanceof Error ? err.message : err);
    return Response.json({ error: "ai_unavailable" }, { status: 503 });
  }
}
