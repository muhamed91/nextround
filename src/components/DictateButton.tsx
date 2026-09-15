"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

/* Minimal typings for the Web Speech API (not in lib.dom for all targets). */
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useDictation({
  onText,
  disabled = false,
}: {
  /** Called with the text typed so far plus the newly recognised words. */
  onText: (updater: (current: string) => string) => void;
  disabled?: boolean;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const baseRef = useRef(""); // text that existed before this dictation session
  const finalRef = useRef(""); // final transcript accumulated in this session

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser capability check after mount (SSR-safe)
    setSupported(getCtor() !== null);
    return () => recRef.current?.abort();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || disabled) return;
    setError(null);
    const rec = new Ctor();
    rec.lang = "de-CH";
    rec.continuous = true;
    rec.interimResults = true;

    onText((current) => {
      baseRef.current = current.trim() ? current.trimEnd() + " " : "";
      return current;
    });
    finalRef.current = "";

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      const text = baseRef.current + finalRef.current + interim;
      onText(() => text);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("Mikrofon-Zugriff wurde abgelehnt.");
      else if (e.error === "no-speech") setError("Ich habe nichts gehört. Versuch es nochmal.");
      else if (e.error !== "aborted") setError("Spracheingabe hat nicht geklappt.");
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      onText(() => (baseRef.current + finalRef.current).trimEnd());
    };

    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
      trackEvent("dictation_started");
    } catch {
      setError("Spracheingabe hat nicht geklappt.");
    }
  }, [disabled, onText]);

  return { supported, listening, error, start, stop, toggle: listening ? stop : start };
}

export function DictateButton({ listening, onClick, disabled }: { listening: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Aufnahme stoppen" : "Antwort einsprechen"}
      title={listening ? "Aufnahme stoppen" : "Antwort einsprechen"}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition disabled:opacity-50 ${
        listening ? "bg-purple text-white animate-pulse" : "bg-lilac text-purple hover:bg-[#e6dfff]"
      }`}
    >
      {listening ? (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2.5" />
        </svg>
      ) : (
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
          <path d="M5 11a7 7 0 0014 0M12 18v3M9 21h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
