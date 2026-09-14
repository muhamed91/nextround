import Link from "next/link";
import { BetaBadge, Logo } from "@/components/Logo";
import { Arrow, LinkButton } from "@/components/Button";
import { ArrowDoodle, Blob, Smiley } from "@/components/Doodles";
import { Shell } from "@/components/Shell";
import { ShareButton, ShareLink } from "@/components/ShareButton";

const trust = [
  { icon: "🛡️", label: "Sicherer auftreten" },
  { icon: "💬", label: "Bessere Antworten" },
  { icon: "✨", label: "Mehr Selbstvertrauen" },
];

export default function LandingPage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <Shell wide>
        <header className="flex items-center justify-between py-5">
          <Logo href={null} />
          <nav className="flex items-center gap-3 sm:gap-5">
            <a href="#so-funktionierts" className="hidden text-sm font-semibold text-muted hover:text-ink sm:inline">
              So funktioniert&apos;s
            </a>
            <ShareLink source="landing_header" />
            <BetaBadge />
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-2 lg:gap-16 lg:py-16">
          <div className="relative z-10 max-w-xl">
            <p className="hand mb-4 text-lg text-purple">Same you. Higher chances.</p>
            <h1 className="text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              Bereit für dein <span className="doodle-underline">nächstes</span> Vorstellungs&shy;gespräch?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted sm:text-xl">
              Übe typische Fragen und bekomme direkt Feedback. Realistische Fragen, ehrliches Feedback, mehr
              Selbstvertrauen im Gespräch.
            </p>

            <div className="mt-8 max-w-sm">
              <LinkButton href="/beruf">
                Los geht&apos;s <Arrow />
              </LinkButton>
              <p className="mt-3 text-center text-sm font-semibold text-muted">Kostenlos. Ohne Anmeldung.</p>
              <ShareButton source="landing" className="mt-4" />
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3" id="so-funktionierts">
              {trust.map((t) => (
                <li key={t.label} className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span aria-hidden="true">{t.icon}</span>
                  {t.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className="relative mx-auto h-72 w-full max-w-md sm:h-96 lg:h-[30rem]" aria-hidden="true">
            <Blob color="lime" className="absolute -left-6 top-0 h-56 w-56 sm:h-72 sm:w-72 rotate-12" />
            <Blob color="purple" className="absolute bottom-0 right-0 h-60 w-60 sm:h-80 sm:w-80 -rotate-6" />
            <Smiley className="absolute bottom-6 right-6 h-32 w-32 text-ink sm:h-44 sm:w-44" />
            <ArrowDoodle className="absolute right-10 top-4 h-16 w-16 text-ink sm:h-20 sm:w-20" />
            <p className="hand absolute left-2 top-16 text-2xl leading-tight text-ink sm:text-3xl">
              Üben.
              <br />
              Besser auftreten.
              <br />
              Next round.
            </p>
            <p className="hand absolute bottom-14 left-6 text-lg leading-tight text-ink sm:text-xl">
              Good answers.
              <br />
              Brighter future.
            </p>
          </div>
        </section>

        <footer className="mt-auto flex flex-col items-start justify-between gap-3 border-t border-line py-6 text-sm text-muted sm:flex-row sm:items-center">
          <span>
            <span className="font-bold text-ink">nextround</span> · Für alle, die mehr aus sich machen wollen.
          </span>
          <div className="flex gap-5">
            <Link href="/datenschutz" className="hover:text-ink">
              Datenschutz
            </Link>
          </div>
        </footer>
      </Shell>
    </main>
  );
}
