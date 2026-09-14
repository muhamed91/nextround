"use client";

import { useRouter } from "next/navigation";
import { BetaBadge, Logo } from "./Logo";

export function Header({ back, showBeta = true }: { back?: string | true; showBeta?: boolean }) {
  const router = useRouter();
  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        {back ? (
          <button
            type="button"
            onClick={() => (back === true ? router.back() : router.push(back))}
            aria-label="Zurück"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-lilac"
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
        <Logo />
      </div>
      {showBeta ? <BetaBadge /> : null}
    </header>
  );
}
