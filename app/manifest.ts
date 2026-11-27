import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BEACON",
    short_name: "BEACON",
    description: "Log the movies, series, anime and games you watch and play.",
    start_url: "/",
    display: "standalone",
    background_color: "#222326",
    theme_color: "#141517",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
