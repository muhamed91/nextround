import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "nextround – Übe dein Vorstellungsgespräch",
    short_name: "nextround",
    description: "Übe typische Fragen für dein Lehrstellen-Vorstellungsgespräch und bekomme direkt Feedback.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#5b2eff",
    lang: "de-CH",
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
