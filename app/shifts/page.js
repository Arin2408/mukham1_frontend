"use client";

import { useState, useEffect, useCallback } from "react";
import { FastAPI } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Clock, Users, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { jwtDecode } from "jwt-decode";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


// Shift Timeline Logic is now inlined for maximum reliability
const getErrorMessage = (error, fallback = "Something went wrong") => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.msg || "Validation error";
      })
      .join(", ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || fallback;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return fallback;
};

// "HH:MM" -> minutes since midnight (null when empty/invalid)
const toMinutes = (value) => {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

// An end time before the start time means the shift ends the next day.
const isOvernightShift = (start, end) => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return s !== null && e !== null && e < s;
};

const shiftDurationMinutes = (start, end) => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null || s === e) return 0;
  return e > s ? e - s : e + 24 * 60 - s;
};

const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const normalizeName = (name) => name.trim().replace(/\s+/g, " ");

export default function ShiftsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [formData, setFormData] = useState({
    shift_name: "",
    shift_start_time: "",
    shift_end_time: "",
    department: { id: "", name: "" },
  });
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to verify token and handle authentication issues
  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No token found. Please login again.",
      });
      router.push("/login");
      return false;
    }

    try {
      const decodedToken = jwtDecode(token);
      if (Date.now() >= decodedToken.exp * 1000) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Session expired. Please login again.",
        });
        localStorage.removeItem("access_token");
        localStorage.removeItem("org_id");
        router.push("/login");
        return false;
      }

      const { data } = await FastAPI.get("auth/verify");
      // Shift management is organization-only.
      if (data?.role === "employee") {
        router.replace("/member");
        return false;
      }
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getErrorMessage(error, "Could not verify your session"),
      });
      // Only an invalid/expired token ends the session; a network or
      // server error should not log the user out.
      if (error?.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("org_id");
        router.push("/login");
      }
      return false;
    }
  }, [router, toast]);

  const fetchDepartments = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const response = await FastAPI.get("departments");
      const data = response.data;
      setDepartments(data);

      if (data.length > 0) {
        setFormData(prev => ({
          ...prev,
          department: {
            id: data[0].department_id.toString(),
            name: data[0].details
          },
        }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getErrorMessage(error, "Failed to fetch departments"),
      });
    }
  }, [toast, verifyToken]);

  const fetchShifts = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const response = await FastAPI.get("shifts");
      setShifts(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getErrorMessage(error, "Failed to fetch shifts"),
      });
    }
  }, [toast, verifyToken]);

  useEffect(() => {
    fetchDepartments();
    fetchShifts();
  }, [fetchDepartments, fetchShifts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value) => {
    const selectedDepartment = departments.find(
      dept => dept.department_id.toString() === value
    );
    if (selectedDepartment) {
      setFormData(prev => ({
        ...prev,
        department: {
          id: selectedDepartment.department_id.toString(),
          name: selectedDepartment.details,
        },
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      shift_name: "",
      shift_start_time: "",
      shift_end_time: "",
      department: {
        id: departments.length > 0 ? departments[0].department_id.toString() : "",
        name: departments.length > 0 ? departments[0].details : ""
      },
    });
    setCurrentShift(null);
  };

  const handleOpenDialog = (shift = null) => {
    if (shift) {
      setFormData({
        shift_name: shift.shift_name,
        shift_start_time: shift.shift_start_time,
        shift_end_time: shift.shift_end_time,
        department: {
          id: shift.department_id.toString(),
          name:
            departments.find(
              d => d.department_id === shift.department_id
            )?.details || ""
        },
      });
      setCurrentShift(shift);
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  // Same rules the backend enforces, shown before submitting.
  const getFormError = () => {
    const name = normalizeName(formData.shift_name);
    const { shift_start_time: start, shift_end_time: end } = formData;
    const departmentId = Number(formData.department.id);

    if (!name) return "Shift name is required.";
    if (!departmentId) return "Select a department.";
    if (!start || !end) return null;
    if (start === end) return "Start time and end time cannot be the same.";

    const sameDepartment = shifts.filter(
      (s) =>
        s.department_id === departmentId &&
        s.shift_id !== currentShift?.shift_id
    );

    const sameName = sameDepartment.find(
      (s) => normalizeName(s.shift_name).toLowerCase() === name.toLowerCase()
    );
    if (sameName) {
      return `A shift named "${sameName.shift_name}" already exists in this department.`;
    }

    const sameTime = sameDepartment.find(
      (s) => s.shift_start_time === start && s.shift_end_time === end
    );
    if (sameTime) {
      return `"${sameTime.shift_name}" already uses ${start}-${end} in this department.`;
    }

    return null;
  };

  const formError = getFormError();
  const formOvernight = isOvernightShift(
    formData.shift_start_time,
    formData.shift_end_time
  );
  const formDuration = shiftDurationMinutes(
    formData.shift_start_time,
    formData.shift_end_time
  );

  const handleShiftSubmit = async (e) => {
    e.preventDefault();
    if (formError) {
      toast({ variant: "destructive", title: "Error", description: formError });
      return;
    }
    if (!(await verifyToken())) return;

    setIsLoading(true);
    try {
      const shiftData = {
        shift_name: normalizeName(formData.shift_name),
        shift_start_time: formData.shift_start_time,
        shift_end_time: formData.shift_end_time,
        department: parseInt(formData.department.id),
      };

      if (currentShift) {
        // Update existing shift
        await FastAPI.put(
          `shifts/update/${currentShift.shift_id}`,
          shiftData
        );

        toast({
          title: "Success",
          description: "Shift updated successfully.",
        });
      } else {
        // Create new shift
        await FastAPI.post(
          "add-shift",
          shiftData
        );

        toast({
          title: "Success",
          description: "Shift created successfully.",
        });
      }

      setIsOpen(false);
      resetForm();
      fetchShifts();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getErrorMessage(
          error,
          `Failed to ${currentShift ? "update" : "create"} shift`
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (shiftId) => {
    if (!(await verifyToken())) return;

    try {
      const { data } = await FastAPI.delete(
        `shifts/delete/${shiftId}`
      );
      const unassigned = data?.unassigned_employees || 0;

      toast({
        title: "Shift Deleted",
        description: unassigned
          ? `Shift deleted. ${unassigned} employee${unassigned === 1 ? " is" : "s are"} now without a shift.`
          : "Shift deleted successfully.",
      });

      fetchShifts();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getErrorMessage(error, "Failed to delete shift"),
      });
    }
  };

  return (
    <>
      <Sidebar />
      <div className="lg:ml-[var(--sidebar-w)] transition-[margin] duration-300 p-6 lg:p-10 space-y-8 min-h-screen bg-background">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight page-title">Shift Management</h1>
          <div className="ml-auto">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {currentShift ? "Edit Shift" : "Create New Shift"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleShiftSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shift_name">Shift Name</Label>
                    <Input
                      id="shift_name"
                      name="shift_name"
                      value={formData.shift_name}
                      onChange={handleInputChange}
                      placeholder="Enter shift name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shift_start_time">Start Time</Label>
                      <Input
                        id="shift_start_time"
                        name="shift_start_time"
                        type="time"
                        value={formData.shift_start_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shift_end_time">End Time</Label>
                      <Input
                        id="shift_end_time"
                        name="shift_end_time"
                        type="time"
                        value={formData.shift_end_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  {formDuration > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formOvernight
                        ? `Overnight shift: ends at ${formData.shift_end_time} the next day (${formatDuration(formDuration)}).`
                        : `Shift length: ${formatDuration(formDuration)}.`}
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department.id.toString()}
                      onValueChange={handleDepartmentChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department">
                          {formData.department.name || "Select department"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem
                            key={department.department_id}
                            value={department.department_id.toString()}
                          >
                            {department.details}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {departments.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Create a department first; every shift belongs to one.
                      </p>
                    )}
                  </div>
                  {formError && normalizeName(formData.shift_name) && (
                    <p role="alert" className="text-sm text-destructive">
                      {formError}
                    </p>
                  )}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isLoading || Boolean(formError)}>
                      {isLoading ? "Processing..." : currentShift ? "Update Shift" : "Create Shift"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* PREMIUM SHIFT ANALYTICS */}
        {shifts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Peak Hours Heatmap */}
            <Card className="quantanex-card p-6 border-foreground/5 bg-card lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-foreground/60">Peak Hours</h3>
              </div>
              <div className="space-y-1.5">
                {(() => {
                  const counts = new Array(24).fill(0);
                  shifts.forEach(s => {
                    let start = parseInt(s.shift_start_time.split(':')[0]);
                    let end = parseInt(s.shift_end_time.split(':')[0]);
                    if (end <= start) end += 24;
                    for (let h = start; h < end; h++) counts[h % 24]++;
                  });
                  const max = Math.max(...counts, 1);
                  return counts.filter((_, i) => i % 2 === 0).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <span className="text-xs text-foreground/30 w-8">{(i * 2).toString().padStart(2, '0')}:00</span>
                      <div className="flex-1 h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/50 transition-all duration-1000" style={{ width: `${(c / max) * 100}%` }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </Card>

            {/* Timeline Visualizer */}
            <Card className="quantanex-card p-6 border-foreground/5 bg-card lg:col-span-3">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-foreground/60">Visual Timeline</h3>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500/30" /><span className="text-[8px] text-foreground/40 font-bold">Day</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500/30" /><span className="text-[8px] text-foreground/40 font-bold">Night</span></div>
                </div>
              </div>

              <div className="relative h-[220px]">
                {/* Time Grid */}
                <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                  {[0, 6, 12, 18, 24].map(h => (
                    <div key={h} className="h-full border-r border-foreground/40 relative">
                      <span className="absolute -top-6 -right-3 text-xs text-foreground font-medium">{h}:00</span>
                    </div>
                  ))}
                </div>

                {/* Bars */}
                <div className="space-y-3 py-2 relative z-10 h-full overflow-y-auto custom-scrollbar">
                  {shifts.map((shift, i) => {
                    const getP = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return ((h + (m || 0) / 60) / 24) * 100; };
                    const start = getP(shift.shift_start_time);
                    const end = getP(shift.shift_end_time);
                    const isOver = end <= start;
                    const color = isOver ? 'bg-purple-500/20 border-purple-400/30' : 'bg-blue-500/20 border-blue-400/30';
                    const dept = departments.find(
                      d => d.department_id === shift.department_id
                    )?.details || "Staff";

                    return (
                      <div key={shift.shift_id} className="relative h-10 group">
                        {isOver ? (
                          <>
                            <div className={`absolute h-full rounded-l border-y border-l ${color} flex flex-col justify-center px-3`} style={{ left: `${start}%`, right: '0%' }}>
                              <span className="text-xs font-bold text-foreground truncate">{shift.shift_name}</span>
                              <span className="text-[8px] text-foreground/30 tracking-tight truncate">{dept} · until {shift.shift_end_time}</span>
                            </div>
                            <div className={`absolute h-full rounded-r border-y border-r ${color} flex items-center px-3`} style={{ left: '0%', width: `${end}%` }}>
                              <span className="text-xs font-bold text-foreground truncate opacity-0 group-hover:opacity-100">{shift.shift_name}</span>
                            </div>
                          </>
                        ) : (
                          <div className={`absolute h-full rounded border ${color} flex flex-col justify-center px-3`} style={{ left: `${start}%`, width: `${end - start}%` }}>
                            <span className="text-xs font-bold text-foreground truncate">{shift.shift_name}</span>
                            <span className="text-[8px] text-foreground/30 tracking-tight">{dept}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}

        <Card className="quantanex-card border-foreground/5 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift Name</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No shifts found
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((shift) => (
                  <TableRow key={shift.shift_id}>
                    <TableCell>{shift.shift_name}</TableCell>
                    <TableCell>{shift.shift_start_time}</TableCell>
                    <TableCell>
                      {shift.shift_end_time}
                      {isOvernightShift(shift.shift_start_time, shift.shift_end_time) && (
                        <span className="ml-2 rounded-full bg-purple-500/15 px-2 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-300">
                          +1 day
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDuration(shiftDurationMinutes(shift.shift_start_time, shift.shift_end_time))}
                    </TableCell>
                    <TableCell>
                      {departments.find(d => d.department_id === shift.department_id)?.details || "N/A"}
                    </TableCell>
                    <TableCell>{shift.employee_count ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenDialog(shift)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Shift</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{shift.shift_name}&quot;? This action cannot be undone.
                                {shift.employee_count > 0 &&
                                  ` ${shift.employee_count} employee${shift.employee_count === 1 ? " is" : "s are"} assigned to it and will be left without a shift.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(shift.shift_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}