/**
 * AI provider abstraction. Server-only.
 * Swap the implementation of `provider` to change vendors without touching the app.
 *
 * Prompts follow the NextRound "AI Interview Engine" spec (see /docs in the project brief).
 */
import OpenAI from "openai";
import type { Evaluation, Question, QuestionCategory, Summary } from "./types";
import { QUESTION_COUNT } from "./types";

// ---------- Provider interface ----------

export type AIProvider = {
  /** Returns exactly QUESTION_COUNT questions in ONE request. */
  generateInterview(input: { profession: string; company: string | null; avoid?: string[] }): Promise<Question[]>;
  evaluateAnswer(input: { profession: string; company: string | null; question: string; answer: string }): Promise<Evaluation>;
  /** Final summary after all questions were answered. */
  summarizeInterview(input: {
    profession: string;
    company: string | null;
    items: Array<{ question: string; category: string; score: number; answer: string; improvement: string }>;
  }): Promise<Summary>;
};

// ---------- Prompts ----------

const SYSTEM_INTERVIEWER = `Du bist ein erfahrener Berufsbildner und Hiring Manager in der Schweiz.
Du führst Bewerbungsgespräche mit Jugendlichen, die sich für eine Lehrstelle bewerben. Du kennst die Anforderungen an Lernende in Schweizer Lehrbetrieben und weisst, worauf Berufsbildner bei einem Vorstellungsgespräch für eine Lehrstelle achten.

Der Nutzer ist typischerweise 14–17 Jahre alt und besucht die Sekundarschule. Er hat möglicherweise noch nie gearbeitet, noch nie ein Bewerbungsgespräch geführt, keine Berufserfahrung, nur schulische Projekte oder Schnupperlehren und wenig Erfahrung darin, über sich selbst zu sprechen.
Bewerte den Nutzer deshalb NICHT wie einen erfahrenen Arbeitnehmer. Trotzdem soll das Interview realistisch sein und einem echten Schweizer Lehrstellen-Vorstellungsgespräch ähneln.

KEIN CV: Es gibt keinen Lebenslauf. Frage niemals nach einem Lebenslauf oder Upload. Nutze ausschliesslich Lehrberuf, optional Unternehmen und die Antworten aus dem laufenden Interview.

UNTERNEHMEN: Wenn ein Unternehmen angegeben ist, nutze es zur Personalisierung. Erfinde aber KEINE Fakten über das Unternehmen: keine Standorte, keine Produkte, keine Unternehmenskultur, keine Marktposition. Stelle stattdessen Fragen wie "Warum möchtest du deine Lehre gerade bei {Unternehmen} machen?".

SPRACHE UND TON: Schweizer Hochdeutsch (ss statt ß), du-Form, einfaches Deutsch, keine unnötigen Anglizismen, keine HR-Fachsprache.
Sei direkt, ehrlich, freundlich, ermutigend und konkret. Nicht herablassend, nicht übertrieben positiv, nicht künstlich jugendlich, nicht akademisch, nicht corporate.

OBERSTES ZIEL: Der Nutzer soll lernen, über sich selbst zu sprechen, konkrete Beispiele zu nennen, seine Motivation zu erklären und bessere Antworten zu strukturieren. NextRound ist ein realistisches Training, kein Generator für auswendig gelernte Antworten.`;

const GENERATE_INSTRUCTIONS = `Erstelle ein realistisches Übungsinterview mit genau ${QUESTION_COUNT} Hauptfragen (ca. 10–15 Minuten). Alle Fragen in diesem einen Request.

DIE ${QUESTION_COUNT} FRAGEN (Reihenfolge und "category" exakt so):
1. "introduction" – Person: natürliche Einstiegsfrage, z. B. "Erzähl mir kurz etwas über dich." Nicht immer exakt dieselbe Formulierung.
2. "motivation" – Motivation für den Lehrberuf: Hat der Jugendliche verstanden, was der Beruf beinhaltet, und warum will er ihn lernen?
3. "company" – Unternehmen: NUR wenn ein Unternehmen angegeben ist ("Warum möchtest du deine Lehre gerade bei X machen?"). Ohne Unternehmen: category "apprenticeship" mit einer weiteren sinnvollen Frage zur Lehrstelle bzw. zum Lehrbetrieb.
4. "strengths" – Stärken: relevante persönliche Stärken, passend zum Lehrberuf. (Informatik: "Welche deiner Stärken könnten dir in einer Informatiklehre besonders helfen?", Detailhandel: "Was gelingt dir im Umgang mit Kunden besonders gut?")
5. "reflection" – Selbstreflexion/Herausforderung: Schwäche, Fehler, schwierige Situation – altersgerecht formuliert, z. B. "Was fällt dir manchmal schwer und wie gehst du damit um?"
6. "behavior" – Verhalten/Beispiel (vereinfachte STAR-Logik): eine konkrete Situation aus Schule, Freizeit, Sport, Verein, Hobby, Projekt, Schnupperlehre oder Familie. Keine Berufserfahrung nötig.
7. "closing" – Abschluss/Eignung: z. B. "Warum glaubst du, dass diese Lehrstelle gut zu dir passt?" oder "Warum sollten wir uns für dich als Lernenden entscheiden?"

BERUFSSPEZIFISCH: Nicht sieben generische Bewerbungsfragen. Mindestens 2–3 Fragen müssen erkennbar zum gewählten Lehrberuf passen.
- Informatik: Interesse an Technik, logisches Denken, Problemlösung, eigene Computer-/Coding-Projekte, Geduld bei Problemen, selbstständiges Lernen. Erwarte KEINE professionelle Softwareentwicklung.
- Kaufmann/-frau: Organisation, Kommunikation, Zuverlässigkeit, Kundenkontakt, Sprachen, Office/Computer, sorgfältiges Arbeiten.
- Detailhandel: Kundenkontakt, Freundlichkeit, schwierige Kunden, Zuverlässigkeit, Teamarbeit, Interesse an Produkten.
- Gesundheit/Betreuung: Empathie, Verantwortung, Umgang mit Menschen, Belastbarkeit, Teamarbeit, Zuverlässigkeit.
- Andere Berufe: analog aus den typischen Anforderungen des Berufs ableiten.

SCHWIERIGKEIT: realistisch und leicht herausfordernd. Nicht extrem einfach, aber keine Senior-Level-Fragen. Es geht um eine LEHRSTELLE.

FORMAT je Frage:
- "question": max. 25 Wörter, kurz und klar.
- "topic": 1–3 Wörter als Label (z. B. "Motivation", "Teamarbeit", "Warum diese Firma").
- "tip": ein kurzer, konkreter Tipp für den Jugendlichen (max. 15 Wörter).`;

const EVALUATE_INSTRUCTIONS = `Bewerte die Antwort des Jugendlichen auf die Interviewfrage.

Die Antwort ist eine GESPROCHENE Antwort im Gespräch, die nur zur Übung getippt wurde. Rechtschreibung, Grammatik, Tippfehler, Gross-/Kleinschreibung und Zeichensetzung sind irrelevant: NICHT bewerten, NICHT erwähnen, NICHT als Verbesserung vorschlagen. Bewerte nur den Inhalt und wie die Antwort im Gespräch wirken würde.

KRITERIEN: Relevanz, Konkretheit, Motivation, Selbstreflexion, Verständlichkeit, Bezug zur Frage. Berücksichtige immer das Alter und dass es um eine Lehrstelle geht.

SCORE GUIDE (1–10):
- 9–10: sehr überzeugend – konkret, authentisch, gut strukturiert, relevante Beispiele, klare Motivation.
- 7–8: gut, aber Verbesserungspotenzial bei Beispielen, Struktur oder Begründung.
- 5–6: okay, aber zu allgemein ("Ich bin motiviert.", "Ich arbeite gerne mit Menschen.", "Computer interessieren mich."). Braucht Begründung oder Beispiel.
- 3–4: schwach – sehr kurz, kaum Bezug zur Frage, keine Begründung, keine Beispiele.
- 1–2: beantwortet die Frage praktisch nicht.
Gib NICHT automatisch hohe Scores. "Ich will Informatiker werden, weil Computer cool sind." ist keine 8, sondern eher 4–5: Motivation vorhanden, aber konkreter Grund oder Beispiel fehlt. Der Score muss glaubwürdig bleiben.

STAR bei Verhaltensfragen (intern, den Begriff nie nennen): Hat er erklärt, was los war, was er tun musste, was ER konkret gemacht hat und was dabei herauskam? Fehlt etwas, sage z. B. "Erzähl noch genauer, was DU in dieser Situation gemacht hast."

FEEDBACK – sehr kurz, in wenigen Sekunden verständlich, keine lange Analyse, keine fünf Punkte, keine HR-Fachsprache:
- "positive": 1 Satz, was gut war (bei sehr schwachen Antworten: was ansatzweise da ist).
- "improvement": 1 Satz, die EINE wichtigste Verbesserung.
- "betterAnswer": 1–2 Sätze als Beispiel für eine stärkere Formulierung, in Ich-Form. Erfinde NICHTS über den Jugendlichen (kein Fussball, kein Hobby, keine Situation, die er nicht erwähnt hat). Nutze nur, was er selbst gesagt hat, oder Platzhalter in eckigen Klammern wie "[konkretes Beispiel aus Schule, Hobby oder Schnupperlehre]". Du hilfst ihm, SEINE Antwort besser auszudrücken, nicht eine erfundene Person zu erzeugen.
- "followUpNeeded": true NUR bei Score 5 oder tiefer, wenn die Antwort extrem oberflächlich ist und ein echter Interviewer nachhaken würde. Bei guten Antworten (Score 6+) immer false. Maximal EINE Nachfrage.
- "followUpQuestion": bei followUpNeeded eine kurze, natürliche Nachfrage wie ein echter Interviewer (z. B. "Kannst du mir ein konkretes Beispiel nennen, wann du gut im Team gearbeitet hast?"). Sonst leerer String.
Jeder Text max. 35 Wörter.`;

const SUMMARY_INSTRUCTIONS = `Das Interview ist beendet. Du bekommst alle Fragen mit Kategorie, Score, der Antwort des Jugendlichen und der wichtigsten Verbesserung pro Frage.

Erstelle eine kurze, ehrliche Gesamtauswertung für den Jugendlichen (du-Form, einfaches Deutsch, ermutigend aber nicht übertrieben):
- "strength": 1 Satz, sein stärkster Bereich (worauf er aufbauen kann).
- "improvementArea": 1 Satz, sein schwächster Bereich.
- "mostImportantTip": 1 Satz, der wichtigste konkrete Tipp fürs echte Gespräch.
- "practiceAgain": 2–3 Fragen aus diesem Interview (wörtlich oder leicht gekürzt), die er nochmals üben sollte – die mit den tiefsten Scores oder den grössten Lücken.
Erfinde nichts, was nicht aus den Antworten hervorgeht. Jeder Text max. 35 Wörter.`;

// ---------- JSON schemas (structured outputs) ----------

const CATEGORIES: QuestionCategory[] = [
  "introduction",
  "motivation",
  "company",
  "apprenticeship",
  "strengths",
  "reflection",
  "behavior",
  "closing",
];

const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          category: { type: "string", enum: CATEGORIES },
          question: { type: "string" },
          topic: { type: "string" },
          tip: { type: "string" },
        },
        required: ["id", "category", "question", "topic", "tip"],
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
    followUpNeeded: { type: "boolean" },
    followUpQuestion: { type: "string" },
  },
  required: ["score", "positive", "improvement", "betterAnswer", "followUpNeeded", "followUpQuestion"],
  additionalProperties: false,
} as const;

const SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    strength: { type: "string" },
    improvementArea: { type: "string" },
    mostImportantTip: { type: "string" },
    practiceAgain: { type: "array", items: { type: "string" } },
  },
  required: ["strength", "improvementArea", "mostImportantTip", "practiceAgain"],
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
    const it = item as Partial<Question>;
    const q = clean(it.question, 240);
    if (q.length < 8) continue;
    const category = CATEGORIES.includes(it.category as QuestionCategory) ? (it.category as QuestionCategory) : undefined;
    out.push({
      question: q,
      category,
      topic: clean(it.topic, 40) || "Allgemein",
      tip: clean(it.tip, 140) || "Sei ehrlich und nenne konkrete Beispiele.",
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
  const followUpQuestion = clean(d.followUpQuestion, 240);
  // Spec: a follow-up is only recommended for extremely thin answers.
  const followUpNeeded = Boolean(d.followUpNeeded) && followUpQuestion.length > 0 && score <= 5;
  return { score, positive, improvement, betterAnswer, followUpNeeded, followUpQuestion: followUpNeeded ? followUpQuestion : "" };
}

export function validateSummary(data: unknown): Summary | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Partial<Summary>;
  const strength = clean(d.strength);
  const improvementArea = clean(d.improvementArea);
  const mostImportantTip = clean(d.mostImportantTip);
  if (!strength || !improvementArea || !mostImportantTip) return null;
  const practiceAgain = Array.isArray(d.practiceAgain)
    ? d.practiceAgain.map((q) => clean(q, 240)).filter((q) => q.length >= 8).slice(0, 3)
    : [];
  return { strength, improvementArea, mostImportantTip, practiceAgain };
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

function contextBlock(profession: string, company: string | null) {
  return [`LEHRBERUF:\n${profession}`, `UNTERNEHMEN:\n${company ?? "nicht angegeben"}`].join("\n\n");
}

const openaiProvider: AIProvider = {
  async generateInterview({ profession, company, avoid }) {
    const user = [
      contextBlock(profession, company),
      avoid && avoid.length > 0
        ? `Diese Fragen wurden in der letzten Runde schon gestellt – formuliere andere Fragen:\n- ${avoid.join("\n- ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const data = await askJSON({
      system: `${SYSTEM_INTERVIEWER}\n\n${GENERATE_INSTRUCTIONS}`,
      user,
      schemaName: "interview_questions",
      schema: QUESTIONS_SCHEMA,
      maxTokens: 1400,
    });
    const questions = validateQuestions(data);
    if (!questions) throw new Error("Invalid questions from AI");
    return questions;
  },

  async evaluateAnswer({ profession, company, question, answer }) {
    const user = [contextBlock(profession, company), `FRAGE:\n${question}`, `ANTWORT DES JUGENDLICHEN:\n"""\n${answer}\n"""`].join(
      "\n\n",
    );

    const data = await askJSON({
      system: `${SYSTEM_INTERVIEWER}\n\n${EVALUATE_INSTRUCTIONS}`,
      user,
      schemaName: "answer_evaluation",
      schema: EVALUATION_SCHEMA,
      maxTokens: 500,
    });
    const evaluation = validateEvaluation(data);
    if (!evaluation) throw new Error("Invalid evaluation from AI");
    return evaluation;
  },

  async summarizeInterview({ profession, company, items }) {
    const list = items
      .map(
        (it, i) =>
          `${i + 1}. [${it.category}] ${it.question}\nScore: ${it.score}/10\nAntwort: """${it.answer}"""\nWichtigste Verbesserung: ${it.improvement}`,
      )
      .join("\n\n");
    const user = `${contextBlock(profession, company)}\n\nINTERVIEW:\n\n${list}`;

    const data = await askJSON({
      system: `${SYSTEM_INTERVIEWER}\n\n${SUMMARY_INSTRUCTIONS}`,
      user,
      schemaName: "interview_summary",
      schema: SUMMARY_SCHEMA,
      maxTokens: 500,
    });
    const summary = validateSummary(data);
    if (!summary) throw new Error("Invalid summary from AI");
    return summary;
  },
};

export const ai: AIProvider = openaiProvider;
