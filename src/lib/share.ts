import { trackEvent } from "./analytics";

const REF_KEY = "nextround:ref";

/** Anonymous referral id per browser. No personal data. */
export function getReferralId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(REF_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 8);
      window.localStorage.setItem(REF_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function getShareUrl(): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/?ref=${getReferralId()}`;
}

export const SHARE_TEXT = "Vorstellungsgespräch? Probier NextRound 👀";

export async function shareNextRound(source: string): Promise<"shared" | "copied" | "failed"> {
  trackEvent("share_clicked", { source });
  const url = getShareUrl();
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "NextRound", text: SHARE_TEXT, url });
      trackEvent("share_completed", { method: "native" });
      return "shared";
    } catch {
      return "failed"; // user cancelled
    }
  }
  return copyShareLink();
}

export async function copyShareLink(): Promise<"copied" | "failed"> {
  trackEvent("share_clicked", { source: "copy" });
  const url = getShareUrl();
  try {
    await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`);
    trackEvent("share_completed", { method: "copy" });
    return "copied";
  } catch {
    return "failed";
  }
}

export function whatsappShareUrl(): string {
  return `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${getShareUrl()}`)}`;
}
