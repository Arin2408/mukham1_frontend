"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FastAPI, apiErrorMessage } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import TaskCalendar from "@/components/TaskCalendar";
import { useToast } from "@/hooks/use-toast";

export default function TasksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/login");
      return;
    }
    FastAPI.get("employees")
      .then(({ data }) =>
        setEmployees(
          (Array.isArray(data) ? data : []).sort((a, b) =>
            `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
          )
        )
      )
      .catch((error) =>
        toast({
          variant: "destructive",
          title: "Error",
          description: apiErrorMessage(error, "Failed to load employees"),
        })
      );
  }, [router, toast]);

  return (
    <>
      <Sidebar />
      <div className="lg:ml-[var(--sidebar-w)] transition-[margin] duration-300 p-4 sm:p-6 lg:p-10 space-y-6 min-h-screen bg-background">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight page-title">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            When each task was assigned, when it&apos;s due, and when it was completed.
          </p>
        </div>
        <TaskCalendar mode="admin" employees={employees} />
      </div>
    </>
  );
}
