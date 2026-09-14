import type { Evaluation, Question } from "./types";

export function readinessScore(results: Evaluation[]): number {
  if (results.length === 0) return 0;
  const avg = results.reduce((s, r) => s + r.score, 0) / results.length;
  return Math.round(avg * 10);
}

export function scoreHeadline(score: number): string {
  if (score >= 90) return "Du bist ready. 🔥";
  if (score >= 75) return "Du bist fast ready. 🔥";
  if (score >= 60) return "Gute Basis. Noch eine Runde.";
  return "Da geht noch was. Eine Runde mehr.";
}

export function scoreSubline(score: number): string {
  if (score >= 90) return "Starke Leistung! Du wirkst vorbereitet, motiviert und klar. So kannst du ins Gespräch.";
  if (score >= 75)
    return "Starke Leistung! Du hast gezeigt, dass du gut vorbereitet bist. Mit ein paar gezielten Verbesserungen bist du bereit.";
  if (score >= 60) return "Du hast eine gute Basis. Mit noch einer Übungsrunde werden deine Antworten deutlich sicherer.";
  return "Kein Stress. Jede Runde macht dich besser. Schau dir die Tipps an und probier es gleich nochmal.";
}

export function answerHeadline(score: number): string {
  if (score >= 9) return "Sehr starke Antwort!";
  if (score >= 7) return "Gute Antwort!";
  if (score >= 5) return "Solide Basis.";
  return "Das ist noch zu allgemein.";
}

export type Insights = {
  strong: string;
  practice: string;
  improvement: string;
};

export function buildInsights(questions: Question[], results: Evaluation[]): Insights {
  const pairs = questions.slice(0, results.length).map((q, i) => ({ q, r: results[i] }));
  if (pairs.length === 0) {
    return { strong: "Motivation", practice: "Konkrete Beispiele", improvement: "Nenne Beispiele aus deinem Alltag." };
  }
  const sorted = [...pairs].sort((a, b) => b.r.score - a.r.score);
  const best = sorted.slice(0, 2).map((p) => p.q.topic);
  const worst = sorted[sorted.length - 1];
  return {
    strong: Array.from(new Set(best)).join(", "),
    practice: worst.q.topic,
    improvement: worst.r.improvement,
  };
}
