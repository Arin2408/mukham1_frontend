"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { FastAPIGet, apiErrorMessage } from "@/context/AuthContext";
import TaskCalendar from "@/components/TaskCalendar";

// A manager's view: the tasks of the people who report to them, with
// "Assign task" limited to that team.
export default function TeamTasks({ userId }) {
  const [team, setTeam] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    FastAPIGet("team")
      .then((data) => setTeam(Array.isArray(data) ? data : []))
      .catch((err) => setError(apiErrorMessage(err, "Could not load your team.")));
  }, []);

  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!team) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading your team" />
      </div>
    );
  }
  if (team.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nobody reports to you yet. Your admin sets managers in the org chart.
      </p>
    );
  }
  return <TaskCalendar mode="team" employees={team} userId={userId} />;
}
