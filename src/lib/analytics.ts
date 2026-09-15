/**
 * Analytics abstraction. Every event goes to all configured sinks:
 *   1. Plausible          – if NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set (script in layout.tsx)
 *   2. Vercel Analytics   – custom events via @vercel/analytics (pageviews come from <Analytics /> in layout.tsx)
 *   3. First-party        – POST /api/track (logged on the server and forwarded to ANALYTICS_WEBHOOK_URL)
 *
 * Every event carries anonymous context (visitor id, session id, interview id, referral) so the
 * funnel start → complete → share → referral can be reconstructed without cookies or personal data.
 * Never send interview answers or personal data through here.
 */
import { track as vercelTrack } from "@vercel/analytics";
import { loadSession } from "./session";

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
  | "share_completed"
  | "pdf_downloaded"
  | "dictation_started"
  | "referral_visit";

export const ANALYTICS_EVENTS: readonly AnalyticsEvent[] = [
  "page_view",
  "profession_selected",
  "general_practice_selected",
  "company_added",
  "company_skipped",
  "interview_started",
  "question_answered",
  "interview_completed",
  "interview_restarted",
  "share_clicked",
  "share_completed",
  "pdf_downloaded",
  "dictation_started",
  "referral_visit",
];

export type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
  }
}

const VISITOR_KEY = "nextround:vid";
const SESSION_KEY = "nextround:sid";
const REFERRED_KEY = "nextround:referred";

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function stored(storage: Storage | undefined, key: string): string {
  try {
    if (!storage) return "";
    let v = storage.getItem(key);
    if (!v) {
      v = randomId();
      storage.setItem(key, v);
    }
    return v;
  } catch {
    return "";
  }
}

/** Anonymous, random ids – no fingerprinting, no personal data. */
export function visitorId() {
  return stored(typeof window !== "undefined" ? window.localStorage : undefined, VISITOR_KEY);
}
export function sessionId() {
  return stored(typeof window !== "undefined" ? window.sessionStorage : undefined, SESSION_KEY);
}
function referredBy(): string {
  try {
    return window.sessionStorage.getItem(REFERRED_KEY) ?? "";
  } catch {
    return "";
  }
}

function context(): Props {
  const s = loadSession();
  const ctx: Props = { vid: visitorId(), sid: sessionId() };
  if (s?.interviewId) ctx.interview_id = s.interviewId;
  const ref = referredBy();
  if (ref) ctx.referred_by = ref;
  return ctx;
}

function sendFirstParty(event: AnalyticsEvent, props: Props) {
  if (process.env.NEXT_PUBLIC_TRACK_DISABLED === "1") return;
  const body = JSON.stringify({ event, props, path: window.location.pathname, ts: Date.now() });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {}
  void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(
    () => {},
  );
}

export function trackEvent(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  const full: Props = { ...context(), ...props };
  try {
    if (window.plausible) window.plausible(event, { props: full });
  } catch {}
  try {
    if (event !== "page_view") vercelTrack(event, full); // Vercel counts pageviews itself
  } catch {}
  try {
    sendFirstParty(event, full);
  } catch {}
  if (process.env.NODE_ENV !== "production") console.debug("[analytics]", event, full);
}
