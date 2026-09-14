import { Header } from "@/components/Header";
import { Shell } from "@/components/Shell";

export const metadata = { title: "Datenschutz – nextround" };

export default function DatenschutzPage() {
  return (
    <main className="min-h-dvh">
      <Shell>
        <Header back="/" />
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Datenschutz</h1>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
          <p>
            <strong className="text-ink">Keine Anmeldung, keine persönlichen Daten.</strong> NextRound braucht weder Name,
            E-Mail, Telefonnummer noch Geburtsdatum. Wir fragen nichts davon ab.
          </p>
          <p>
            <strong className="text-ink">Deine Antworten.</strong> Was du im Übungsinterview schreibst, wird nur zur Bewertung
            an unseren KI-Anbieter geschickt und danach ausschliesslich in deinem Browser (Session) gespeichert. Wir speichern
            deine Antworten nicht dauerhaft auf unseren Servern.
          </p>
          <p>
            <strong className="text-ink">Anonyme Statistik.</strong> Wir messen anonym, wie NextRound genutzt wird (z. B. ob ein
            Interview gestartet oder abgeschlossen wurde). Dafür verwenden wir eine cookielose Analytics-Lösung. Interview-Antworten
            werden nie an die Statistik gesendet.
          </p>
          <p>
            <strong className="text-ink">Teilen-Links.</strong> Wenn du NextRound teilst, enthält der Link eine zufällige, anonyme
            Kennung. Sie sagt nichts über dich aus und dient nur dazu, zu sehen, ob geteilte Links genutzt werden.
          </p>
          <p>Fragen? Schreib uns – die Kontaktadresse folgt mit dem offiziellen Launch.</p>
        </div>
      </Shell>
    </main>
  );
}
