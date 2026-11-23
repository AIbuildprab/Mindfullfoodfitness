import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mindfull Food Fitness",
    short_name: "MFF",
    description: "Your training, nutrition and coach in one place. Client app from Paul McGann.",
    lang: "en-GB",
    dir: "ltr",
    // The installed app opens straight into the client dashboard (sign-in first if needed).
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#F6F4EF",
    theme_color: "#FFFFFF",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Daily check-in", short_name: "Check-in", url: "/dashboard?checkin=1&source=shortcut", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Message Paul", short_name: "Messages", url: "/dashboard?tab=messages&source=shortcut", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Today's training", short_name: "Training", url: "/dashboard?tab=training&source=shortcut", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Book a session", short_name: "Book", url: "/dashboard?tab=schedule&source=shortcut", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
