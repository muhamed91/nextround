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

/**
 * Share via the native share sheet (mobile) or copy the link (desktop).
 * `source` says where the button lives: "landing", "landing_header", "result", "result_more", ...
 */
export async function shareNextRound(source: string): Promise<"shared" | "copied" | "failed"> {
  trackEvent("share_clicked", { source, method: hasNativeShare() ? "native" : "copy" });
  const url = getShareUrl();
  if (hasNativeShare()) {
    try {
      await navigator.share({ title: "NextRound", text: SHARE_TEXT, url });
      trackEvent("share_completed", { source, method: "native" });
      return "shared";
    } catch {
      return "failed"; // user cancelled
    }
  }
  return copyToClipboard(source);
}

/** Explicit "Link kopieren" button. */
export async function copyShareLink(source = "copy"): Promise<"copied" | "failed"> {
  trackEvent("share_clicked", { source, method: "copy" });
  return copyToClipboard(source);
}

function hasNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

async function copyToClipboard(source: string): Promise<"copied" | "failed"> {
  try {
    await navigator.clipboard.writeText(`${SHARE_TEXT} ${getShareUrl()}`);
    trackEvent("share_completed", { source, method: "copy" });
    return "copied";
  } catch {
    return "failed";
  }
}

export function whatsappShareUrl(): string {
  return `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${getShareUrl()}`)}`;
}
