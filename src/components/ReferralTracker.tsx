"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { trackEvent } from "@/lib/analytics";

function Tracker() {
  const params = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("page_view", { path: pathname });
  }, [pathname]);

  useEffect(() => {
    const ref = params.get("ref");
    if (!ref) return;
    const safe = ref.replace(/[^a-z0-9]/gi, "").slice(0, 12);
    if (!safe) return;
    try {
      if (window.sessionStorage.getItem("nextround:referred") !== safe) {
        window.sessionStorage.setItem("nextround:referred", safe);
        trackEvent("referral_visit", { ref: safe });
      }
    } catch {
      trackEvent("referral_visit", { ref: safe });
    }
    // Keep the URL clean after recording the referral.
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
