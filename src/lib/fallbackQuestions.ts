import type { Question } from "./types";

/** Local fallback used when AI generation fails. Kept deliberately simple. */
export function fallbackQuestions(profession: string, company: string | null): Question[] {
  const job = profession;
  const companyQ: Question = company
    ? {
        question: `Warum möchtest du deine Lehre gerade bei ${company} machen?`,
        topic: "Warum dieses Unternehmen",
        tip: "Nenne etwas, das dir an der Firma konkret gefällt.",
      }
    : {
        question: "Was ist dir bei einem Lehrbetrieb wichtig?",
        topic: "Erwartungen an den Betrieb",
        tip: "Denk an Team, Lernen, Arbeitsweg oder Abwechslung.",
      };

  return [
    {
      question: "Erzähl uns kurz etwas über dich.",
      topic: "Über dich",
      tip: "Schule, Hobbys, was dich ausmacht – kurz und klar.",
    },
    {
      question: `Warum möchtest du gerade ${job === "Allgemeine Lehrstelle" ? "diesen Lehrberuf" : job} lernen?`,
      topic: "Motivation",
      tip: "Sei ehrlich und nenne konkrete Beispiele.",
    },
    companyQ,
    {
      question: "Was sind deine grössten Stärken?",
      topic: "Stärken",
      tip: "Nenne zwei Stärken mit je einem Beispiel.",
    },
    {
      question: "Was ist eine Schwäche von dir – und wie gehst du damit um?",
      topic: "Selbstreflexion",
      tip: "Eine echte Schwäche plus was du dagegen tust.",
    },
    {
      question: "Erzähle von einer Situation, in der du im Team etwas gemeinsam gelöst hast.",
      topic: "Teamarbeit",
      tip: "Schule, Sport oder Verein zählen auch.",
    },
    {
      question: "Warum sollten wir gerade dich für diese Lehrstelle auswählen?",
      topic: "Auftreten",
      tip: "Fasse zusammen, was dich besonders macht.",
    },
  ];
}
