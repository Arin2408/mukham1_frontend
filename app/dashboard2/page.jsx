"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Clock,
  User,
  Briefcase,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  Timer,
  ChevronDown,
} from "lucide-react";
import { Header } from "@/components/Header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock employee data - would come from API in real app
const employeeData = {
  id: "EMP001",
  name: "John Doe",
  department: "Engineering",
  designation: "Senior Developer",
  availableShifts: [
    {
      id: "shift1",
      name: "Morning Shift",
      startTime: "09:00",
      endTime: "12:00",
    },
    {
      id: "shift2",
      name: "Afternoon Shift",
      startTime: "13:00",
      endTime: "16:00",
    },
    {
      id: "shift3",
      name: "Evening Shift",
      startTime: "17:00",
      endTime: "23:00",
    },
  ],
  attendanceHistory: [
    { date: "Feb 24", shift: "Morning Shift", status: "On Time", hours: 3 },
    { date: "Feb 24", shift: "Afternoon Shift", status: "On Time", hours: 3 },
    {
      date: "Feb 25",
      shift: "Morning Shift",
      status: "Late (15m)",
      hours: 2.75,
    },
    {
      date: "Feb 26",
      shift: "Morning Shift",
      status: "Early (10m)",
      hours: 3.2,
    },
    { date: "Feb 27", shift: "Afternoon Shift", status: "On Time", hours: 3 },
    { date: "Mar 01", shift: "Morning Shift", status: "Late (5m)", hours: 2.9 },
  ],
};

export default function EmployeeDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState(null);
  const [activeShifts, setActiveShifts] = useState({});
  const [completedShifts, setCompletedShifts] = useState([]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Format time as HH:MM
  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Format date as MMM DD (e.g. Mar 02)
  const formatDate = (date) => {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Parse time string to get hours and minutes
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { hours, minutes };
  };

  // Check if a shift can be started now
  const canStartShift = (shift) => {
    if (!shift) return false;

    const now = currentTime;
    const today = formatDate(now);
    const { hours: endHours, minutes: endMinutes } = parseTime(shift.endTime);

    const cutoffTime = new Date(now);
    cutoffTime.setHours(endHours, endMinutes, 0, 0);

    // Check if shift is already active
    if (activeShifts[shift.id]) return false;

    // Check if shift is already completed today
    const isCompleted = completedShifts.some(
      (cs) => cs.shift === shift.name && cs.date === today
    );

    // Check if current time is before cutoff time and shift not already completed
    return now < cutoffTime && !isCompleted;
  };

  // Check if attendance marking is early/late/on-time
  const getAttendanceStatus = (shift) => {
    if (!shift) return null;

    const now = currentTime;
    const { hours: startHours, minutes: startMinutes } = parseTime(
      shift.startTime
    );

    const shiftStart = new Date(now);
    shiftStart.setHours(startHours, startMinutes, 0, 0);

    if (now < shiftStart) {
      const minutesDiff = Math.round((shiftStart - now) / 60000);
      return { type: "Early", minutes: minutesDiff };
    } else if (now > shiftStart) {
      const minutesDiff = Math.round((now - shiftStart) / 60000);
      return { type: "Late", minutes: minutesDiff };
    } else {
      return { type: "On Time", minutes: 0 };
    }
  };

  // Handle marking attendance
  const handleMarkAttendance = () => {
    if (!canStartShift(selectedShift)) return;

    const status = getAttendanceStatus(selectedShift);

    setActiveShifts((prev) => ({
      ...prev,
      [selectedShift.id]: {
        shift: selectedShift,
        startTime: new Date(),
        status,
      },
    }));

    // Clear selected shift after starting
    setSelectedShift(null);
  };

  // Handle ending shift
  const handleEndShift = (shiftId) => {
    const shiftInfo = activeShifts[shiftId];
    if (!shiftInfo) return;

    const endTime = new Date();
    const hours = ((endTime - shiftInfo.startTime) / (1000 * 60 * 60)).toFixed(
      2
    );

    // Format the status string
    let statusStr = "On Time";
    if (shiftInfo.status.type !== "On Time") {
      statusStr = `${shiftInfo.status.type} (${shiftInfo.status.minutes}m)`;
    }

    const completedShift = {
      id: shiftId,
      shift: shiftInfo.shift.name,
      date: formatDate(endTime),
      status: statusStr,
      hours: parseFloat(hours),
    };

    setCompletedShifts((prev) => [completedShift, ...prev]);

    // Remove from active shifts
    const newActiveShifts = { ...activeShifts };
    delete newActiveShifts[shiftId];
    setActiveShifts(newActiveShifts);
  };

  // Get today's date
  const today = formatDate(currentTime);

  // Filter available shifts (not active, not completed today)
  const availableShiftsForSelection = employeeData.availableShifts.filter(
    (shift) => {
      // Check if shift is already active
      if (activeShifts[shift.id]) return false;

      // Check if shift is already completed today
      const isCompletedToday =
        completedShifts.some(
          (cs) => cs.shift === shift.name && cs.date === today
        ) ||
        employeeData.attendanceHistory.some(
          (record) => record.shift === shift.name && record.date === today
        );

      return !isCompletedToday;
    }
  );

  return (
    <>
      <Header />
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <div className="text-right">
            <p className="text-lg font-medium">{employeeData.name}</p>
            <p className="text-sm text-muted-foreground">
              ID: {employeeData.id}
            </p>
          </div>
        </div>

        {/* Current Time and Shift Selection */}
        <Card className="p-6 bg-primary/5">
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Current Time</h2>
                <div className="text-3xl font-bold flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  {formatTime(currentTime)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentTime.toLocaleDateString([], {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Select Shift</h2>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedShift?.id}
                    onValueChange={(value) => {
                      const shift = employeeData.availableShifts.find(
                        (s) => s.id === value
                      );
                      setSelectedShift(shift);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableShiftsForSelection.length > 0 ? (
                        availableShiftsForSelection.map((shift) => (
                          <SelectItem key={shift.id} value={shift.id}>
                            {shift.name} ({shift.startTime} - {shift.endTime})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No shifts available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleMarkAttendance}
                    disabled={!canStartShift(selectedShift)}
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Start Shift
                  </Button>
                </div>

                {selectedShift && !canStartShift(selectedShift) && (
                  <p className="text-red-500 flex items-center gap-1 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    {completedShifts.some(
                      (cs) => cs.id === selectedShift.id && cs.date === today
                    )
                      ? "This shift has already been completed today"
                      : `Shift can only be started before ${selectedShift.endTime}`}
                  </p>
                )}

                {availableShiftsForSelection.length === 0 && (
                  <p className="text-amber-600 flex items-center gap-1 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    No shifts available for today
                  </p>
                )}
              </div>
            </div>

            {/* Active Shifts */}
            {Object.keys(activeShifts).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Active Shifts</h2>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(activeShifts).map(([shiftId, shiftInfo]) => (
                    <div
                      key={shiftId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900"
                    >
                      <div>
                        <p className="font-medium">{shiftInfo.shift.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {shiftInfo.shift.startTime} -{" "}
                          {shiftInfo.shift.endTime}
                        </p>
                        <p className="text-sm mt-1">
                          Started: {formatTime(shiftInfo.startTime)} -
                          <span
                            className={
                              shiftInfo.status.type === "Late"
                                ? "text-amber-600 ml-1"
                                : shiftInfo.status.type === "Early"
                                ? "text-blue-600 ml-1"
                                : "text-green-600 ml-1"
                            }
                          >
                            {shiftInfo.status.type === "On Time"
                              ? "On Time"
                              : `${shiftInfo.status.type} (${shiftInfo.status.minutes}m)`}
                          </span>
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-2 sm:mt-0"
                        onClick={() => handleEndShift(shiftId)}
                      >
                        <Timer className="mr-2 h-5 w-5" />
                        End Shift
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Completed Shifts */}
            {completedShifts.filter((shift) => shift.date === today).length >
              0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">
                  Today's Completed Shifts
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {completedShifts
                    .filter((shift) => shift.date === today)
                    .map((shift, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900"
                      >
                        <div>
                          <p className="font-medium">{shift.shift}</p>
                          <p className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span
                              className={
                                shift.status.includes("Late")
                                  ? "text-amber-600"
                                  : shift.status.includes("Early")
                                  ? "text-blue-600"
                                  : "text-green-600"
                              }
                            >
                              {shift.status}
                            </span>
                          </p>
                        </div>
                        <div className="text-right mt-2 sm:mt-0">
                          <p className="text-sm text-muted-foreground">
                            Hours Worked
                          </p>
                          <p className="font-medium">{shift.hours}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Employee Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Department</h3>
            </div>
            <p className="text-2xl font-bold">{employeeData.department}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Designation</h3>
            </div>
            <p className="text-2xl font-bold">{employeeData.designation}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <CalendarClock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Available Shifts</h3>
            </div>
            <div className="space-y-2">
              {employeeData.availableShifts.map((shift) => (
                <div key={shift.id} className="flex justify-between">
                  <p className="font-medium">{shift.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {shift.startTime} - {shift.endTime}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Attendance History */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Recent Attendance History
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  ...employeeData.attendanceHistory,
                  ...completedShifts.filter((shift) => shift.date !== today),
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                  label={{ value: "Hours", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                />
                <Bar
                  dataKey="hours"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance History Table */}
          <div className="mt-6 border rounded-md">
            <div className="grid grid-cols-4 p-3 border-b bg-muted/50 font-medium">
              <div>Date</div>
              <div>Shift</div>
              <div>Status</div>
              <div>Hours</div>
            </div>
            {[...employeeData.attendanceHistory, ...completedShifts]
              .sort((a, b) => {
                // Sort by date (newest first)
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
              })
              .map((record, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 p-3 border-b last:border-0"
                >
                  <div>{record.date}</div>
                  <div>{record.shift}</div>
                  <div
                    className={
                      record.status.includes("Late")
                        ? "text-amber-600"
                        : record.status.includes("Early")
                        ? "text-blue-600"
                        : "text-green-600"
                    }
                  >
                    {record.status}
                  </div>
                  <div>{record.hours}</div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </>
  );
}
