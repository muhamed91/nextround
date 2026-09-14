import data from "./professions.json";

export type Profession = { id: string; name: string; degree: "EFZ" | "EBA" };

type RawProfession = {
  id: string;
  name: string;
  degree: string;
  aliases: string[];
  keywords: string[];
};

function normalize(s: string) {
  return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

/**
 * Complete local list of Swiss apprenticeships (EFZ + EBA) – no network request needed.
 * Source of truth: `professions.json` (berufsberatung.ch Berufs-Check / SDBB).
 */
const ENTRIES = (data.professions as RawProfession[]).map((p) => ({
  profession: {
    id: p.id,
    name: p.name,
    degree: p.degree === "EBA" ? "EBA" : "EFZ",
  } satisfies Profession,
  /** Normalized haystack for search: name + aliases + keywords. */
  haystack: normalize([p.name, ...p.aliases, ...p.keywords].join(" ")),
}));

export const ALL_PROFESSIONS: Profession[] = ENTRIES.map((e) => e.profession).sort((a, b) =>
  a.name.localeCompare(b.name, "de"),
);

const byId = new Map(ALL_PROFESSIONS.map((p) => [p.id, p]));

/** Shown first when the search field is empty. */
export const POPULAR_PROFESSIONS: Profession[] = [
  "kaufmann-frau-efz",
  "informatiker-in-efz",
  "detailhandelsfachmann-frau-efz-lebensmittel",
  "fachmann-frau-gesundheit-efz",
  "mediamatiker-in-efz",
  "automatiker-in-efz",
]
  .map((id) => byId.get(id))
  .filter((p): p is Profession => Boolean(p));

export const GENERAL_PROFESSION = "Allgemeine Lehrstelle";

/** Client-side search: every word of the query must appear in name, aliases or keywords. */
export function searchProfessions(query: string): Profession[] {
  const q = normalize(query.trim());
  if (!q) return POPULAR_PROFESSIONS;
  const words = q.split(/\s+/);
  const hits = ENTRIES.filter((e) => words.every((w) => e.haystack.includes(w))).map((e) => e.profession);
  // Name matches first, then alias/keyword-only matches.
  const nameHit = (p: Profession) => words.every((w) => normalize(p.name).includes(w));
  return hits.sort((a, b) => Number(nameHit(b)) - Number(nameHit(a)) || a.name.localeCompare(b.name, "de"));
}
