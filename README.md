# nextround (V0)

Mobile-first Web-App, mit der Jugendliche in der Schweiz Vorstellungsgespräche für Lehrstellen üben.
Kein Login, keine Accounts, keine Payments. Nur der Kern-Flow:

Lehrberuf → Unternehmen (optional) → 7 Fragen → AI-Feedback pro Antwort → Readiness Score → nochmal üben / teilen.

## Setup

```bash
cp .env.example .env.local   # OPENAI_API_KEY eintragen
npm install
npm run dev                  # http://localhost:3000
```

Ohne `OPENAI_API_KEY` läuft die App weiter: Fragen kommen aus den lokalen Fallback-Fragen,
die Antwortbewertung zeigt den freundlichen Fehler-Screen mit „Nochmal versuchen“.

## Environment

| Variable | Pflicht | Beschreibung |
| --- | --- | --- |
| `OPENAI_API_KEY` | ja (für AI) | Nur serverseitig, nie im Client. |
| `OPENAI_MODEL` | nein | Default `gpt-4.1-mini`. |
| `NEXT_PUBLIC_SITE_URL` | nein | Für Metadaten / OpenGraph. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | nein | Domain in Plausible, z. B. `nextround.ch`. Ohne Wert werden Events im Dev nur in der Konsole geloggt. |

## Struktur

```
src/app/            Seiten: / (Landing), /beruf, /firma, /interview, /ergebnis, /datenschutz
src/app/api/        Route Handler: /api/interview (7 Fragen in EINEM Request), /api/evaluate (eine Antwort)
src/lib/ai.ts       AI-Provider-Abstraktion (generateInterview, evaluateAnswer) + Prompts + JSON-Validierung
src/lib/analytics.ts  trackEvent() – aktuell Plausible, leicht austauschbar
src/lib/session.ts  sessionStorage-State (Beruf, Firma, Fragen, Fortschritt, Scores)
src/lib/share.ts    Web Share API, Link kopieren, WhatsApp, anonyme Referral-ID (?ref=)
src/lib/score.ts    Readiness Score (Durchschnitt × 10), Headlines, Insights
src/components/     Logo, Header, Button, ProgressBar, Doodles (SVG), Shell
```

## Analytics-Events

`page_view`, `profession_selected`, `general_practice_selected`, `company_added`, `company_skipped`,
`interview_started`, `question_answered`, `interview_completed`, `interview_restarted`,
`share_clicked`, `share_completed`, `referral_visit`.

Es werden nie Interview-Antworten oder persönliche Daten an Analytics gesendet.

In Plausible die Events als Custom Goals anlegen, dann lassen sich Start-, Completion-, Replay-, Share- und
Referral-Rate direkt im Plausible-Dashboard ablesen.

## AI-Kosten

- Fragen: 1 Request pro Interview (JSON, max. 1200 Output-Tokens).
- Bewertung: 1 Request pro Antwort (JSON, max. 400 Output-Tokens).
- Strukturierte JSON-Ausgabe (Structured Outputs, strict). Einfaches In-Memory-Rate-Limit pro IP schützt vor Missbrauch.

## Deploy (Vercel)

Repo importieren, Environment-Variablen setzen, deployen. Keine Datenbank notwendig.
