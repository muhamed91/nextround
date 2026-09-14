import { ai } from "@/lib/ai";
import { fallbackQuestions } from "@/lib/fallbackQuestions";
import { clientKey, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

type Body = { profession?: string; company?: string | null; avoid?: string[] };

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {}

  const profession = String(body.profession ?? "").trim().slice(0, 80) || "Allgemeine Lehrstelle";
  const company = body.company ? String(body.company).trim().slice(0, 80) : null;
  const avoid = Array.isArray(body.avoid) ? body.avoid.slice(0, 7).map((q) => String(q).slice(0, 240)) : [];

  if (!rateLimit(`interview:${clientKey(req)}`, 20, 60 * 60 * 1000)) {
    return Response.json({ questions: fallbackQuestions(profession, company), source: "fallback" });
  }

  try {
    const questions = await ai.generateInterview({ profession, company, avoid });
    return Response.json({ questions, source: "ai" });
  } catch (err) {
    console.error("[api/interview] falling back:", err instanceof Error ? err.message : err);
    return Response.json({ questions: fallbackQuestions(profession, company), source: "fallback" });
  }
}
