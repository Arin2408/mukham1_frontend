import { SITE_URL } from "@/lib/site";

// Public pages only; everything else needs sign-in.
export default function sitemap() {
  return [
    { path: "/", priority: 1 },
    { path: "/about", priority: 0.8 },
    { path: "/register", priority: 0.6 },
    { path: "/login", priority: 0.5 },
    { path: "/member-login", priority: 0.5 },
  ].map(({ path, priority }) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
