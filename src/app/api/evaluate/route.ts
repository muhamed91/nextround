import { ai } from "@/lib/ai";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { MAX_ANSWER_LENGTH } from "@/lib/types";

export const runtime = "nodejs";

type Body = { profession?: string; company?: string | null; question?: string; answer?: string };

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {}

  const profession = String(body.profession ?? "").trim().slice(0, 80) || "Allgemeine Lehrstelle";
  const company = body.company ? String(body.company).trim().slice(0, 80) : null;
  const question = String(body.question ?? "").trim().slice(0, 300);
  const answer = String(body.answer ?? "").trim().slice(0, MAX_ANSWER_LENGTH);

  if (!question || !answer) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  if (!rateLimit(`evaluate:${clientKey(req)}`, 60, 60 * 60 * 1000)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const evaluation = await ai.evaluateAnswer({ profession, company, question, answer });
    return Response.json(evaluation);
  } catch (err) {
    console.error("[api/evaluate]", err instanceof Error ? err.message : err);
    return Response.json({ error: "ai_unavailable" }, { status: 503 });
  }
}
