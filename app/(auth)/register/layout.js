import { publicPage } from "@/lib/site";

export const metadata = publicPage({
  title: "Register Your Organisation",
  description: "Create a Mukham account for your organisation and start tracking attendance.",
  path: "/register",
});

export default function Layout({ children }) {
  return children;
}
