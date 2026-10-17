// The public web address, used for canonical links, the sitemap and share
// previews. Set NEXT_PUBLIC_SITE_URL on the host (no trailing slash).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const SITE_NAME = "Mukham";

export const SITE_DESCRIPTION =
  "Face and location based attendance, shifts, tasks and team management for organisations.";

// A page search engines may list: its own title, description, canonical
// address and share preview (picture from app/opengraph-image.js).
export const publicPage = ({ title, description, path }) => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: title ? `${title} | ${SITE_NAME}` : undefined,
    description,
    url: path,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Mukham - face and location based attendance" }],
  },
  twitter: { card: "summary_large_image" },
});

// Pages behind sign-in: a title for the browser tab, kept out of search results.
export const privatePage = (title) => ({
  title,
  robots: { index: false, follow: false },
  alternates: { canonical: null },
});
