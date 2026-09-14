/**
 * Thin analytics abstraction. Currently backed by Plausible.
 * Never send interview answers or personal data through here.
 */
export type AnalyticsEvent =
  | "page_view"
  | "profession_selected"
  | "general_practice_selected"
  | "company_added"
  | "company_skipped"
  | "interview_started"
  | "question_answered"
  | "interview_completed"
  | "interview_restarted"
  | "share_clicked"
  | "pdf_downloaded"
  | "share_completed"
  | "referral_visit";

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
  }
}

export function trackEvent(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  try {
    if (window.plausible) {
      window.plausible(event, { props });
    } else if (process.env.NODE_ENV !== "production") {
      console.debug("[analytics]", event, props);
    }
  } catch {
    // analytics must never break the app
  }
}
