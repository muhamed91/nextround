export type QuestionCategory =
  | "introduction"
  | "motivation"
  | "company"
  | "apprenticeship"
  | "strengths"
  | "reflection"
  | "behavior"
  | "closing";

export type Question = {
  question: string;
  /** Which part of the interview this question covers */
  category?: QuestionCategory;
  /** Short label used for result insights, e.g. "Motivation" */
  topic: string;
  /** One-line tip shown under the answer field */
  tip: string;
};

export type Evaluation = {
  score: number; // 1–10
  positive: string;
  improvement: string;
  betterAnswer: string;
  /** True when the answer was so thin that a real interviewer would dig deeper */
  followUpNeeded?: boolean;
  /** The one short follow-up an interviewer would ask (empty when not needed) */
  followUpQuestion?: string;
  /** The user's own answer, kept for the PDF export */
  answer?: string;
};

/** AI-generated wrap-up after the last question. */
export type Summary = {
  strength: string;
  improvementArea: string;
  mostImportantTip: string;
  practiceAgain: string[];
};

export type Session = {
  interviewId: string;
  profession: string;
  isGeneral: boolean;
  company: string | null;
  questions: Question[];
  /** Questions from the previous round, so a replay gets different ones */
  avoid?: string[];
  currentIndex: number;
  results: Evaluation[];
  /** Cached AI summary so reloads and the PDF don't re-request it */
  summary?: Summary;
  startedAt: number;
  completedTracked?: boolean;
};

export const QUESTION_COUNT = 7;
export const MAX_ANSWER_LENGTH = 800;
