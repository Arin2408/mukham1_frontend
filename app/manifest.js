import { SITE_DESCRIPTION } from "@/lib/site";

// Lets phones add the site to the home screen with the Mukham icon.
export default function manifest() {
  return {
    name: "Mukham",
    short_name: "Mukham",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
