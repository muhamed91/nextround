"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";
import { shareNextRound } from "@/lib/share";

function ShareIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function useShare(source: string) {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  async function share() {
    const r = await shareNextRound(source);
    if (r === "copied") setToast("Link kopiert ✓");
    if (r === "failed" && !(typeof navigator !== "undefined" && navigator.share)) setToast("Kopieren nicht möglich");
  }

  const toastEl = toast ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg"
    >
      {toast}
    </div>
  ) : null;

  return { share, toastEl };
}

/** Compact share control for headers/nav. Uses native share sheet where available, otherwise copies the link. */
export function ShareLink({ source }: { source: string }) {
  const { share, toastEl } = useShare(source);
  return (
    <>
      <button
        type="button"
        onClick={share}
        className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-purple hover:bg-lilac"
      >
        <ShareIcon size={16} />
        Teilen
      </button>
      {toastEl}
    </>
  );
}

/** Full-width secondary share button. */
export function ShareButton({ source, className = "" }: { source: string; className?: string }) {
  const { share, toastEl } = useShare(source);
  return (
    <>
      <Button variant="secondary" onClick={share} className={className}>
        <ShareIcon />
        NextRound teilen ↗
      </Button>
      {toastEl}
    </>
  );
}
