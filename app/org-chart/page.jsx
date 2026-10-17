"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Network,
  Search,
  UserCog,
  Users,
} from "lucide-react";
import { departmentLabel } from "@/lib/setupLabels";
import { FastAPI, apiErrorMessage, mediaUrl } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";

const ROOT = "org";

const fullName = (e) => `${e.first_name} ${e.last_name}`.trim();

const initials = (e) =>
  `${e.first_name?.[0] || ""}${e.last_name?.[0] || ""}`.toUpperCase() || "?";

// manager_id -> [employees]. Employees whose manager is missing from the
// list (should not happen) are shown under the organisation.
const buildChildren = (employees) => {
  const ids = new Set(employees.map((e) => e.employee_id));
  const children = new Map([[ROOT, []]]);
  for (const e of employees) {
    const parent =
      e.manager_id != null && ids.has(e.manager_id) ? e.manager_id : ROOT;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(e);
  }
  for (const list of children.values()) {
    list.sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }
  return children;
};

// All employees below `id` (used to block reporting loops in the UI).
const descendantsOf = (id, children) => {
  const result = new Set();
  const stack = [...(children.get(id) || [])];
  while (stack.length) {
    const e = stack.pop();
    if (result.has(e.employee_id)) continue;
    result.add(e.employee_id);
    stack.push(...(children.get(e.employee_id) || []));
  }
  return result;
};

function Avatar({ employee }) {
  const [failed, setFailed] = useState(false);
  const src = mediaUrl(employee.photo);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        // One photo per employee: only fetch the ones scrolled into view.
        loading="lazy"
        decoding="async"
        width={36}
        height={36}
        onError={() => setFailed(true)}
        className="h-9 w-9 shrink-0 rounded-full object-cover border border-foreground/10"
      />
    );
  }
  return (
    <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
      {initials(employee)}
    </div>
  );
}

function TreeNode({
  employee,
  tree,
  expanded,
  onToggle,
  onChangeManager,
  matches,
  query,
  departmentFilter,
}) {
  const reports = tree.get(employee.employee_id) || [];
  const isOpen = expanded.has(employee.employee_id);
  const isMatch = query && matches.has(employee.employee_id);
  const dimmed =
    departmentFilter !== "all" &&
    String(employee.department_id) !== departmentFilter;

  return (
    <li className="relative pl-6">
      {/* connector into this node */}
      <span
        aria-hidden
        className="absolute left-0 top-6 h-px w-5 bg-foreground/15"
      />
      <div
        className={`group flex items-center gap-3 rounded-xl border px-3 py-2 my-1.5 bg-card transition-colors ${
          isMatch
            ? "border-primary ring-2 ring-primary/20"
            : "border-foreground/10 hover:border-foreground/20"
        } ${dimmed ? "opacity-40" : ""}`}
      >
        <button
          type="button"
          onClick={() => reports.length && onToggle(employee.employee_id)}
          className={`h-6 w-6 shrink-0 rounded-md flex items-center justify-center ${
            reports.length
              ? "hover:bg-foreground/10 text-foreground/70"
              : "text-transparent cursor-default"
          }`}
          aria-label={isOpen ? "Collapse team" : "Expand team"}
          aria-expanded={reports.length ? isOpen : undefined}
          tabIndex={reports.length ? 0 : -1}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <Avatar employee={employee} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground truncate">
            {fullName(employee)}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {employee.designation_name || "No designation"}
            {employee.department_name ? ` · ${employee.department_name}` : ""}
          </div>
        </div>
        {reports.length > 0 && (
          <span
            className="hidden sm:inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/70"
            title="Direct reports"
          >
            <Users className="h-3 w-3" />
            {reports.length}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-foreground/50 hover:text-foreground"
          title="Change manager"
          aria-label={`Change manager of ${fullName(employee)}`}
          onClick={() => onChangeManager(employee)}
        >
          <UserCog className="h-4 w-4" />
        </Button>
      </div>
      {isOpen && reports.length > 0 && (
        <ul className="relative ml-3 border-l border-foreground/15">
          {reports.map((child) => (
            <TreeNode
              key={child.employee_id}
              employee={child}
              tree={tree}
              expanded={expanded}
              onToggle={onToggle}
              onChangeManager={onChangeManager}
              matches={matches}
              query={query}
              departmentFilter={departmentFilter}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrgChartPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [newManager, setNewManager] = useState(ROOT);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      router.push("/login");
      return;
    }
    try {
      const [hierarchy, depts, offices] = await Promise.all([
        FastAPI.get("employee-hierarchy"),
        FastAPI.get("departments"),
        FastAPI.get("locations"),
      ]);
      setData(hierarchy.data);
      setDepartments(Array.isArray(depts.data) ? depts.data : []);
      setLocations(Array.isArray(offices.data) ? offices.data : []);
      return hierarchy.data;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: apiErrorMessage(error, "Failed to load the org chart"),
      });
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    load().then((loaded) => {
      // Start with the first two levels open.
      if (loaded) {
        const top = loaded.employees.filter((e) => e.manager_id == null);
        setExpanded(new Set(top.map((e) => e.employee_id)));
      }
    });
  }, [load]);

  const employees = useMemo(() => data?.employees || [], [data]);
  const children = useMemo(() => buildChildren(employees), [employees]);
  const byId = useMemo(
    () => new Map(employees.map((e) => [e.employee_id, e])),
    [employees]
  );

  // Search matches, plus every manager above them so they stay visible.
  const { matches, pathToMatches } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = new Set();
    const pathToMatches = new Set();
    if (!q) return { matches, pathToMatches };
    for (const e of employees) {
      const text = `${fullName(e)} ${e.designation_name || ""} ${e.department_name || ""}`.toLowerCase();
      if (text.includes(q)) {
        matches.add(e.employee_id);
        let parent = e.manager_id;
        const seen = new Set();
        while (parent != null && byId.has(parent) && !seen.has(parent)) {
          seen.add(parent);
          pathToMatches.add(parent);
          parent = byId.get(parent).manager_id;
        }
      }
    }
    return { matches, pathToMatches };
  }, [query, employees, byId]);

  // Opening the path to search results.
  useEffect(() => {
    if (pathToMatches.size) {
      setExpanded((prev) => new Set([...prev, ...pathToMatches]));
    }
  }, [pathToMatches]);

  const stats = useMemo(() => {
    const managers = employees.filter(
      (e) => (children.get(e.employee_id) || []).length > 0
    ).length;
    const depthOf = (id, depth = 1, seen = new Set()) => {
      if (seen.has(id)) return depth;
      seen.add(id);
      const kids = children.get(id) || [];
      return kids.length
        ? Math.max(...kids.map((k) => depthOf(k.employee_id, depth + 1, seen)))
        : depth;
    };
    const levels = (children.get(ROOT) || []).length
      ? Math.max(...children.get(ROOT).map((e) => depthOf(e.employee_id)))
      : 0;
    return {
      total: employees.length,
      topLevel: (children.get(ROOT) || []).length,
      managers,
      levels,
    };
  }, [employees, children]);

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const expandAll = () =>
    setExpanded(
      new Set(
        employees
          .filter((e) => (children.get(e.employee_id) || []).length)
          .map((e) => e.employee_id)
      )
    );

  const openChangeManager = (employee) => {
    setEditing(employee);
    setNewManager(employee.manager_id != null ? String(employee.manager_id) : ROOT);
  };

  const blocked = useMemo(() => {
    if (!editing) return new Set();
    const set = descendantsOf(editing.employee_id, children);
    set.add(editing.employee_id);
    return set;
  }, [editing, children]);

  const saveManager = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      await FastAPI.put(`employees/${editing.employee_id}/manager`, {
        manager_id: newManager === ROOT ? null : Number(newManager),
      });
      toast({
        title: "Manager updated",
        description: `${fullName(editing)} now reports to ${
          newManager === ROOT
            ? data?.organisation_name || "the organisation"
            : fullName(byId.get(Number(newManager)))
        }.`,
      });
      if (newManager !== ROOT) {
        setExpanded((prev) => new Set([...prev, Number(newManager)]));
      }
      setEditing(null);
      await load();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: apiErrorMessage(error, "Failed to change manager"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const topLevel = children.get(ROOT) || [];

  return (
    <>
      <Sidebar />
      <div className="lg:ml-[var(--sidebar-w)] transition-[margin] duration-300 p-4 sm:p-6 lg:p-10 space-y-6 min-h-screen bg-background">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight page-title">
              Org Chart
            </h1>
            <p className="text-sm text-muted-foreground">
              Who reports to whom across your organisation.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              Expand all
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(new Set())}
            >
              <ChevronsDownUp className="mr-2 h-4 w-4" />
              Collapse all
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["Employees", stats.total],
            ["Report to admin", stats.topLevel],
            ["Managers", stats.managers],
            ["Levels", stats.levels],
          ].map(([label, value]) => (
            <Card key={label} className="quantanex-card p-4 border-foreground/5">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {value}
              </div>
            </Card>
          ))}
        </div>

        <Card className="quantanex-card p-4 sm:p-6 border-foreground/5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, designation or department"
                className="pl-9"
                aria-label="Search the org chart"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="sm:w-56" aria-label="Highlight department">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.department_id} value={String(d.department_id)}>
                    {departmentLabel(d, locations)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {query && (
            <p className="text-xs text-muted-foreground mb-3" aria-live="polite">
              {matches.size
                ? `${matches.size} match${matches.size === 1 ? "" : "es"} highlighted`
                : "No employees match your search"}
            </p>
          )}

          {isLoading ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-foreground/5 animate-pulse" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Network className="mx-auto h-8 w-8 mb-3 opacity-50" />
              No employees yet. Add employees and choose who they report to.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[320px]">
                {/* Root: the organisation admin */}
                <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">
                      {data?.organisation_name || "Organisation"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Organisation admin · {topLevel.length} direct report
                      {topLevel.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <ul className="relative ml-[1.1rem] border-l border-foreground/15">
                  {topLevel.map((employee) => (
                    <TreeNode
                      key={employee.employee_id}
                      employee={employee}
                      tree={children}
                      expanded={expanded}
                      onToggle={toggle}
                      onChangeManager={openChangeManager}
                      matches={matches}
                      query={query.trim()}
                      departmentFilter={departmentFilter}
                    />
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change manager</DialogTitle>
            <DialogDescription>
              {editing
                ? `Choose who ${fullName(editing)} reports to. Their own team moves with them.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <Select value={newManager} onValueChange={setNewManager}>
            <SelectTrigger aria-label="Reports to">
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROOT}>
                {data?.organisation_name || "Organisation"} (admin, top level)
              </SelectItem>
              {employees
                .filter((e) => !blocked.has(e.employee_id))
                .sort((a, b) => fullName(a).localeCompare(fullName(b)))
                .map((e) => (
                  <SelectItem key={e.employee_id} value={String(e.employee_id)}>
                    {fullName(e)}
                    {e.designation_name ? ` · ${e.designation_name}` : ""}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {editing && blocked.size > 1 && (
            <p className="text-xs text-muted-foreground">
              {blocked.size - 1} people in {editing.first_name}&apos;s team are
              hidden: they can&apos;t become their manager.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveManager} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
