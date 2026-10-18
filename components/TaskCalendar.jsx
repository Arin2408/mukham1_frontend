"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Flag,
  Pencil,
  PlayCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { FastAPI, apiErrorMessage } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const ISO = "yyyy-MM-dd";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK = { weekStartsOn: 1 };

const STATUS_LABEL = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

const STATUS_STYLE = {
  pending: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
};

const PRIORITY_STYLE = {
  low: "text-slate-600 dark:text-slate-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-red-600 dark:text-red-400",
};

// Calendar events derived from a task's dates.
const EVENT = {
  assigned: {
    label: "Assigned",
    icon: CalendarPlus,
    chip: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
    dot: "bg-blue-500",
  },
  due: {
    label: "Due",
    icon: Flag,
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
    dot: "bg-amber-500",
  },
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    chip: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25",
    dot: "bg-red-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    dot: "bg-emerald-500",
  },
};

const toDate = (value) => (value ? parseISO(value) : null);

const emptyForm = (date) => ({
  employee_id: "",
  title: "",
  description: "",
  priority: "medium",
  assigned_date: format(date || new Date(), ISO),
  due_date: "",
});

/**
 * Task calendar.
 *   mode="admin":  all organisation tasks, assign / edit / delete.
 *   mode="member": the logged-in employee's own tasks; they can start and
 *                  complete them.
 *   mode="team":   a manager's direct reports' tasks (employees = the team,
 *                  userId = the manager); they assign tasks to the team and
 *                  manage the ones they assigned.
 */
export default function TaskCalendar({ mode = "admin", employees = [], userId = null }) {
  const isAdmin = mode === "admin";
  const isTeam = mode === "team";
  // Admin and manager views list several people's tasks and assign new ones.
  const showsPeople = isAdmin || isTeam;
  // Admin: every task. Manager: only the ones they assigned.
  const canManage = (task) => isAdmin || (isTeam && task.created_by_id === userId);
  // Status: the assignee (member view), the admin, or whoever assigned it.
  const canChangeStatus = (task) => mode === "member" || canManage(task);
  const { toast } = useToast();

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [openTask, setOpenTask] = useState(null);
  const [completedOn, setCompletedOn] = useState(format(new Date(), ISO));
  const [form, setForm] = useState(null); // create / edit dialog state
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Default the "completed on" date to today each time a task is opened.
  useEffect(() => {
    if (openTask) setCompletedOn(format(new Date(), ISO));
  }, [openTask?.task_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const gridStart = startOfWeek(startOfMonth(month), WEEK);
  const gridEnd = endOfWeek(endOfMonth(month), WEEK);
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [month]
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        from: format(gridStart, ISO),
        to: format(gridEnd, ISO),
      });
      if (isTeam) params.set("scope", "team");
      if (showsPeople && employeeFilter !== "all") params.set("employee_id", employeeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const { data } = await FastAPI.get(`tasks?${params}`);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: apiErrorMessage(error, "Failed to load tasks"),
      });
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, employeeFilter, statusFilter, showsPeople, isTeam, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // date string -> [{type, task}]
  const eventsByDay = useMemo(() => {
    const map = new Map();
    const add = (dateStr, type, task) => {
      if (!dateStr) return;
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr).push({ type, task });
    };
    for (const task of tasks) {
      add(task.assigned_date, "assigned", task);
      if (task.status === "completed") {
        add(task.completed_date, "completed", task);
      } else if (task.due_date) {
        add(task.due_date, task.is_overdue ? "overdue" : "due", task);
      }
    }
    return map;
  }, [tasks]);

  // Tasks in progress on a given day (assigned on/before, not yet completed).
  const activeOn = useCallback(
    (day) =>
      tasks.filter((t) => {
        const start = toDate(t.assigned_date);
        const end = t.completed_date ? toDate(t.completed_date) : null;
        return start <= day && (!end || end >= day);
      }),
    [tasks]
  );

  const summary = useMemo(() => {
    const inMonth = (d) => d && isSameMonth(toDate(d), month);
    return {
      open: tasks.filter((t) => t.status !== "completed").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      overdue: tasks.filter((t) => t.is_overdue).length,
      completedThisMonth: tasks.filter(
        (t) => t.status === "completed" && inMonth(t.completed_date)
      ).length,
    };
  }, [tasks, month]);

  const goToMonth = (next) => {
    setMonth(startOfMonth(next));
    setSelectedDay(isSameMonth(next, new Date()) ? new Date() : startOfMonth(next));
  };

  // ------------------------------------------------------------ actions
  const replaceTask = (updated) => {
    setTasks((prev) => prev.map((t) => (t.task_id === updated.task_id ? updated : t)));
    setOpenTask((prev) => (prev && prev.task_id === updated.task_id ? updated : prev));
  };

  const changeStatus = async (task, status) => {
    setIsSaving(true);
    try {
      const body = { status };
      if (status === "completed") body.completed_date = completedOn;
      const { data } = await FastAPI.patch(`tasks/${task.task_id}/status`, body);
      replaceTask(data);
      toast({
        title: "Task updated",
        description:
          status === "completed"
            ? `Marked complete on ${format(toDate(data.completed_date), "d MMM yyyy")}.`
            : `Status changed to ${STATUS_LABEL[status].toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: apiErrorMessage(error, "Failed to update the task"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openCreate = () => setForm({ mode: "create", values: emptyForm(selectedDay) });

  const openEdit = (task) =>
    setForm({
      mode: "edit",
      taskId: task.task_id,
      values: {
        employee_id: String(task.employee_id),
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        assigned_date: task.assigned_date,
        due_date: task.due_date || "",
      },
    });

  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, values: { ...prev.values, [field]: value } }));

  const formError = (() => {
    if (!form) return null;
    const v = form.values;
    if (!v.employee_id) return "Choose an employee.";
    if (!v.title.trim()) return "Enter a task title.";
    if (!v.assigned_date) return "Choose the assigned date.";
    if (v.due_date && v.due_date < v.assigned_date) {
      return "Due date cannot be before the assigned date.";
    }
    return null;
  })();

  const saveForm = async (e) => {
    e.preventDefault();
    if (formError) return;
    setIsSaving(true);
    const v = form.values;
    const body = {
      employee_id: Number(v.employee_id),
      title: v.title.trim(),
      description: v.description.trim() || null,
      priority: v.priority,
      assigned_date: v.assigned_date,
      due_date: v.due_date || null,
    };
    try {
      if (form.mode === "create") {
        await FastAPI.post("tasks", body);
        toast({ title: "Task assigned", description: body.title });
      } else {
        const { data } = await FastAPI.put(`tasks/${form.taskId}`, body);
        replaceTask(data);
        toast({ title: "Task updated", description: body.title });
      }
      setForm(null);
      setSelectedDay(toDate(v.assigned_date));
      if (!isSameMonth(toDate(v.assigned_date), month)) {
        setMonth(startOfMonth(toDate(v.assigned_date)));
      } else {
        load();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: apiErrorMessage(error, "Failed to save the task"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTask = async () => {
    const task = confirmDelete;
    setConfirmDelete(null);
    try {
      await FastAPI.delete(`tasks/${task.task_id}`);
      setTasks((prev) => prev.filter((t) => t.task_id !== task.task_id));
      setOpenTask(null);
      toast({ title: "Task deleted", description: task.title });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: apiErrorMessage(error, "Failed to delete the task"),
      });
    }
  };

  // ------------------------------------------------------------ render
  const selectedKey = format(selectedDay, ISO);
  const selectedEvents = eventsByDay.get(selectedKey) || [];
  const selectedActive = activeOn(selectedDay);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Open", summary.open, Circle, "text-foreground"],
          ["In progress", summary.inProgress, PlayCircle, "text-blue-600 dark:text-blue-400"],
          ["Overdue", summary.overdue, AlertTriangle, "text-red-600 dark:text-red-400"],
          ["Completed this month", summary.completedThisMonth, CheckCircle2, "text-emerald-600 dark:text-emerald-400"],
        ].map(([label, value, Icon, tone]) => (
          <Card key={label} className="quantanex-card p-4 border-foreground/5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className={`h-3.5 w-3.5 ${tone}`} />
              {label}
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums mt-1">
              {value}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="quantanex-card p-4 sm:p-6 border-foreground/5 xl:col-span-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => goToMonth(subMonths(month, 1))} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => goToMonth(addMonths(month, 1))} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold text-foreground min-w-[9rem]" aria-live="polite">
              {format(month, "MMMM yyyy")}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => goToMonth(new Date())}>
              Today
            </Button>
            <div className="flex flex-wrap gap-2 sm:ml-auto w-full sm:w-auto">
              {showsPeople && (
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                  <SelectTrigger className="w-full sm:w-44" aria-label="Filter by employee">
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.employee_id} value={String(e.employee_id)}>
                        {e.first_name} {e.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36" aria-label="Filter by status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showsPeople && (
                <Button onClick={openCreate} className="w-full sm:w-auto">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Assign task
                </Button>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
            {["assigned", "due", "overdue", "completed"].map((type) => (
              <span key={type} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${EVENT[type].dot}`} />
                {EVENT[type].label}
              </span>
            ))}
          </div>

          <div className={`grid grid-cols-7 border-l border-t border-foreground/10 rounded-lg overflow-hidden ${isLoading ? "opacity-60" : ""}`} aria-busy={isLoading}>
            {WEEKDAYS.map((d) => (
              <div key={d} className="border-r border-b border-foreground/10 bg-foreground/[0.03] py-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {days.map((day) => {
              const key = format(day, ISO);
              const events = eventsByDay.get(key) || [];
              const inMonth = isSameMonth(day, month);
              const selected = isSameDay(day, selectedDay);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  aria-label={`${format(day, "EEEE d MMMM")}${events.length ? `, ${events.length} event${events.length === 1 ? "" : "s"}` : ""}`}
                  aria-pressed={selected}
                  className={`relative min-h-[3.5rem] sm:min-h-[6.5rem] border-r border-b border-foreground/10 p-1 sm:p-1.5 text-left align-top transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                    selected ? "bg-primary/10" : "hover:bg-foreground/[0.04]"
                  } ${inMonth ? "" : "bg-foreground/[0.02]"}`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums ${
                      isToday(day)
                        ? "bg-primary text-primary-foreground font-bold"
                        : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {/* Phones: coloured dots */}
                  {events.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1 sm:hidden">
                      {events.slice(0, 4).map(({ type, task }) => (
                        <span key={`${type}-${task.task_id}`} className={`h-1.5 w-1.5 rounded-full ${EVENT[type].dot}`} />
                      ))}
                    </div>
                  )}
                  {/* Larger screens: labelled chips */}
                  <div className="hidden sm:flex flex-col gap-0.5 mt-1">
                    {events.slice(0, 3).map(({ type, task }) => {
                      const Icon = EVENT[type].icon;
                      return (
                        <span
                          key={`${type}-${task.task_id}`}
                          className={`flex items-center gap-1 rounded border px-1 py-0.5 text-[11px] leading-tight ${EVENT[type].chip}`}
                          title={`${EVENT[type].label}: ${task.title} (${task.employee_name})`}
                        >
                          <Icon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{task.title}</span>
                        </span>
                      );
                    })}
                    {events.length > 3 && (
                      <span className="text-[11px] text-muted-foreground px-1">
                        +{events.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected day */}
        <Card className="quantanex-card p-4 sm:p-6 border-foreground/5 min-w-0">
          <h3 className="text-base font-semibold text-foreground">
            {format(selectedDay, "EEEE, d MMMM yyyy")}
          </h3>

          <section className="mt-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">On this day</h4>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing assigned, due or completed.</p>
            ) : (
              <ul className="space-y-2">
                {selectedEvents.map(({ type, task }) => {
                  const Icon = EVENT[type].icon;
                  return (
                    <li key={`${type}-${task.task_id}`}>
                      <button
                        type="button"
                        onClick={() => setOpenTask(task)}
                        className={`w-full flex items-start gap-2 rounded-lg border px-3 py-2 text-left hover:opacity-90 ${EVENT[type].chip}`}
                      >
                        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium truncate">{task.title}</span>
                          <span className="block text-xs opacity-80 truncate">
                            {EVENT[type].label}
                            {showsPeople ? ` · ${task.employee_name}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-6">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              In progress that day ({selectedActive.length})
            </h4>
            {selectedActive.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open tasks.</p>
            ) : (
              <ul className="divide-y divide-foreground/5">
                {selectedActive.map((task) => (
                  <li key={task.task_id}>
                    <button
                      type="button"
                      onClick={() => setOpenTask(task)}
                      className="w-full flex items-center gap-2 py-2 text-left hover:bg-foreground/[0.03] rounded"
                    >
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] shrink-0 ${STATUS_STYLE[task.status]}`}>
                        {STATUS_LABEL[task.status]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-foreground truncate">{task.title}</span>
                        {showsPeople && (
                          <span className="block text-xs text-muted-foreground truncate">{task.employee_name}</span>
                        )}
                      </span>
                      {task.is_overdue && (
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" aria-label="Overdue" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Card>
      </div>

      {/* Task details */}
      <Dialog open={Boolean(openTask)} onOpenChange={(open) => !open && setOpenTask(null)}>
        <DialogContent className="sm:max-w-lg">
          {openTask && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{openTask.title}</DialogTitle>
                <DialogDescription>
                  {showsPeople ? `${openTask.employee_name}${openTask.department_name ? ` · ${openTask.department_name}` : ""}` : "Assigned to you"}
                  {openTask.assigned_by_name ? ` · Assigned by ${openTask.assigned_by_name}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[openTask.status]}`}>
                  {STATUS_LABEL[openTask.status]}
                </span>
                <span className={`rounded-full border border-foreground/10 px-2 py-0.5 text-xs capitalize ${PRIORITY_STYLE[openTask.priority]}`}>
                  {openTask.priority} priority
                </span>
                {openTask.is_overdue && (
                  <span className="rounded-full border px-2 py-0.5 text-xs bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25">
                    Overdue
                  </span>
                )}
                {openTask.completed_late && (
                  <span className="rounded-full border px-2 py-0.5 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25">
                    Completed late
                  </span>
                )}
              </div>

              {openTask.description && (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{openTask.description}</p>
              )}

              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Assigned", openTask.assigned_date],
                  ["Due", openTask.due_date],
                  ["Completed", openTask.completed_date],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-foreground/[0.03] px-3 py-2">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-foreground">
                      {value ? format(toDate(value), "d MMM yyyy") : "—"}
                    </dd>
                  </div>
                ))}
                <div className="rounded-lg bg-foreground/[0.03] px-3 py-2">
                  <dt className="text-xs text-muted-foreground">
                    {openTask.completed_date ? "Took" : "Open for"}
                  </dt>
                  <dd className="font-medium text-foreground">
                    {(() => {
                      const end = openTask.completed_date ? toDate(openTask.completed_date) : new Date();
                      const days = Math.max(0, differenceInCalendarDays(end, toDate(openTask.assigned_date)));
                      return `${days} day${days === 1 ? "" : "s"}`;
                    })()}
                  </dd>
                </div>
              </dl>

              {openTask.status !== "completed" && canChangeStatus(openTask) && (
                <div className="flex flex-wrap items-end gap-2 rounded-lg border border-foreground/10 p-3">
                  <div className="space-y-1">
                    <label htmlFor="completed-on" className="text-xs text-muted-foreground">Completed on</label>
                    <Input
                      id="completed-on"
                      type="date"
                      value={completedOn}
                      min={openTask.assigned_date}
                      max={format(new Date(), ISO)}
                      onChange={(e) => setCompletedOn(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <Button onClick={() => changeStatus(openTask, "completed")} disabled={isSaving || !completedOn}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark complete
                  </Button>
                  {openTask.status === "pending" && (
                    <Button variant="outline" onClick={() => changeStatus(openTask, "in_progress")} disabled={isSaving}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start
                    </Button>
                  )}
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-2">
                {openTask.status === "completed" && canChangeStatus(openTask) && (
                  <Button variant="outline" onClick={() => changeStatus(openTask, "in_progress")} disabled={isSaving}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reopen
                  </Button>
                )}
                {canManage(openTask) && (
                  <>
                    <Button variant="outline" onClick={() => { setOpenTask(null); openEdit(openTask); }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => setConfirmDelete(openTask)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / edit (admin, or a manager for their team) */}
      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {form && (
            <form onSubmit={saveForm} className="space-y-4">
              <DialogHeader>
                <DialogTitle>{form.mode === "create" ? "Assign task" : "Edit task"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee</label>
                <Select value={form.values.employee_id} onValueChange={(v) => setField("employee_id", v)}>
                  <SelectTrigger aria-label="Employee">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.employee_id} value={String(e.employee_id)}>
                        {e.first_name} {e.last_name}
                        {e.department_name && e.department_name !== "N/A" ? ` · ${e.department_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="task-title" className="text-sm font-medium">Title</label>
                <Input
                  id="task-title"
                  value={form.values.title}
                  maxLength={200}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. Prepare monthly report"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="task-description" className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  id="task-description"
                  rows={3}
                  value={form.values.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={form.values.priority} onValueChange={(v) => setField("priority", v)}>
                    <SelectTrigger aria-label="Priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="task-assigned" className="text-sm font-medium">Assigned on</label>
                  <Input
                    id="task-assigned"
                    type="date"
                    value={form.values.assigned_date}
                    onChange={(e) => setField("assigned_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="task-due" className="text-sm font-medium">Due (optional)</label>
                  <Input
                    id="task-due"
                    type="date"
                    value={form.values.due_date}
                    min={form.values.assigned_date}
                    onChange={(e) => setField("due_date", e.target.value)}
                  />
                </div>
              </div>
              {formError && (form.values.title || form.values.employee_id) && (
                <p role="alert" className="text-sm text-destructive">{formError}</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setForm(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving || Boolean(formError)}>
                  {isSaving ? "Saving..." : form.mode === "create" ? "Assign task" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmDelete)} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{confirmDelete?.title}&quot;? Its dates will be removed from the calendar. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

