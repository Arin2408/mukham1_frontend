import { publicPage } from "@/lib/site";

export const metadata = publicPage({
  title: "About",
  description: "What Mukham does: face and location attendance, shifts, tasks and an org chart for your organisation.",
  path: "/about",
});

export default function Layout({ children }) {
  return children;
}
