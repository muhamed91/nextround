/**
 * AI provider abstraction. Server-only.
 * Swap the implementation of `provider` to change vendors without touching the app.
 */
import OpenAI from "openai";
import type { Evaluation, Question } from "./types";
import { QUESTION_COUNT } from "./types";

// ---------- Provider interface ----------

export type AIProvider = {
  /** Returns exactly QUESTION_COUNT questions in ONE request. */
  generateInterview(input: { profession: string; company: string | null; avoid?: string[] }): Promise<Question[]>;
  evaluateAnswer(input: { profession: string; company: string | null; question: string; answer: string }): Promise<Evaluation>;
};

// ---------- Prompts ----------

const SYSTEM_INTERVIEWER = `Du bist ein erfahrener Berufsbildner und Interviewer für Schweizer Lehrstellen.
Du führst ein realistisches Vorstellungsgespräch mit einem Jugendlichen (ca. 14–17 Jahre, Sekundarschule, meist ohne Berufserfahrung).
Sprache: Schweizer Hochdeutsch (ss statt ß), keine Anrede mit "Sie", du-Form. Kein Jugend-Slang.
Ton: locker, direkt, ermutigend – ein Coach, kein Lehrer.`;

const GENERATE_INSTRUCTIONS = `Erstelle genau ${QUESTION_COUNT} realistische Interviewfragen für ein Lehrstellen-Vorstellungsgespräch.
Regeln:
- Passend zum Lehrberuf, geeignet für 14–17-Jährige, keine Fragen für erfahrene Profis.
- Reihenfolge: 1) über dich, 2) Motivation für den Beruf, 3) Firma/Betrieb (nur firmenspezifisch, wenn eine Firma angegeben ist – sonst allgemein zum Lehrbetrieb), 4) Stärken, 5) Schwäche, 6) Teamarbeit/Situation, 7) warum gerade du.
- Jede Frage max. 20 Wörter. Kurz und klar.
- "topic": 1–3 Wörter (z. B. "Motivation", "Teamarbeit", "Warum diese Firma").
- "tip": ein kurzer, konkreter Tipp (max. 12 Wörter).`;

const EVALUATE_INSTRUCTIONS = `Bewerte die Antwort des Jugendlichen auf die Interviewfrage.
Wichtig: Die Antwort ist eine GESPROCHENE Antwort im Gespräch, die nur zur Übung getippt wurde. Rechtschreibung, Grammatik, Tippfehler, Gross-/Kleinschreibung und Zeichensetzung sind irrelevant – NICHT bewerten, NICHT erwähnen, NICHT als Verbesserung vorschlagen. Bewerte ausschliesslich den Inhalt und wie die Antwort im Gespräch wirken würde.
Bewerte NICHT nach Profi-Standards. Achte auf: Motivation, Interesse am Beruf, Zuverlässigkeit, Selbstreflexion, konkrete Beispiele (Schule, Hobbys, Projekte), Teamfähigkeit, Lernbereitschaft, Auftreten.
Sei ehrlich: sehr kurze, leere oder ausweichende Antworten bekommen einen tiefen Score (2–4). Gute, konkrete Antworten 7–9. 10 nur bei ausgezeichneten Antworten.
Nicht beleidigend, nicht demotivierend.
Ausgabe:
- score: 1–10
- positive: 1 Satz, was gut war (bei sehr schwachen Antworten: was ansatzweise da ist)
- improvement: 1 Satz, die wichtigste Verbesserung
- betterAnswer: 1–2 Sätze als Beispiel, wie eine stärkere Antwort klingen könnte, in Ich-Form, ohne erfundene Details über die Person.
Jeder Text max. 30 Wörter.`;

// ---------- JSON schemas (structured outputs) ----------

const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          topic: { type: "string" },
          tip: { type: "string" },
        },
        required: ["question", "topic", "tip"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
} as const;

const EVALUATION_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer" },
    positive: { type: "string" },
    improvement: { type: "string" },
    betterAnswer: { type: "string" },
  },
  required: ["score", "positive", "improvement", "betterAnswer"],
  additionalProperties: false,
} as const;

// ---------- Validation ----------

function clean(s: unknown, max = 300): string {
  return String(s ?? "").trim().slice(0, max);
}

export function validateQuestions(data: unknown): Question[] | null {
  if (!data || typeof data !== "object") return null;
  const list = (data as { questions?: unknown }).questions;
  if (!Array.isArray(list)) return null;
  const out: Question[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const q = clean((item as Question).question, 240);
    if (q.length < 8) continue;
    out.push({
      question: q,
      topic: clean((item as Question).topic, 40) || "Allgemein",
      tip: clean((item as Question).tip, 120) || "Sei ehrlich und nenne konkrete Beispiele.",
    });
  }
  return out.length >= QUESTION_COUNT ? out.slice(0, QUESTION_COUNT) : null;
}

export function validateEvaluation(data: unknown): Evaluation | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Partial<Evaluation>;
  const score = Math.round(Number(d.score));
  if (!Number.isFinite(score) || score < 1 || score > 10) return null;
  const positive = clean(d.positive);
  const improvement = clean(d.improvement);
  const betterAnswer = clean(d.betterAnswer, 400);
  if (!positive || !improvement) return null;
  return { score, positive, improvement, betterAnswer };
}

// ---------- OpenAI implementation ----------

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

let client: OpenAI | null = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
  client ??= new OpenAI({ timeout: 45_000, maxRetries: 1 });
  return client;
}

async function askJSON(params: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  maxTokens: number;
}): Promise<unknown> {
  const res = await getClient().chat.completions.create({
    model: MODEL,
    max_completion_tokens: params.maxTokens,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: params.schemaName, strict: true, schema: params.schema },
    },
  });

  const choice = res.choices[0];
  if (!choice || choice.message.refusal) throw new Error("AI refused the request");
  const text = choice.message.content;
  if (!text) throw new Error("AI returned no text");
  return JSON.parse(text);
}

const openaiProvider: AIProvider = {
  async generateInterview({ profession, company, avoid }) {
    const context = [
      `Lehrberuf: ${profession}`,
      company ? `Unternehmen: ${company}` : "Unternehmen: nicht angegeben (keine firmenspezifischen Fragen).",
      avoid && avoid.length > 0
        ? `Diese Fragen wurden schon gestellt – formuliere andere Fragen:\n- ${avoid.join("\n- ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const data = await askJSON({
      system: `${SYSTEM_INTERVIEWER}\n\n${GENERATE_INSTRUCTIONS}`,
      user: context,
      schemaName: "interview_questions",
      schema: QUESTIONS_SCHEMA,
      maxTokens: 1200,
    });
    const questions = validateQuestions(data);
    if (!questions) throw new Error("Invalid questions from AI");
    return questions;
  },

  async evaluateAnswer({ profession, company, question, answer }) {
    const user = [
      `Lehrberuf: ${profession}`,
      company ? `Unternehmen: ${company}` : "",
      `Frage: ${question}`,
      `Antwort des Jugendlichen:\n"""\n${answer}\n"""`,
    ]
      .filter(Boolean)
      .join("\n");

    const data = await askJSON({
      system: `${SYSTEM_INTERVIEWER}\n\n${EVALUATE_INSTRUCTIONS}`,
      user,
      schemaName: "answer_evaluation",
      schema: EVALUATION_SCHEMA,
      maxTokens: 400,
    });
    const evaluation = validateEvaluation(data);
    if (!evaluation) throw new Error("Invalid evaluation from AI");
    return evaluation;
  },
};

export const ai: AIProvider = openaiProvider;
