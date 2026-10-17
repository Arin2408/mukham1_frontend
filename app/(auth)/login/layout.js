import { publicPage } from "@/lib/site";

export const metadata = publicPage({
  title: "Organisation Sign In",
  description: "Sign in to your Mukham organisation account.",
  path: "/login",
});

export default function Layout({ children }) {
  return children;
}
