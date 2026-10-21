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

import { format, subDays } from "date-fns"

import { Sidebar } from "@/components/Sidebar"

import { FastAPI, useAuth } from "@/context/AuthContext"

import { useToast } from "@/hooks/use-toast"

import { jwtDecode } from "jwt-decode"

// How many days of attendance logs the history table loads

const HISTORY_DAYS = 30

// "30 min" or "1 h 15 min"
function formatMinutes(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

// Each time out of the office area: "Out 02:10 PM – 02:40 PM", or "Out since …" while still out.
function awayPeriods(moves = []) {
  const periods = []
  for (const move of moves) {
    if (move.event === "exit") periods.push({ from: move.at, to: null })
    else if (periods.length && periods[periods.length - 1].to === null) periods[periods.length - 1].to = move.at
  }
  const time = (iso) => format(new Date(iso), "hh:mm a")
  return periods.map((p) => (p.to ? `Out ${time(p.from)} – ${time(p.to)}` : `Out since ${time(p.from)}`))
}

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

    const token = localStorage.getItem("access_token")

    if (!token) {

      toast({

        variant: "destructive",

        title: "Error",

        description: "No token found. Please login again.",

      })

      router.push("/")

      return false

    }

    try {

      const decodedToken = jwtDecode(token)

      if (decodedToken?.exp && Date.now() >= decodedToken.exp * 1000) {

        toast({

          variant: "destructive",

          title: "Error",

          description: "Session expired. Please login again.",

        })

        localStorage.removeItem("access_token")

        localStorage.removeItem("org_id")

        router.push("/")

        return false

      }

      await FastAPI.get("auth/verify")

      return true

    } catch (error) {
      console.error(
        "Token verification error:",
        error?.response?.data || error?.message || error
      )

      if (error?.response?.status === 401) {
        toast({
          variant: "destructive",
          title: "Session expired",
          description: "Please log in again.",
        })
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("org_id")
        router.push("/")
        return false
      }

      toast({
        variant: "destructive",
        title: "Verification unavailable",
        description:
          error?.response?.data?.detail ||
          "Could not verify your session with FastAPI. Your session has not been cleared.",
      })
      return false
    }
  }, [router, toast])

  const fetchData = useCallback(async () => {
    setIsLoading(true)

    try {

      if (!(await verifyToken())) {

        return

      }

      const [employeesResponse, attendanceResponse] = await Promise.all([

        FastAPI.get("attendance/list"),

        FastAPI.get(

          `attendance/history?from=${format(

            subDays(new Date(), HISTORY_DAYS),

            "yyyy-MM-dd"

          )}`

        ),

      ])

      // FastAPI returns Axios responses.

      // The actual response data is inside response.data.

      const employeePayload = employeesResponse?.data
      const attendancePayload = attendanceResponse?.data

      const employeeData = Array.isArray(employeePayload)
        ? employeePayload
        : Array.isArray(employeePayload?.results)
          ? employeePayload.results
          : Array.isArray(employeePayload?.employees)
            ? employeePayload.employees
            : []

      const attendanceData = Array.isArray(attendancePayload)
        ? attendancePayload
        : Array.isArray(attendancePayload?.results)
          ? attendancePayload.results
          : Array.isArray(attendancePayload?.attendance)
            ? attendancePayload.attendance
            : []

      setEmployees(employeeData)
      setAttendanceLogs(attendanceData)

    } catch (error) {

      console.error(

        "Fetch Error:",

        error?.response?.data || error?.message || error

      )

      toast({

        variant: "destructive",

        title: "Error",

        description:

          error?.response?.data?.detail ||

          error?.response?.data?.message ||

          "Failed to load attendance data",

      })

    } finally {

      setIsLoading(false)

    }

  }, [verifyToken, toast])

  useEffect(() => {

    fetchData()

  }, [fetchData])

  const handleCheckIn = async () => {

    if (!selectedEmployee) {

      toast({

        variant: "destructive",

        title: "Error",

        description: "Please select an employee",

      })

      return

    }

    try {

      setIsLoading(true)

      await FastAPI.post("attendance/manual", {

        employee_id: Number(selectedEmployee),

        action: "checkin",

      })

      toast({

        title: "Success",

        description: "Check-in marked successfully",

      })

      await fetchData()

    } catch (error) {

      console.error(

        "Check-in error:",

        error?.response?.data || error?.message || error

      )

      const errorMsg =

        error?.response?.data?.detail ||

        error?.response?.data?.message ||

        "Failed to mark check-in"

      toast({

        variant: "destructive",

        title: "Error",

        description:

          typeof errorMsg === "object"

            ? errorMsg.message || "Failed to mark check-in"

            : errorMsg,

      })

    } finally {

      setIsLoading(false)

    }

  }

  const handleCheckOut = async () => {

    if (!selectedEmployee) {

      toast({

        variant: "destructive",

        title: "Error",

        description: "Please select an employee",

      })

      return

    }

    try {

      setIsLoading(true)

      await FastAPI.post("attendance/manual", {

        employee_id: Number(selectedEmployee),

        action: "checkout",

      })

      toast({

        title: "Success",

        description: "Check-out marked successfully",

      })

      await fetchData()

    } catch (error) {

      console.error(

        "Check-out error:",

        error?.response?.data || error?.message || error

      )

      const errorMsg =

        error?.response?.data?.detail ||

        error?.response?.data?.message ||

        "Failed to mark check-out"

      toast({

        variant: "destructive",

        title: "Error",

        description:

          typeof errorMsg === "object"

            ? errorMsg.message || "Failed to mark check-out"

            : errorMsg,

      })

    } finally {

      setIsLoading(false)

    }

  }

  // Group logs by employee

  const groupedLogs = useMemo(() => {

    return (attendanceLogs || []).reduce((acc, log) => {

      // Handle both log.employee_id and log.employee (nested object)

      const empIdValue =

        log.employee_id ||

        (log.employee && log.employee.id)

      if (!empIdValue) {

        return acc

      }

      const empId = `EMP${empIdValue}`

      if (!acc[empId]) {

        acc[empId] = {

          employeeId: empId,

          name:

            log.employee_name ||

            (log.employee &&

              `${log.employee.first_name} ${log.employee.last_name}`) ||

            "Unknown",

          totalDays: 0,

          totalHours: 0,

          logs: [],

        }

      }

      acc[empId].logs.push({

        id: log.id,

        date: log.check_in

          ? format(new Date(log.check_in), "yyyy-MM-dd")

          : "N/A",

        checkIn: log.check_in

          ? format(new Date(log.check_in), "hh:mm a")

          : "N/A",

        checkOut: log.check_out

          ? format(new Date(log.check_out), "hh:mm a")

          : "-",

        status: log.status,

        workHours: log.hours_worked || "0",

        // Geofence / audit flags

        isManual: log.source === "manual",

        checkOutLocation: log.check_out_location_status,

        checkOutDistance: log.check_out_distance,

        // Leaving the office area while checked in (phone geofence)

        trackingOff: log.presence_tracking === "off",

        minutesOutside: log.time_outside_minutes || 0,

        awayPeriods: awayPeriods(log.presence_events),

      })

      acc[empId].totalDays += 1

      acc[empId].totalHours += parseFloat(log.hours_worked) || 0

      return acc

    }, {})

  }, [attendanceLogs])

  const filteredEmployees = useMemo(() => {

    const query = searchQuery.trim().toLowerCase()

    return Object.values(groupedLogs).filter(

      (employee) =>

        employee.name.toLowerCase().includes(query) ||

        employee.employeeId.toLowerCase().includes(query)

    )

  }, [groupedLogs, searchQuery])

  const handleExpandEmployee = (employeeId) => {

    setExpandedEmployee(

      expandedEmployee === employeeId ? null : employeeId

    )

  }

  return (

    <>

      <Sidebar />

      <div className="lg:ml-[var(--sidebar-w)] transition-[margin] duration-300 p-6 lg:p-10 space-y-8 min-h-screen bg-background text-foreground">

        <div className="flex items-center justify-between">

          <h1 className="text-2xl font-bold tracking-tight page-title">

            Attendance Management

          </h1>

          {isLoading && (

            <Loader2 className="h-5 w-5 animate-spin text-primary" />

          )}

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <Card className="quantanex-card p-6 col-span-1">

            <h3 className="text-lg font-semibold mb-2">

              Manual Mark

            </h3>

            <div className="space-y-4">

              <div className="rounded-xl border border-border overflow-hidden">

                <Calendar

                  mode="single"

                  selected={date}

                  onSelect={setDate}

                  className="rounded-md"

                />

              </div>

              <div className="space-y-2">

                <label className="text-xs font-bold text-muted-foreground">

                  Select Employee

                </label>

                <Select

                  value={selectedEmployee}

                  onValueChange={setSelectedEmployee}

                >

                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">

                    <SelectValue placeholder="Choose employee..." />

                  </SelectTrigger>

                  <SelectContent>

                    {employees.map((employee) => (

                      <SelectItem

                        key={employee.employee_id}

                        value={employee.employee_id.toString()}

                      >

                        {employee.first_name} {employee.last_name}{" "}

                        (EMP{employee.employee_id})

                      </SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">

                <Button

                  className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"

                  onClick={handleCheckIn}

                  disabled={isLoading}

                >

                  <Clock className="mr-2 h-4 w-4" />

                  Check In

                </Button>

                <Button

                  className="bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/30 border border-rose-500/30"

                  onClick={handleCheckOut}

                  disabled={isLoading}

                >

                  <Clock className="mr-2 h-4 w-4" />

                  Check Out

                </Button>

              </div>

            </div>

          </Card>

          <Card className="quantanex-card p-6 col-span-1 md:col-span-2">

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">

              <h3 className="text-lg font-semibold">

                Live History{" "}

                <span className="text-xs font-normal text-muted-foreground">

                  (last {HISTORY_DAYS} days)

                </span>

              </h3>

              <div className="relative w-full sm:w-64">

                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />

                <Input

                  placeholder="Search name or ID..."

                  className="pl-10 bg-foreground/5 border-foreground/10 text-foreground"

                  value={searchQuery}

                  onChange={(e) => setSearchQuery(e.target.value)}

                />

              </div>

            </div>

            <div className="overflow-x-auto rounded-xl border border-border">

              <Table>

                <TableHeader>

                  <TableRow className="border-foreground/5 hover:bg-transparent">

                    <TableHead className="w-[50px]" />

                    <TableHead className="text-muted-foreground font-bold text-xs">

                      Employee ID

                    </TableHead>

                    <TableHead className="text-muted-foreground font-bold text-xs">

                      Name

                    </TableHead>

                    <TableHead className="text-muted-foreground font-bold text-xs">

                      Logs

                    </TableHead>

                    <TableHead className="text-muted-foreground font-bold text-xs">

                      Hours

                    </TableHead>

                  </TableRow>

                </TableHeader>

                <TableBody>

                  {filteredEmployees.length === 0 ? (

                    <TableRow>

                      <TableCell

                        colSpan={5}

                        className="text-center py-10 text-muted-foreground"

                      >

                        {isLoading

                          ? "Fetching data..."

                          : "No attendance logs found."}

                      </TableCell>

                    </TableRow>

                  ) : (

                    filteredEmployees.map((employee) => (

                      <React.Fragment

                        key={`group-${employee.employeeId}`}

                      >

                        <TableRow

                          className={`cursor-pointer transition-colors border-foreground/5 ${expandedEmployee === employee.employeeId

                            ? "bg-primary/5"

                            : "hover:bg-foreground/[0.03]"

                            }`}

                          onClick={() =>

                            handleExpandEmployee(employee.employeeId)

                          }

                        >

                          <TableCell>

                            {expandedEmployee === employee.employeeId ? (

                              <ChevronDown className="h-4 w-4 text-primary" />

                            ) : (

                              <ChevronRight className="h-4 w-4 text-foreground/20" />

                            )}

                          </TableCell>

                          <TableCell className="font-mono text-primary text-xs">

                            {employee.employeeId}

                          </TableCell>

                          <TableCell className="font-bold text-foreground/90">

                            {employee.name}

                          </TableCell>

                          <TableCell>

                            <span className="px-2 py-0.5 rounded-full bg-foreground/5 border border-foreground/10 text-xs font-bold">

                              {employee.totalDays} entries

                            </span>

                          </TableCell>

                          <TableCell className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">

                            {employee.totalHours.toFixed(1)}h

                          </TableCell>

                        </TableRow>

                        {expandedEmployee === employee.employeeId && (

                          <TableRow

                            key={`details-${employee.employeeId}`}

                          >

                            <TableCell

                              colSpan={5}

                              className="p-0 bg-muted/40"

                            >

                              <div className="my-3 ml-10 mr-4 rounded-lg border border-border border-l-2 border-l-primary bg-card overflow-hidden">

                                <Table>

                                  <TableHeader>

                                    <TableRow className="border-foreground/5 hover:bg-transparent">

                                      <TableHead className="text-[9px] uppercase tracking-tighter text-muted-foreground">

                                        Date

                                      </TableHead>

                                      <TableHead className="text-[9px] uppercase tracking-tighter text-muted-foreground">

                                        In

                                      </TableHead>

                                      <TableHead className="text-[9px] uppercase tracking-tighter text-muted-foreground">

                                        Out

                                      </TableHead>

                                      <TableHead className="text-[9px] uppercase tracking-tighter text-muted-foreground">

                                        Work

                                      </TableHead>

                                      <TableHead className="text-[9px] uppercase tracking-tighter text-muted-foreground">

                                        Status

                                      </TableHead>

                                      <TableHead className="text-[9px] uppercase tracking-tighter text-muted-foreground" />

                                    </TableRow>

                                  </TableHeader>

                                  <TableBody>

                                    {employee.logs.map((log) => (

                                      <TableRow

                                        key={`log-${log.id}`}

                                        className="border-foreground/5 hover:bg-foreground/5"

                                      >

                                        <TableCell className="text-xs text-foreground/60">

                                          {log.date}

                                        </TableCell>

                                        <TableCell className="text-xs font-mono text-emerald-600 dark:text-emerald-400">

                                          {log.checkIn}

                                        </TableCell>

                                        <TableCell className="text-xs font-mono text-rose-600 dark:text-rose-400">

                                          {log.checkOut}

                                        </TableCell>

                                        <TableCell className="text-xs font-bold">

                                          {log.workHours}h

                                        </TableCell>

                                        <TableCell>

                                          <span

                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${log.status === "Present"

                                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"

                                              : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"

                                              }`}

                                          >

                                            {log.status}

                                          </span>

                                        </TableCell>

                                        <TableCell>

                                          <div className="flex flex-wrap gap-1">

                                            {log.isManual && (

                                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">

                                                Manual

                                              </span>

                                            )}

                                            {log.checkOutLocation ===

                                              "outside" && (

                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">

                                                  Out away

                                                  {log.checkOutDistance != null

                                                    ? ` (${Math.round(

                                                      log.checkOutDistance

                                                    )}m)`

                                                    : ""}

                                                </span>

                                              )}

                                            {log.minutesOutside > 0 && (

                                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">

                                                Outside {formatMinutes(log.minutesOutside)}

                                              </span>

                                            )}

                                            {log.trackingOff && (

                                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">

                                                Tracking off

                                              </span>

                                            )}

                                            {log.checkOutLocation ===

                                              "unknown" && (

                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-white/10 text-white/50 border border-white/10">

                                                  Out: no GPS

                                                </span>

                                              )}

                                          </div>

                                          {log.awayPeriods.map((period) => (

                                            <p key={period} className="mt-1 text-[10px] text-muted-foreground">

                                              {period}

                                            </p>

                                          ))}

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
