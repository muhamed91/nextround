"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Shell } from "@/components/Shell";
import { ProgressBar } from "@/components/ProgressBar";
import { Arrow, Button } from "@/components/Button";
import { ALL_PROFESSIONS, GENERAL_PROFESSION, POPULAR_PROFESSIONS, searchProfessions, type Profession } from "@/lib/professions";
import { trackEvent } from "@/lib/analytics";
import { loadSession, newInterviewId, saveSession } from "@/lib/session";

export default function BerufPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Profession | null>(null);
  const hasQuery = query.trim().length > 0;
  const results = useMemo(() => searchProfessions(query), [query]);
  /** Without a query: full alphabetical list below the popular ones. */
  const rest = useMemo(
    () => (hasQuery ? [] : ALL_PROFESSIONS.filter((p) => !POPULAR_PROFESSIONS.some((x) => x.id === p.id))),
    [hasQuery],
  );

  function start(profession: string, isGeneral: boolean) {
    const previous = loadSession();
    saveSession({
      interviewId: newInterviewId(),
      profession,
      isGeneral,
      company: previous?.company ?? null,
      questions: [],
      currentIndex: 0,
      results: [],
      startedAt: Date.now(),
    });
    if (isGeneral) trackEvent("general_practice_selected");
    else trackEvent("profession_selected", { profession });
    router.push("/firma");
  }

  const customName = query.trim();
  const showCustom = customName.length >= 3 && results.length === 0;

  function renderItem(p: Profession) {
    const active = selected?.id === p.id;
    return (
      <li key={p.id}>
        <button
          type="button"
          role="option"
          aria-selected={active}
          onClick={() => setSelected(p)}
          className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 bg-white px-4 text-left text-base font-semibold transition ${
            active ? "border-purple bg-lilac" : "border-line hover:border-purple/50"
          }`}
        >
          <span className="flex-1">{p.name}</span>
          <span className="rounded-lg bg-lilac px-2 py-0.5 text-xs font-bold text-purple">{p.degree}</span>
          {active ? (
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-purple">
              <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>
      </li>
    );
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <Shell className="min-h-0">
        <Header back="/" />
        <ProgressBar current={1} total={4} />

        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Was willst du werden? <span aria-hidden="true">👀</span>
        </h1>
        <p className="mt-2 text-base text-muted">Wähle den Lehrberuf, für den du üben möchtest.</p>

        <label className="mt-5 block">
          <span className="sr-only">Lehrberuf suchen</span>
          <div className="flex items-center gap-3 rounded-2xl border-2 border-line bg-white px-4 focus-within:border-purple">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.4" />
              <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              placeholder="Lehrberuf suchen ..."
              autoComplete="off"
              className="min-h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
            />
          </div>
        </label>

        <ul className="-mx-1 mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto px-1 pb-2" role="listbox" aria-label="Lehrberufe">
          <li className="pb-1 text-sm font-bold" aria-hidden="true">
            {hasQuery ? "Treffer" : "Beliebte Lehrberufe"}
          </li>
          {results.map(renderItem)}
          {rest.length > 0 ? (
            <li className="pt-4 text-sm font-bold" aria-hidden="true">
              Alle Lehrberufe (A–Z)
            </li>
          ) : null}
          {rest.map(renderItem)}
          {showCustom ? (
            <li>
              <button
                type="button"
                onClick={() => setSelected({ id: "custom", name: customName, degree: "EFZ" })}
                className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 bg-white px-4 text-left text-base font-semibold ${
                  selected?.id === "custom" ? "border-purple bg-lilac" : "border-line"
                }`}
              >
                <span aria-hidden="true" className="text-xl">
                  🎯
                </span>
                <span>„{customName}“ verwenden</span>
              </button>
            </li>
          ) : null}
          {results.length === 0 && !showCustom ? (
            <li className="rounded-2xl bg-lilac px-4 py-4 text-sm text-muted">
              Kein Treffer. Tipp weiter oder wähle unten „Allgemein üben“.
            </li>
          ) : null}
        </ul>

        <div className="mt-2 space-y-3 pt-3">
          <Button disabled={!selected} onClick={() => selected && start(selected.name, false)}>
            Weiter <Arrow />
          </Button>
          <Button variant="ghost" onClick={() => start(GENERAL_PROFESSION, true)}>
            Noch nicht sicher? Allgemein üben
          </Button>
        </div>
      </Shell>
    </main>
  );
}
