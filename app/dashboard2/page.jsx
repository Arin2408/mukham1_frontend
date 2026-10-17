import { redirect } from "next/navigation";

// The old copy of the employee dashboard. Employees use /member, which has
// the only check-in screen (with the AWS face liveness check).
export default function OldMemberDashboard() {
  redirect("/member");
}
