"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react";

import { Card } from "@/components/ui/card";

// "Finish setting up" card for a new organisation's admin. The counts come
// from dashboard/summary (setup); the card goes away once every step is done.
const STEPS = [
  { key: "locations", label: "Add your office location", hint: "Employees can only check in near it", href: "/geolocation" },
  { key: "departments", label: "Add a department", href: "/department" },
  { key: "designations", label: "Add a designation", hint: "A job title within a department", href: "/designation" },
  { key: "shifts", label: "Add a shift", hint: "Working hours, used for late marks", href: "/shifts" },
  { key: "employees", label: "Add your first employee", hint: "Share the password shown after adding", href: "/employees" },
  { key: "faces", label: "Employee registers their face", hint: "Done at their first sign-in on the app", href: "/employees" },
];

export default function SetupChecklist({ setup }) {
  if (!setup) return null;

  const done = STEPS.filter((step) => setup[step.key] > 0).length;
  if (done === STEPS.length) return null;

  return (
    <Card className="quantanex-card p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg font-semibold text-foreground">Finish setting up Mukham</h2>
        <span className="text-xs font-bold text-muted-foreground">
          {done} of {STEPS.length} done
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Complete these steps so your employees can start marking attendance.
      </p>
      <ol className="space-y-3">
        {STEPS.map((step) => {
          const complete = setup[step.key] > 0;
          return (
            <li key={step.key}>
              <Link
                href={step.href}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  complete
                    ? "border-green-500/20 bg-green-500/10"
                    : "border-foreground/10 hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {complete ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" aria-label="Done" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-label="To do" />
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm font-medium ${
                      complete ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.hint && !complete ? (
                    <span className="block text-xs text-muted-foreground">{step.hint}</span>
                  ) : null}
                </span>
                {!complete ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
