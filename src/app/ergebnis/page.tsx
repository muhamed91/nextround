"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo, BetaBadge } from "@/components/Logo";
import { Shell } from "@/components/Shell";
import { Arrow, Button } from "@/components/Button";
import { ArrowDoodle, Smiley, Sparkles, Star } from "@/components/Doodles";
import { trackEvent } from "@/lib/analytics";
import { loadSession, newInterviewId, saveSession } from "@/lib/session";
import { buildInsights, readinessScore, scoreHeadline, scoreSubline } from "@/lib/score";
import { copyShareLink, shareNextRound, whatsappShareUrl } from "@/lib/share";
import { downloadResultPdf } from "@/lib/pdf";
import { QUESTION_COUNT, type Session, type Summary } from "@/lib/types";

export default function ErgebnisPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (!s || s.results.length === 0) {
      router.replace("/beruf");
      return;
    }
    if (!s.completedTracked && s.results.length >= QUESTION_COUNT) {
      trackEvent("interview_completed", {
        profession: s.isGeneral ? "general" : s.profession,
        score: readinessScore(s.results),
      });
      saveSession({ ...s, completedTracked: true });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage after mount
    setSession(s);
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);

    // AI wrap-up: fetched once per interview, cached in the session for reloads and the PDF.
    if (!s.summary && s.results.length >= QUESTION_COUNT) {
      const items = s.questions.slice(0, s.results.length).map((q, i) => ({
        question: q.question,
        category: q.category ?? "general",
        score: s.results[i].score,
        answer: s.results[i].answer ?? "",
        improvement: s.results[i].improvement,
      }));
      fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profession: s.profession, company: s.company, items }),
      })
        .then((r) => (r.ok ? (r.json() as Promise<Summary>) : null))
        .then((summary) => {
          if (!summary || typeof summary.strength !== "string") return;
          const current = loadSession();
          if (!current || current.interviewId !== s.interviewId) return;
          const next = { ...current, summary };
          saveSession(next);
          setSession(next);
        })
        .catch(() => {});
    }
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!session) return null;

  const score = readinessScore(session.results);
  const insights = buildInsights(session.questions, session.results);
  const summary = session.summary;

  function restart() {
    if (!session) return;
    trackEvent("interview_restarted", { profession: session.isGeneral ? "general" : session.profession });
    saveSession({
      interviewId: newInterviewId(),
      profession: session.profession,
      isGeneral: session.isGeneral,
      company: session.company,
      questions: [],
      avoid: session.questions.map((q) => q.question),
      currentIndex: 0,
      results: [],
      startedAt: Date.now(),
    });
    router.push("/interview");
  }

  async function share(source = "result") {
    const r = await shareNextRound(source);
    if (r === "copied") setToast("Link kopiert ✓");
    if (r === "failed" && !canNativeShare) setToast("Kopieren nicht möglich");
  }

  async function pdf() {
    if (!session || pdfBusy) return;
    setPdfBusy(true);
    trackEvent("pdf_downloaded", { profession: session.isGeneral ? "general" : session.profession });
    try {
      await downloadResultPdf(session);
    } catch {
      setToast("PDF konnte nicht erstellt werden");
    } finally {
      setPdfBusy(false);
    }
  }

  async function copy() {
    const r = await copyShareLink("result_copy");
    setToast(r === "copied" ? "Link kopiert ✓" : "Kopieren nicht möglich");
  }

  return (
    <main className="min-h-dvh">
      <Shell>
        <header className="flex items-center justify-between py-4">
          <Logo />
          <BetaBadge />
        </header>

        <div className="lg:grid lg:grid-cols-2 lg:gap-10">
          <section className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
            <Sparkles className="absolute left-0 top-2 h-10 w-14 text-purple lg:hidden" />
            <Sparkles className="absolute right-0 top-2 h-10 w-14 -scale-x-100 text-purple lg:hidden" />
            <div className="animate-pop mt-6 rounded-3xl bg-lime px-8 py-4">
              <span className="text-6xl font-extrabold tabular-nums">{score}</span>
              <span className="text-2xl font-bold text-muted"> / 100</span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{scoreHeadline(score)}</h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-muted">{scoreSubline(score)}</p>
          </section>

          <section className="animate-fade-up mt-8 space-y-3 lg:mt-6">
            <Insight tone="ok" icon="✓" title="Das sitzt" text={summary?.strength ?? insights.strong} />
            <Insight tone="warn" icon="→" title="Das solltest du noch üben" text={summary?.improvementArea ?? insights.practice} />
            <Insight tone="purple" icon="★" title="Dein wichtigster Tipp" text={summary?.mostImportantTip ?? insights.improvement} />
            {summary && summary.practiceAgain.length > 0 ? (
              <div className="rounded-3xl border border-line bg-white p-5">
                <p className="text-sm font-bold">Diese Fragen nochmal üben</p>
                <ul className="mt-2 space-y-2">
                  {summary.practiceAgain.map((q) => (
                    <li key={q} className="flex gap-2 text-base leading-relaxed text-ink">
                      <span aria-hidden="true" className="text-purple">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button onClick={restart}>
            Nochmal üben <Arrow />
          </Button>
          <Button variant="secondary" onClick={() => share("result")}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            NextRound teilen ↗
          </Button>
          <Button variant="secondary" onClick={pdf} disabled={pdfBusy} className="sm:col-span-2">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12M7 10l5 5 5-5M5 19h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {pdfBusy ? "PDF wird erstellt ..." : "Ergebnis als PDF herunterladen"}
          </Button>
        </div>

        <section className="relative mt-12 rounded-3xl border border-line bg-white p-6 text-center">
          <Smiley className="mx-auto h-20 w-20 text-ink" />
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Kennst du jemanden mit einem Vorstellungsgespräch?</h2>
          <p className="mt-2 text-sm text-muted">Teile NextRound und hilf anderen, auch besser vorbereitet zu sein.</p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <a
              href={whatsappShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent("share_clicked", { source: "result_whatsapp", method: "whatsapp" });
                trackEvent("share_completed", { source: "result_whatsapp", method: "whatsapp" });
              }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-[#e8f8ec] text-xs font-bold text-ink hover:bg-[#d8f2df]"
            >
              <span aria-hidden="true" className="text-xl">💬</span>
              WhatsApp
            </a>
            <button
              type="button"
              onClick={copy}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-lilac text-xs font-bold text-ink hover:bg-[#e6dfff]"
            >
              <span aria-hidden="true" className="text-xl">🔗</span>
              Link kopieren
            </button>
            <button
              type="button"
              onClick={() => share("result_more")}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-lilac text-xs font-bold text-ink hover:bg-[#e6dfff]"
            >
              <span aria-hidden="true" className="text-xl">⋯</span>
              Mehr
            </button>
          </div>
          <ArrowDoodle className="absolute -right-2 -top-4 h-12 w-12 text-purple" />
        </section>

        <p className="hand mt-8 text-center text-2xl text-ink">Same you. Higher chances.</p>

        {toast ? (
          <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg">
            {toast}
          </div>
        ) : null}
      </Shell>
    </main>
  );
}

function Insight({ tone, icon, title, text }: { tone: "ok" | "warn" | "purple"; icon: string; title: string; text: string }) {
  const bg = tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : "bg-purple";
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-line bg-white p-4">
      <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg} text-base font-extrabold text-white`}>
        {icon === "★" ? <Star className="h-5 w-5 text-white" /> : icon}
      </span>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-base leading-relaxed text-muted">{text}</p>
      </div>
    </div>
  );
}
