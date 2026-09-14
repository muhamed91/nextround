import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Shell } from "@/components/Shell";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { lastDays, pipeline, storeConfigured } from "@/lib/store";
import { StatsLogin } from "./StatsLogin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stats – nextround", robots: { index: false, follow: false } };

type Hash = Record<string, string> | string[] | null;

function toObj(h: Hash): Record<string, number> {
  if (!h) return {};
  if (Array.isArray(h)) {
    const o: Record<string, number> = {};
    for (let i = 0; i < h.length; i += 2) o[h[i]] = Number(h[i + 1]) || 0;
    return o;
  }
  return Object.fromEntries(Object.entries(h).map(([k, v]) => [k, Number(v) || 0]));
}

function pct(a: number, b: number) {
  return b > 0 ? `${Math.round((a / b) * 100)} %` : "–";
}

function top(o: Record<string, number>, n = 8) {
  return Object.entries(o)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export default async function StatsPage() {
  const secret = process.env.STATS_SECRET;
  if (!secret) notFound();

  const jar = await cookies();
  const authed = jar.get("nextround_stats")?.value === secret;
  if (!authed) {
    return (
      <main className="min-h-dvh">
        <Shell>
          <header className="py-4">
            <Logo />
          </header>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Stats</h1>
          <p className="mt-2 text-muted">Interner Bereich. Bitte Passwort eingeben.</p>
          <StatsLogin />
        </Shell>
      </main>
    );
  }

  if (!storeConfigured()) {
    return (
      <main className="min-h-dvh">
        <Shell>
          <header className="py-4">
            <Logo />
          </header>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Stats</h1>
          <div className="mt-6 rounded-3xl border border-line bg-white p-5 text-base leading-relaxed">
            <p className="font-bold">Noch keine Datenbank verbunden.</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
              <li>Auf vercel.com im Projekt den Tab „Storage“ öffnen und „Upstash Redis“ (Free) erstellen.</li>
              <li>Vercel trägt die Variablen KV_REST_API_URL und KV_REST_API_TOKEN automatisch ein.</li>
              <li>Einmal neu deployen. Ab dann werden alle Events hier gezählt.</li>
            </ol>
          </div>
        </Shell>
      </main>
    );
  }

  const days = lastDays(30);
  const res = await pipeline<Hash | number>([
    ["PFCOUNT", "stats:visitors:total"],
    ["PFCOUNT", ...days.slice(0, 1).map((d) => `stats:visitors:${d}`)],
    ["PFCOUNT", ...days.slice(0, 7).map((d) => `stats:visitors:${d}`)],
    ["PFCOUNT", ...days.map((d) => `stats:visitors:${d}`)],
    ["HGETALL", "stats:events:total"],
    ["HGETALL", "stats:professions"],
    ["HGETALL", "stats:referrers"],
    ["HGETALL", "stats:countries"],
    ["HGETALL", "stats:devices"],
    ["HGETALL", `stats:pages:${days[0]}`],
    ["HGETALL", "stats:share:clicked"],
    ["HGETALL", "stats:share:completed"],
    ...days.map((d) => ["PFCOUNT", `stats:visitors:${d}`] as Array<string | number>),
    ...days.map((d) => ["HGETALL", `stats:events:${d}`] as Array<string | number>),
  ]);

  if (!res) {
    return (
      <main className="min-h-dvh">
        <Shell>
          <h1 className="mt-6 text-3xl font-extrabold">Stats</h1>
          <p className="mt-4 text-muted">Datenbank nicht erreichbar. Bitte später nochmal versuchen.</p>
        </Shell>
      </main>
    );
  }

  const FIXED = 12;
  const [vTotal, vToday, v7, v30, evTotalRaw, profRaw, refRaw, countryRaw, deviceRaw, pagesRaw, shareClickedRaw, shareCompletedRaw] =
    res.slice(0, FIXED) as [number, number, number, number, Hash, Hash, Hash, Hash, Hash, Hash, Hash, Hash];
  const evTotal = toObj(evTotalRaw);
  const dailyVisitors = res.slice(FIXED, FIXED + days.length) as number[];
  const dailyEvents = (res.slice(FIXED + days.length) as Hash[]).map(toObj);
  const shareClicked = toObj(shareClickedRaw);
  const shareCompleted = toObj(shareCompletedRaw);
  const shareRows: Array<[string, number]> = Object.keys({ ...shareClicked, ...shareCompleted })
    .sort((a, b) => (shareClicked[b] ?? 0) - (shareClicked[a] ?? 0))
    .map((k) => [`${k}: ${shareClicked[k] ?? 0} geklickt`, shareCompleted[k] ?? 0]);

  const funnel = [
    ["Startseite gesehen", evTotal.page_view ?? 0, null],
    ["Beruf gewählt", (evTotal.profession_selected ?? 0) + (evTotal.general_practice_selected ?? 0), evTotal.page_view ?? 0],
    ["Interview gestartet", evTotal.interview_started ?? 0, (evTotal.profession_selected ?? 0) + (evTotal.general_practice_selected ?? 0)],
    ["Interview abgeschlossen", evTotal.interview_completed ?? 0, evTotal.interview_started ?? 0],
    ["Nochmal geübt", evTotal.interview_restarted ?? 0, evTotal.interview_completed ?? 0],
    ["Geteilt", evTotal.share_completed ?? 0, evTotal.interview_completed ?? 0],
    ["PDF geladen", evTotal.pdf_downloaded ?? 0, evTotal.interview_completed ?? 0],
    ["Über Einladung gekommen", evTotal.referral_visit ?? 0, evTotal.share_completed ?? 0],
  ] as Array<[string, number, number | null]>;

  return (
    <main className="min-h-dvh">
      <Shell wide>
        <header className="flex items-center justify-between py-4">
          <Logo />
          <span className="rounded-full bg-lilac px-3 py-1 text-xs font-bold text-purple">INTERN</span>
        </header>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Wer ist auf nextround?</h1>
        <p className="mt-1 text-sm text-muted">Anonyme Zähler, Zeitzone Europe/Zurich. Aktualisiert bei jedem Laden.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Heute", vToday],
            ["Letzte 7 Tage", v7],
            ["Letzte 30 Tage", v30],
            ["Gesamt", vTotal],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-3xl border border-line bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums">{Number(value) || 0}</p>
              <p className="text-xs text-muted">Besucher</p>
            </div>
          ))}
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-white p-5">
            <h2 className="text-lg font-extrabold">Funnel (gesamt)</h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {funnel.map(([label, value, base]) => (
                  <tr key={label} className="border-t border-line">
                    <td className="py-2">{label}</td>
                    <td className="py-2 text-right font-bold tabular-nums">{value}</td>
                    <td className="py-2 pl-3 text-right text-muted tabular-nums">{base === null ? "" : pct(value, base)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-3xl border border-line bg-white p-5">
            <h2 className="text-lg font-extrabold">Letzte 30 Tage</h2>
            <div className="mt-3 max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="py-1">Tag</th>
                    <th className="py-1 text-right">Besucher</th>
                    <th className="py-1 text-right">Gestartet</th>
                    <th className="py-1 text-right">Fertig</th>
                    <th className="py-1 text-right">Geteilt</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d, i) => (
                    <tr key={d} className="border-t border-line tabular-nums">
                      <td className="py-1.5">{d}</td>
                      <td className="py-1.5 text-right font-bold">{dailyVisitors[i] || 0}</td>
                      <td className="py-1.5 text-right">{dailyEvents[i]?.interview_started ?? 0}</td>
                      <td className="py-1.5 text-right">{dailyEvents[i]?.interview_completed ?? 0}</td>
                      <td className="py-1.5 text-right">{dailyEvents[i]?.share_completed ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ListCard title="Top Lehrberufe" rows={top(toObj(profRaw))} />
          <ListCard title="Seiten heute" rows={top(toObj(pagesRaw))} />
          <ListCard title="Länder" rows={top(toObj(countryRaw))} />
          <ListCard title="Geräte" rows={top(toObj(deviceRaw))} />
          <ListCard title="Teilen-Buttons (geklickt → abgeschlossen)" rows={shareRows} />
          <ListCard title="Einladungen (Referral-Codes)" rows={top(toObj(refRaw))} />
          <ListCard title="Alle Events" rows={ANALYTICS_EVENTS.map((e) => [e, evTotal[e] ?? 0] as [string, number])} />
        </section>
      </Shell>
    </main>
  );
}

function ListCard({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      <h2 className="text-lg font-extrabold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Noch keine Daten.</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-t border-line">
                <td className="py-1.5 pr-3">{k}</td>
                <td className="py-1.5 text-right font-bold tabular-nums">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
