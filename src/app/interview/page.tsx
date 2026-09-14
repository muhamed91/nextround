"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Shell } from "@/components/Shell";
import { ProgressBar } from "@/components/ProgressBar";
import { Arrow, Button } from "@/components/Button";
import { Bulb, Sparkles, Star } from "@/components/Doodles";
import { trackEvent } from "@/lib/analytics";
import { loadSession, saveSession } from "@/lib/session";
import { answerHeadline } from "@/lib/score";
import { MAX_ANSWER_LENGTH, QUESTION_COUNT, type Evaluation, type Question, type Session } from "@/lib/types";

type Phase = "loading" | "question" | "checking" | "feedback" | "error";

export default function InterviewPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Evaluation | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Ich checke deine Antwort ... 👀");
  const startedRef = useRef(false);

  // Load or generate the interview
  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/beruf");
      return;
    }
    if (s.questions.length >= QUESTION_COUNT) {
      if (s.currentIndex >= QUESTION_COUNT) {
        router.replace("/ergebnis");
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage after mount
      setSession(s);
      setPhase("question");
      return;
    }
    let cancelled = false;
    (async () => {
      let questions: Question[] = [];
      try {
        const res = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profession: s.profession, company: s.company, avoid: s.avoid ?? [] }),
        });
        const data = (await res.json()) as { questions: Question[] };
        questions = data.questions;
      } catch {
        // API route itself falls back; if even that fails we surface the error below
      }
      if (cancelled) return;
      if (!questions || questions.length === 0) {
        setPhase("error");
        return;
      }
      const next: Session = { ...s, questions, avoid: undefined, currentIndex: 0, results: [] };
      saveSession(next);
      setSession(next);
      setPhase("question");
      if (!startedRef.current) {
        startedRef.current = true;
        trackEvent("interview_started", { profession: s.isGeneral ? "general" : s.profession, hasCompany: !!s.company });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Friendly two-step loading copy
  useEffect(() => {
    if (phase !== "checking") return;
    const t = setTimeout(() => setLoadingMsg("Fast fertig ..."), 3500);
    return () => clearTimeout(t);
  }, [phase]);

  const submit = useCallback(async () => {
    if (!session) return;
    const q = session.questions[session.currentIndex];
    const text = answer.trim();
    if (!text) return;
    setLoadingMsg("Ich checke deine Antwort ... 👀");
    setPhase("checking");
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profession: session.profession, company: session.company, question: q.question, answer: text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Evaluation;
      if (typeof data.score !== "number") throw new Error("bad");
      setFeedback(data);
      const next: Session = { ...session, results: [...session.results.slice(0, session.currentIndex), { ...data, answer: text }] };
      saveSession(next);
      setSession(next);
      trackEvent("question_answered", { index: session.currentIndex + 1, score: data.score });
      setPhase("feedback");
    } catch {
      setPhase("error");
    }
  }, [answer, session]);

  function nextQuestion() {
    if (!session) return;
    const nextIndex = session.currentIndex + 1;
    const next: Session = { ...session, currentIndex: nextIndex };
    saveSession(next);
    if (nextIndex >= QUESTION_COUNT) {
      router.push("/ergebnis");
      return;
    }
    setSession(next);
    setAnswer("");
    setFeedback(null);
    setPhase("question");
    window.scrollTo({ top: 0 });
  }

  // ---------- Render ----------

  if (phase === "loading" || !session) {
    return (
      <main className="min-h-dvh">
        <Shell>
          <Header back="/firma" />
          <ProgressBar current={3} total={4} />
          <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
            <Sparkles className="h-12 w-16 text-purple" />
            <p className="mt-4 text-xl font-bold">Ich bereite dein Interview vor ...</p>
            <p className="mt-2 text-sm text-muted">{session?.profession ?? ""}</p>
            <Dots />
          </div>
        </Shell>
      </main>
    );
  }

  const index = session.currentIndex;
  const question = session.questions[index];

  if (phase === "error") {
    return (
      <main className="min-h-dvh">
        <Shell>
          <Header back="/firma" />
          <ProgressBar current={index + 1} total={QUESTION_COUNT} />
          <div className="mt-16 rounded-3xl bg-lilac p-6 text-center">
            <p className="text-3xl font-extrabold">Kurz technische Pause 😅</p>
            <p className="mt-3 text-base text-muted">Versuch deine Antwort nochmal.</p>
            <div className="mt-6">
              <Button onClick={() => (question ? setPhase("question") : router.replace("/firma"))}>Nochmal versuchen</Button>
            </div>
          </div>
        </Shell>
      </main>
    );
  }

  if (phase === "feedback" && feedback) {
    return (
      <main className="min-h-dvh">
        <Shell>
          <Header showBeta />
          <ProgressBar current={index + 1} total={QUESTION_COUNT} color="green" label={`Frage ${index + 1} von ${QUESTION_COUNT} beantwortet`} />

          <div className="relative mt-10 flex flex-col items-center text-center">
            <Sparkles className="absolute -left-2 top-0 h-10 w-14 text-purple" />
            <Sparkles className="absolute -right-2 top-0 h-10 w-14 -scale-x-100 text-purple" />
            <div className="animate-pop rounded-3xl bg-lime px-8 py-4">
              <span className="text-5xl font-extrabold tabular-nums">{feedback.score}</span>
              <span className="text-2xl font-bold text-muted"> / 10</span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{answerHeadline(feedback.score)}</h1>
          </div>

          <div className="animate-fade-up mt-6 space-y-4">
            <FeedbackRow icon="✓" tone="ok" title="Das war gut" text={feedback.positive} />
            <FeedbackRow icon="→" tone="warn" title="Mach es noch stärker" text={feedback.improvement} />
            {feedback.followUpNeeded && feedback.followUpQuestion ? (
              <div className="rounded-3xl border-2 border-dashed border-purple/40 bg-white p-5">
                <p className="text-sm font-bold text-purple">Ein echter Interviewer würde jetzt nachfragen:</p>
                <p className="mt-2 text-base font-semibold leading-relaxed text-ink">„{feedback.followUpQuestion}“</p>
                <p className="mt-2 text-sm text-muted">Überleg dir kurz, was du darauf antworten würdest.</p>
              </div>
            ) : null}
            {feedback.betterAnswer ? (
              <div className="rounded-3xl bg-lilac p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-purple">
                  <Star className="h-5 w-5" /> So wäre es noch stärker:
                </p>
                <p className="mt-2 text-base leading-relaxed text-ink">„{feedback.betterAnswer}“</p>
              </div>
            ) : null}
          </div>

          <div className="sticky bottom-0 mt-8 bg-offwhite pb-2 pt-4">
            <Button onClick={nextQuestion}>
              {index + 1 >= QUESTION_COUNT ? "Zum Ergebnis" : "Nächste Frage"} <Arrow />
            </Button>
          </div>
        </Shell>
      </main>
    );
  }

  const checking = phase === "checking";

  return (
    <main className="min-h-dvh">
      <Shell>
        <Header back={index === 0 ? "/firma" : undefined} />
        <ProgressBar current={index + 1} total={QUESTION_COUNT} label={`Frage ${index + 1} von ${QUESTION_COUNT}`} />

        <span className="mt-8 inline-block w-fit rounded-full bg-lilac px-3 py-1 text-sm font-bold text-purple">
          Frage {index + 1} von {QUESTION_COUNT}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{question.question}</h1>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="block">
            <span className="sr-only">Deine Antwort</span>
            <div className="relative rounded-2xl border-2 border-line bg-white focus-within:border-purple">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value.slice(0, MAX_ANSWER_LENGTH))}
                placeholder="Deine Antwort ..."
                rows={6}
                maxLength={MAX_ANSWER_LENGTH}
                disabled={checking}
                className="min-h-44 w-full resize-y rounded-2xl bg-transparent px-4 py-4 text-base leading-relaxed outline-none placeholder:text-muted disabled:opacity-60"
              />
              <span className="pointer-events-none absolute bottom-3 right-4 text-xs font-semibold text-muted tabular-nums">
                {answer.length} / {MAX_ANSWER_LENGTH}
              </span>
            </div>
          </label>

          <div className="mt-5">
            {checking ? (
              <div className="flex min-h-14 flex-col items-center justify-center rounded-2xl bg-lilac px-4 text-center" role="status" aria-live="polite">
                <p className="text-base font-bold text-purple">{loadingMsg}</p>
                <Dots />
              </div>
            ) : (
              <Button type="submit" disabled={answer.trim().length < 2}>
                Antwort prüfen <Arrow />
              </Button>
            )}
          </div>
        </form>

        <div className="mt-8 flex items-start gap-3">
          <Bulb className="h-14 w-12 shrink-0 text-ink" />
          <div className="rounded-3xl rounded-tl-md bg-lilac px-5 py-4">
            <p className="hand text-lg text-purple">Tipp</p>
            <p className="mt-1 text-sm font-medium text-ink">{question.tip}</p>
          </div>
        </div>
      </Shell>
    </main>
  );
}

function Dots() {
  return (
    <span aria-hidden="true" className="mt-1 inline-flex gap-1 text-2xl font-extrabold leading-none text-purple">
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
    </span>
  );
}

function FeedbackRow({ icon, tone, title, text }: { icon: string; tone: "ok" | "warn"; title: string; text: string }) {
  const bg = tone === "ok" ? "bg-ok" : "bg-warn";
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-line bg-white p-4">
      <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg} text-base font-extrabold text-white`}>
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-base leading-relaxed text-muted">{text}</p>
      </div>
    </div>
  );
}
