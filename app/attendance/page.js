"use client"

import React, { useState } from "react"
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
import { ArrowLeft, Clock, Search, ChevronDown, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { Header } from '@/components/Header';

export default function AttendancePage() {
  const router = useRouter()
  const [date, setDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [expandedEmployee, setExpandedEmployee] = useState(null)
  const [employees] = useState([
    { id: 1, name: "John Doe", employeeId: "EMP001" },
    { id: 2, name: "Jane Smith", employeeId: "EMP002" },
    { id: 3, name: "Mike Johnson", employeeId: "EMP003" },
    { id: 4, name: "Sarah Williams", employeeId: "EMP004" },
  ])
  const [attendanceLogs, setAttendanceLogs] = useState([
    { 
      id: 1, 
      employeeId: "EMP001", 
      name: "John Doe", 
      date: "2024-01-15", 
      checkIn: "09:00 AM", 
      checkOut: "05:30 PM", 
      status: "Present",
      workHours: "8.5"
    },
    { 
      id: 2, 
      employeeId: "EMP001", 
      name: "John Doe", 
      date: "2024-01-14", 
      checkIn: "09:15 AM", 
      checkOut: "05:45 PM", 
      status: "Present",
      workHours: "8.5"
    },
    { 
      id: 3, 
      employeeId: "EMP002", 
      name: "Jane Smith", 
      date: "2024-01-15", 
      checkIn: "08:45 AM", 
      checkOut: "05:15 PM", 
      status: "Present",
      workHours: "8.5"
    },
    {
      id: 4,
      employeeId: "EMP002",
      name: "Jane Smith",
      date: "2024-01-14",
      checkIn: "08:30 AM",
      checkOut: "05:00 PM",
      status: "Present",
      workHours: "8.5"
    }
  ])

  const handleCheckIn = () => {
    if (!selectedEmployee) {
      alert("Please select an employee")
      return
    }

    const employee = employees.find(emp => emp.employeeId === selectedEmployee)
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    })

    const newLog = {
      id: attendanceLogs.length + 1,
      employeeId: employee.employeeId,
      name: employee.name,
      date: format(date, 'yyyy-MM-dd'),
      checkIn: currentTime,
      checkOut: "-",
      status: "Present",
      workHours: "-"
    }

    setAttendanceLogs(prevLogs => [...prevLogs, newLog])
  }

  const handleCheckOut = () => {
    if (!selectedEmployee) {
      alert("Please select an employee")
      return
    }

    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    })

    setAttendanceLogs(prevLogs => prevLogs.map(log => {
      if (log.employeeId === selectedEmployee && log.date === format(date, 'yyyy-MM-dd') && log.checkOut === "-") {
        const checkInTime = new Date(`2024-01-01 ${log.checkIn}`)
        const checkOutTime = new Date(`2024-01-01 ${currentTime}`)
        const diffHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
        
        return {
          ...log,
          checkOut: currentTime,
          workHours: diffHours.toFixed(1)
        }
      }
      return log
    }))
  }

  // Pre-compute grouped logs to avoid computation during render
  const groupedLogs = React.useMemo(() => {
    return attendanceLogs.reduce((acc, log) => {
      if (!acc[log.employeeId]) {
        acc[log.employeeId] = {
          employeeId: log.employeeId,
          name: log.name,
          totalDays: 0,
          totalHours: 0,
          logs: []
        }
      }
      acc[log.employeeId].logs.push(log)
      acc[log.employeeId].totalDays += 1
      acc[log.employeeId].totalHours += parseFloat(log.workHours) || 0
      return acc
    }, {})
  }, [attendanceLogs])

  const filteredEmployees = React.useMemo(() => {
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
    <Header/>
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        {/* <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button> */}
        <h1 className="text-3xl font-bold">Attendance</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1">
          <h3 className="text-lg font-semibold mb-4">Mark Attendance</h3>
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
            <div className="space-y-2">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.employeeId}>
                      {employee.name} ({employee.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleCheckIn}
              >
                <Clock className="mr-2 h-4 w-4" />
                Check In
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleCheckOut}
              >
                <Clock className="mr-2 h-4 w-4" />
                Check Out
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 col-span-1 md:col-span-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold">Attendance History</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Total Days</TableHead>
                  <TableHead>Total Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <React.Fragment key={`group-${employee.employeeId}`}>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleExpandEmployee(employee.employeeId)}
                    >
                      <TableCell>
                        {expandedEmployee === employee.employeeId ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell>{employee.employeeId}</TableCell>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.totalDays}</TableCell>
                      <TableCell>{employee.totalHours.toFixed(1)}</TableCell>
                    </TableRow>
                    {expandedEmployee === employee.employeeId && (
                      <TableRow key={`details-${employee.employeeId}`}>
                        <TableCell colSpan={5} className="p-0">
                          <div className="bg-muted/50 p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Check In</TableHead>
                                  <TableHead>Check Out</TableHead>
                                  <TableHead>Work Hours</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {employee.logs.map((log) => (
                                  <TableRow key={`log-${log.id}`}>
                                    <TableCell>{log.date}</TableCell>
                                    <TableCell>{log.checkIn}</TableCell>
                                    <TableCell>{log.checkOut}</TableCell>
                                    <TableCell>{log.workHours}</TableCell>
                                    <TableCell>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
    </>
  )
}