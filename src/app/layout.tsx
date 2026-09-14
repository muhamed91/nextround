import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ReferralTracker } from "@/components/ReferralTracker";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const hand = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "nextround – Übe dein Vorstellungsgespräch",
  description:
    "Übe typische Fragen für dein Lehrstellen-Vorstellungsgespräch und bekomme direkt ehrliches Feedback. Kostenlos. Ohne Anmeldung.",
  applicationName: "nextround",
  keywords: ["Vorstellungsgespräch", "Lehrstelle", "Bewerbung", "Interview üben", "Lehre", "Schweiz"],
  openGraph: {
    title: "nextround – Übe dein Vorstellungsgespräch",
    description: "Same you. Higher chances. Übe für deine Lehrstelle – kostenlos, ohne Anmeldung.",
    type: "website",
    locale: "de_CH",
    url: "/",
    siteName: "nextround",
  },
  twitter: {
    card: "summary_large_image",
    title: "nextround – Übe dein Vorstellungsgespräch",
    description: "Same you. Higher chances. Übe für deine Lehrstelle – kostenlos, ohne Anmeldung.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fafaf7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de-CH" className={`${sans.variable} ${hand.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {plausibleDomain ? (
          <>
            <Script
              defer
              data-domain={plausibleDomain}
              src="https://plausible.io/js/script.js"
              strategy="afterInteractive"
            />
            <Script id="plausible-queue" strategy="beforeInteractive">
              {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}
            </Script>
          </>
        ) : null}
        <ReferralTracker />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
