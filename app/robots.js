import { SITE_URL } from "@/lib/site";

// Search engines may list the public pages only. The pages behind sign-in
// are skipped. /verify/ (employee ID cards) is left crawlable on purpose: its
// "noindex" tag only works if search engines can read the page.
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/login", "/register", "/member-login"],
      disallow: [
        "/dashboard", "/dashboard2", "/attendance", "/department",
        "/designation", "/employees", "/geolocation", "/member", "/org-chart",
        "/profile", "/shifts", "/tasks", "/forgot-password", "/reset-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
