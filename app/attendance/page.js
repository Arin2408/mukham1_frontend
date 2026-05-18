"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, Search, ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { Sidebar } from "@/components/Sidebar";
import { AxiosGet, AxiosPost, useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { jwtDecode } from "jwt-decode"

export default function AttendancePage() {
  const router = useRouter()
  const { orgId } = useAuth()
  const { toast } = useToast()
  
  const [date, setDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [expandedEmployee, setExpandedEmployee] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const [employees, setEmployees] = useState([])
  const [attendanceLogs, setAttendanceLogs] = useState([])

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast({ variant: "destructive", title: "Error", description: "No token found. Please login again." });
      router.push("/login");
      return false;
    }
    try {
      const decodedToken = jwtDecode(token);
      if (Date.now() >= decodedToken.exp * 1000) {
        toast({ variant: "destructive", title: "Error", description: "Session expired. Please login again." });
        localStorage.removeItem("access_token");
        router.push("/login");
        return false;
      }
      await AxiosPost("token/verify/", { token });
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Invalid token" });
      localStorage.removeItem("access_token");
      router.push("/login");
      return false;
    }
  }, [router, toast]);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      if (!(await verifyToken())) return;

      const [employeesRes, attendanceRes] = await Promise.all([
        AxiosGet(`list/?org_id=${orgId}`),
        AxiosGet("attendance-history/"),
      ]);

      setEmployees(Array.isArray(employeesRes) ? employeesRes : []);
      setAttendanceLogs(Array.isArray(attendanceRes) ? attendanceRes : []);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load attendance data" });
    } finally {
      setIsLoading(false);
    }
  }, [orgId, verifyToken, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async () => {
    if (!selectedEmployee) {
      toast({ variant: "destructive", title: "Error", description: "Please select an employee" });
      return;
    }

    try {
      setIsLoading(true);
      await AxiosPost("mark-attendance/", {
        employee_id: selectedEmployee,
        location_status: "inside", // Default for manual admin marking
        face_status: "verified"
      });
      toast({ title: "Success", description: "Check-in marked successfully" });
      fetchData();
    } catch (error) {
      console.error("Check-in error:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.error || "Failed to mark check-in";
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployee) {
      toast({ variant: "destructive", title: "Error", description: "Please select an employee" });
      return;
    }

    try {
      setIsLoading(true);
      await AxiosPost("mark-attendance/", {
        employee_id: selectedEmployee,
      });
      toast({ title: "Success", description: "Check-out marked successfully" });
      fetchData();
    } catch (error) {
      console.error("Check-out error:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.error || "Failed to mark check-out";
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Group logs by employee
  const groupedLogs = useMemo(() => {
    return (attendanceLogs || []).reduce((acc, log) => {
      // Handle both log.employee_id and log.employee (nested object)
      const empIdValue = log.employee_id || (log.employee && log.employee.id);
      if (!empIdValue) return acc;

      const empId = `EMP${empIdValue}`;
      if (!acc[empId]) {
        acc[empId] = {
          employeeId: empId,
          name: log.employee_name || (log.employee && `${log.employee.first_name} ${log.employee.last_name}`) || "Unknown",
          totalDays: 0,
          totalHours: 0,
          logs: []
        }
      }
      acc[empId].logs.push({
        id: log.id,
        date: log.check_in ? format(new Date(log.check_in), 'yyyy-MM-dd') : 'N/A',
        checkIn: log.check_in ? format(new Date(log.check_in), 'hh:mm a') : 'N/A',
        checkOut: log.check_out ? format(new Date(log.check_out), 'hh:mm a') : '-',
        status: log.status,
        workHours: log.hours_worked || "0"
      })
      acc[empId].totalDays += 1
      acc[empId].totalHours += parseFloat(log.hours_worked) || 0
      return acc
    }, {})
  }, [attendanceLogs])

  const filteredEmployees = useMemo(() => {
    return Object.values(groupedLogs).filter(employee =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [groupedLogs, searchQuery])

  const handleExpandEmployee = (employeeId) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId)
  }

  return (
    <>
      <Sidebar/>
      <div className="ml-64 p-6 lg:p-10 space-y-8 min-h-screen bg-[#02040a] text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 col-span-1 bg-white/5 border-white/10">
            <h3 className="text-lg font-semibold mb-2">Manual Mark</h3>
            <div className="space-y-4">
              <div className="rounded-md border border-white/10 bg-white/5 overflow-hidden">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Employee</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Choose employee..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1117] border-white/10 text-white">
                    {employees.map((employee) => (
                      <SelectItem key={employee.employee_id} value={employee.employee_id.toString()}>
                        {employee.first_name} {employee.last_name} (EMP{employee.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                  onClick={handleCheckIn}
                  disabled={isLoading}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Check In
                </Button>
                <Button 
                  className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30"
                  onClick={handleCheckOut}
                  disabled={isLoading}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Check Out
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 col-span-1 md:col-span-2 bg-white/5 border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-semibold">Live History</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search name or ID..."
                  className="pl-10 bg-white/5 border-white/10 text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Employee ID</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Name</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Logs</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        {isLoading ? "Fetching data..." : "No attendance logs found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <React.Fragment key={`group-${employee.employeeId}`}>
                        <TableRow 
                          className={`cursor-pointer transition-colors border-white/5 ${expandedEmployee === employee.employeeId ? 'bg-white/10' : 'hover:bg-white/[0.02]'}`}
                          onClick={() => handleExpandEmployee(employee.employeeId)}
                        >
                          <TableCell>
                            {expandedEmployee === employee.employeeId ? (
                              <ChevronDown className="h-4 w-4 text-primary" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-white/20" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-primary text-xs">{employee.employeeId}</TableCell>
                          <TableCell className="font-bold text-white/90">{employee.name}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold">
                              {employee.totalDays} entries
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-emerald-400 font-bold">{employee.totalHours.toFixed(1)}h</TableCell>
                        </TableRow>
                        {expandedEmployee === employee.employeeId && (
                          <TableRow key={`details-${employee.employeeId}`}>
                            <TableCell colSpan={5} className="p-0 bg-black/40">
                              <div className="p-4 border-l-2 border-primary ml-10 my-2">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                      <TableHead className="text-[9px] uppercase tracking-tighter text-muted-foreground">Date</TableHead>
                                      <TableHead className="text-[9px] uppercase tracking-tighter text-muted-foreground">In</TableHead>
                                      <TableHead className="text-[9px] uppercase tracking-tighter text-muted-foreground">Out</TableHead>
                                      <TableHead className="text-[9px] uppercase tracking-tighter text-muted-foreground">Work</TableHead>
                                      <TableHead className="text-[9px] uppercase tracking-tighter text-muted-foreground">Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {employee.logs.map((log) => (
                                      <TableRow key={`log-${log.id}`} className="border-white/5 hover:bg-white/5">
                                        <TableCell className="text-xs text-white/60">{log.date}</TableCell>
                                        <TableCell className="text-xs font-mono text-emerald-400">{log.checkIn}</TableCell>
                                        <TableCell className="text-xs font-mono text-rose-400">{log.checkOut}</TableCell>
                                        <TableCell className="text-xs font-bold">{log.workHours}h</TableCell>
                                        <TableCell>
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                            log.status === 'Present' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                          }`}>
                                            {log.status}
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}