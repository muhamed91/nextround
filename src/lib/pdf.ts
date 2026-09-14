import type { Session } from "./types";
import { readinessScore, scoreHeadline, scoreSubline, buildInsights } from "./score";

const PURPLE: [number, number, number] = [91, 46, 255];
const INK: [number, number, number] = [17, 17, 17];
const MUTED: [number, number, number] = [92, 92, 102];
const LILAC: [number, number, number] = [240, 235, 255];
const LIME: [number, number, number] = [212, 255, 60];

/** Strip emoji – the built-in PDF fonts can't render them. */
function plain(s: string) {
  return s.replace(/[\p{Extended_Pictographic}️]/gu, "").replace(/\s{2,}/g, " ").trim();
}

/** Builds and downloads a PDF summary of the finished interview. Client-only. */
export async function downloadResultPdf(session: Session): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210;
  const M = 18;
  const CW = W - 2 * M;
  let y = 0;

  const score = readinessScore(session.results);
  const insights = buildInsights(session.questions, session.results);
  const date = new Date(session.startedAt).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
  const title = session.isGeneral ? "Allgemeine Lehrstelle" : session.profession;

  function ensure(h: number) {
    if (y + h > 297 - 18) {
      doc.addPage();
      y = 20;
    }
  }

  function text(str: string, size: number, color: [number, number, number], bold = false, lineH = 1.35, maxW = CW) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(plain(str), maxW) as string[];
    const h = lines.length * size * 0.3528 * lineH;
    ensure(h);
    doc.text(lines, M, y + size * 0.3528);
    y += h;
  }

  // ---- Header ----
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 26, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("nextround", M, 16.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 210);
  doc.text("Same you. Higher chances.", W - M, 16.5, { align: "right" });

  y = 38;
  text("Dein Interview-Ergebnis", 22, INK, true, 1.2);
  y += 1;
  text(`${title}${session.company ? ` · ${session.company}` : ""} · ${date}`, 11, MUTED);
  y += 6;

  // ---- Score box ----
  ensure(34);
  doc.setFillColor(...LIME);
  doc.roundedRect(M, y, 48, 28, 5, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...INK);
  doc.text(String(score), M + 24, y + 17, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("von 100", M + 24, y + 23.5, { align: "center" });

  const saveY = y;
  const xText = M + 56;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text(plain(scoreHeadline(score)), xText, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const sub = doc.splitTextToSize(plain(scoreSubline(score)), CW - 56) as string[];
  doc.text(sub, xText, y + 15);
  y = Math.max(saveY + 34, y + 15 + sub.length * 4.6);

  // ---- Insights ----
  const insightRows: Array<[string, string]> = [
    ["Das sitzt", insights.strong],
    ["Das solltest du noch üben", insights.practice],
    ["Deine wichtigste Verbesserung", insights.improvement],
  ];
  for (const [label, value] of insightRows) {
    ensure(16);
    doc.setFillColor(...LILAC);
    doc.roundedRect(M, y, CW, 14, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PURPLE);
    doc.text(label.toUpperCase(), M + 5, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    const v = doc.splitTextToSize(plain(value), CW - 10) as string[];
    doc.text(v[0] ?? "", M + 5, y + 10.5);
    y += 17;
  }
  y += 6;

  // ---- Per question ----
  text("Deine Antworten im Detail", 15, INK, true, 1.2);
  y += 3;

  session.questions.forEach((q, i) => {
    const r = session.results[i];
    if (!r) return;
    ensure(30);
    // divider
    doc.setDrawColor(230, 230, 235);
    doc.line(M, y, W - M, y);
    y += 5;

    // question + score pill
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...INK);
    const qLines = doc.splitTextToSize(`${i + 1}. ${plain(q.question)}`, CW - 22) as string[];
    doc.text(qLines, M, y + 4);
    doc.setFillColor(...PURPLE);
    doc.roundedRect(W - M - 18, y, 18, 8, 4, 4, "F");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${r.score}/10`, W - M - 9, y + 5.5, { align: "center" });
    y += qLines.length * 5.5 + 3;

    if (r.answer) {
      text("Deine Antwort", 8.5, MUTED, true, 1.2);
      text(r.answer, 10, INK, false, 1.4);
      y += 2;
    }
    text("Das war gut", 8.5, MUTED, true, 1.2);
    text(r.positive, 10, INK, false, 1.4);
    y += 2;
    text("Mach es noch stärker", 8.5, MUTED, true, 1.2);
    text(r.improvement, 10, INK, false, 1.4);
    y += 2;
    if (r.betterAnswer) {
      text("So könnte es klingen", 8.5, PURPLE, true, 1.2);
      text(`"${r.betterAnswer}"`, 10, INK, false, 1.4);
    }
    y += 5;
  });

  // ---- Footer on every page ----
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("nextround · Übe dein Vorstellungsgespräch · kostenlos, ohne Anmeldung", M, 290);
    doc.text(`${p} / ${pages}`, W - M, 290, { align: "right" });
  }

  const safe = plain(title).replace(/[^\wäöü]+/gi, "-").replace(/(^-|-$)/g, "").toLowerCase();
  doc.save(`nextround-${safe || "interview"}-${date.replace(/\./g, "-")}.pdf`);
}
