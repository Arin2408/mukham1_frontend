import { publicPage } from "@/lib/site";

export const metadata = publicPage({
  title: "Employee Sign In",
  description: "Employees sign in to Mukham to mark attendance and see their tasks.",
  path: "/member-login",
});

export default function Layout({ children }) {
  return children;
}
