"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Shell } from "@/components/Shell";
import { ProgressBar } from "@/components/ProgressBar";
import { Arrow, Button } from "@/components/Button";
import { ArrowDoodle, Blob } from "@/components/Doodles";
import { trackEvent } from "@/lib/analytics";
import { loadSession, updateSession } from "@/lib/session";

export default function FirmaPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/beruf");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage after mount
    if (s.company) setCompany(s.company);
  }, [router]);

  function go(value: string | null) {
    updateSession({ company: value, questions: [], currentIndex: 0, results: [] });
    if (value) trackEvent("company_added");
    else trackEvent("company_skipped");
    router.push("/interview");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Shell>
        <Header back="/beruf" />
        <ProgressBar current={2} total={4} />

        <div className="relative z-10">
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight">Bei welcher Firma ist dein Gespräch?</h1>
          <p className="mt-3 text-base text-muted">
            Wenn du die Firma schon kennst, können wir die Fragen noch besser anpassen. Du kannst das auch überspringen.
          </p>

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              go(company.trim() ? company.trim() : null);
            }}
          >
            <label className="block">
              <span className="sr-only">Firma</span>
              <div className="flex items-center gap-3 rounded-2xl border-2 border-line bg-white px-4 focus-within:border-purple">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.4" />
                  <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="z. B. Swisscom"
                  maxLength={80}
                  autoComplete="organization"
                  className="min-h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
                />
              </div>
            </label>

            <div className="mt-6 space-y-3">
              <Button type="submit">
                Weiter <Arrow />
              </Button>
              <Button type="button" variant="secondary" onClick={() => go(null)}>
                Weiss ich nicht / überspringen
              </Button>
            </div>
          </form>
        </div>

        <div className="pointer-events-none relative mt-12 h-56" aria-hidden="true">
          <Blob color="lime" className="absolute -left-10 bottom-0 h-64 w-64 -rotate-6 sm:h-72 sm:w-72" />
          <p className="hand absolute bottom-16 left-6 text-2xl leading-tight text-ink">
            Kein Stress.
            <br />
            Du schaffst das.
          </p>
          <ArrowDoodle className="absolute right-6 top-2 h-16 w-16 text-purple" />
        </div>
      </Shell>
    </main>
  );
}
