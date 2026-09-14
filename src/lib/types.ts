export type Question = {
  question: string;
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
  /** The user's own answer, kept for the PDF export */
  answer?: string;
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
  startedAt: number;
  completedTracked?: boolean;
};

export const QUESTION_COUNT = 7;
export const MAX_ANSWER_LENGTH = 800;
