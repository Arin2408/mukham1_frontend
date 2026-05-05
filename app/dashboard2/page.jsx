"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AxiosGet, AxiosPost, useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Webcam from "react-webcam";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  MapPin,
  Camera,
  Loader2,
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

// Employee data is fetched from the API inside the DashboardContent component

export default function EmployeeDashboard() {
  const [currentTime, setCurrentTime] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [activeShifts, setActiveShifts] = useState({});
  const [completedShifts, setCompletedShifts] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState('none');
  const [verificationDistance, setVerificationDistance] = useState(null);
  const webcamRef = useRef(null);
  const [error, setError] = useState(null);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent 
        currentTime={currentTime} 
        setCurrentTime={setCurrentTime}
        isMounted={isMounted}
        setIsMounted={setIsMounted}
        selectedShift={selectedShift}
        setSelectedShift={setSelectedShift}
        activeShifts={activeShifts}
        setActiveShifts={setActiveShifts}
        completedShifts={completedShifts}
        setCompletedShifts={setCompletedShifts}
        isVerifying={isVerifying}
        setIsVerifying={setIsVerifying}
        verificationStep={verificationStep}
        setVerificationStep={setVerificationStep}
        verificationDistance={verificationDistance}
        setVerificationDistance={setVerificationDistance}
        webcamRef={webcamRef}
        error={error}
        setError={setError}
      />
    </Suspense>
  );
}

const mockEmployeeData = {
  id: "EMP001",
  name: "John Doe",
  department: "Engineering",
  designation: "Senior Developer",
  availableShifts: [
    { id: "shift1", name: "Morning Shift", startTime: "09:00", endTime: "12:00" },
    { id: "shift2", name: "Afternoon Shift", startTime: "13:00", endTime: "16:00" },
    { id: "shift3", name: "Evening Shift", startTime: "17:00", endTime: "23:00" },
  ],
  attendanceHistory: [
    { date: "Feb 24", shift: "Morning Shift", status: "On Time", hours: 3 },
  ],
};

function DashboardContent({ 
  currentTime, setCurrentTime, isMounted, setIsMounted,
  selectedShift, setSelectedShift, activeShifts, setActiveShifts,
  completedShifts, setCompletedShifts,
  isVerifying, setIsVerifying, verificationStep, setVerificationStep,
  verificationDistance, setVerificationDistance, webcamRef, error, setError
}) {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const { authChecked, user } = useAuth();
  
  // Initialize with mock data, but use the auth user name if available
  const [employeeData, setEmployeeData] = useState({
    ...mockEmployeeData,
    name: user?.name || mockEmployeeData.name
  });

  // Update name if user state changes
  useEffect(() => {
    if (user?.name) {
      setEmployeeData(prev => ({ ...prev, name: user.name }));
    }
  }, [user]);

  // Fetch real employee data - silent fallback to mock if fails
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const data = await AxiosGet("employee-details/");
        if (data && data.profile) {
          const profile = data.profile;
          setEmployeeData({
            id: `EMP${profile.user_id || '---'}`,
            name: `${profile.first_name} ${profile.last_name}`,
            department: profile.department?.details || "N/A",
            designation: profile.designation?.details || "N/A",
            availableShifts: profile.shift ? [
               {
                 id: profile.shift.shift_id,
                 name: profile.shift.shift_name,
                 startTime: profile.shift.shift_start_time,
                 endTime: profile.shift.shift_end_time
               }
            ] : mockEmployeeData.availableShifts,
            attendanceHistory: mockEmployeeData.attendanceHistory,
            office_location: profile.office_location
          });
        }
      } catch (error) {
        console.error("Failed to fetch employee details, staying with mock data", error);
      }
    };
    if (authChecked) fetchProfile();
  }, [authChecked]);

  // Update current time every minute
  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Format time as HH:MM
  const formatTime = (date) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Format date as MMM DD (e.g. Mar 02)
  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Parse time string to get hours and minutes
  const parseTime = (timeStr) => {
    if (!timeStr) return { hours: 0, minutes: 0 };
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

  // Haversine distance formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };



  // Handle marking attendance (Start Shift)
  const handleMarkAttendance = async () => {
    if (!canStartShift(selectedShift)) return;
    
    setIsVerifying(true);
    setVerificationStep('location');
    setVerificationDistance(null);
    setError(null);

    // 1. Get GPS Location
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsVerifying(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const officeLat = parseFloat(employeeData.office_location?.latitude);
        const officeLon = parseFloat(employeeData.office_location?.longitude);

        if (isNaN(officeLat) || isNaN(officeLon)) {
          setError(`Office location not set. Your Current coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          // DO NOT close modal, let user see the error
          return;
        }

        const distance = calculateDistance(latitude, longitude, officeLat, officeLon);
        setVerificationDistance(distance);
        const isInside = distance <= 100;

        if (!isInside) {
          // 2. Geofence Check Failed
          setError(`Location Mismatch: You are ${distance.toFixed(0)}m away from the office. (Allowed: 100m)`);
          // Record outside attempt
          await submitAttendance('outside', 'skipped', true);
          return;
        }

        // 3. Geofence Check Passed -> Check if we actually have a face registered
        try {
          const mobile = user?.mobile_number || localStorage.getItem("user_mobile");
          const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
          const { data: faceData } = await Axios.post("face/check-status/", { mobile_number: cleanMobile });
          
          if (!faceData.is_face_registered) {
            setError("No face registered. Please register your face in the profile settings first.");
            return;
          }
        } catch (err) {
          console.warn("Face status check failed, proceeding anyway", err);
        }

        // Proceed to Face Verification UI
        setVerificationStep('face');
      },
      (err) => {
        setError(`Location Error: ${err.message}. Please ensure GPS is ON and you have allowed location permissions.`);
        setIsVerifying(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const captureAndVerify = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError("Failed to capture image. Please check camera permissions.");
      return;
    }

    setVerificationStep('submitting');
    setError(null);
    
    try {
      const mobile = user?.mobile_number || localStorage.getItem("user_mobile");
      if (!mobile) {
        setError("Error: User mobile number not found. Please log in again.");
        return;
      }
      
      const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
      const res = await AxiosPost("face/verify/", {
        mobile_number: cleanMobile,
        face_image_base64: imageSrc.split(',')[1] // Just the base64 part
      });

      if (res.verified && res.confidence >= 90) {
        await submitAttendance('inside', 'verified');
      } else {
        setError(`Face verification failed (Confidence: ${res.confidence?.toFixed(1)}%). Please try again.`);
        await submitAttendance('inside', 'failed', true);
      }
    } catch (err) {
      console.error("Face verification error:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || "Connection error";
      setError(`Face verification failed: ${errorMsg}`);
      await submitAttendance('inside', 'failed', true);
    }
  };

  const submitAttendance = async (locationStatus, faceStatus, stayOpen = false) => {
    try {
      const res = await AxiosPost("mark-attendance/", {
        location_status: locationStatus,
        face_status: faceStatus
      });

      // Update local state
      setEmployeeData(prev => ({
        ...prev,
        attendanceHistory: [
          { 
            date: formatDate(new Date()), 
            shift: selectedShift.name, 
            status: res.status, 
            hours: 0 
          },
          ...prev.attendanceHistory
        ]
      }));

      setActiveShifts(prev => ({
        ...prev,
        [selectedShift.id]: {
          shift: selectedShift,
          startTime: new Date(res.check_in),
          status: { type: res.status, minutes: 0 }
        }
      }));

      if (!stayOpen) {
        setVerificationStep('success');
        setTimeout(() => setIsVerifying(false), 2000);
      }
    } catch (err) {
      setError("Failed to record: " + (err.response?.data?.error || err.message));
    } finally {
      if (!stayOpen) {
        // Only set to none if we're closing
        setTimeout(() => setVerificationStep('none'), 2500);
      }
    }
  };

  // Handle ending shift
  const handleEndShift = async (shiftId) => {
    try {
      setError(null);
      await AxiosPost("mark-attendance/", {});
      // Refresh local state instead of reload
      setActiveShifts(prev => {
        const next = { ...prev };
        delete next[shiftId];
        return next;
      });
      toast({ title: "Shift Ended", description: "Your attendance has been recorded." });
    } catch (err) {
      setError("Failed to end shift: " + (err.response?.data?.error || err.message));
    }
  };

  // Get today's date
  const today = formatDate(currentTime);

  // Filter available shifts (not active, not completed today)
  const availableShiftsForSelection = employeeData?.availableShifts?.filter(
    (shift) => {
      // Check if shift is already active
      if (activeShifts[shift.id]) return false;

      // Check if shift is already completed today
      const isCompletedToday =
        completedShifts.some(
          (cs) => cs.shift === shift.name && cs.date === today
        ) ||
        (employeeData?.attendanceHistory || []).some(
          (record) => record.shift === shift.name && record.date === today
        );

      return !isCompletedToday;
    }
  ) || [];

  return (
    <>
      <style jsx global>{`
        ${isEmbed ? 'body { overflow: hidden; }' : ''}
      `}</style>
      
      {/* Aggressive hide: Only show header if NOT embedded and IS mounted */}
      {isMounted && !isEmbed && <Header />}
      
      <div className="p-6 space-y-8">
        {!isMounted ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4">
               <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
               <p className="text-muted-foreground animate-pulse">Initializing dashboard...</p>
            </div>
          </div>
        ) : (
          <>
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
                  {isMounted && currentTime ? formatTime(currentTime) : "--:--"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {isMounted && currentTime ? currentTime.toLocaleDateString([], {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : "Loading date..."}
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
                    disabled={!canStartShift(selectedShift) || isVerifying}
                  >
                    {isVerifying ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <MapPin className="mr-2 h-5 w-5" />
                    )}
                    {isVerifying ? "Verifying..." : "Start Shift"}
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
                Today&apos;s Completed Shifts
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
          </>
        )}
        {/* Verification Modal */}
        <Dialog open={isVerifying} onOpenChange={(open) => !open && setIsVerifying(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Attendance Verification</DialogTitle>
              <DialogDescription>
                Please wait while we verify your identity and location.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-6 space-y-6">
              {error && (
                <div className="w-full p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive animate-in fade-in zoom-in duration-300">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              {verificationStep === 'location' && (
                <div className="text-center space-y-4">
                  <div className="relative">
                    <MapPin className="h-16 w-16 text-primary animate-bounce mx-auto" />
                    <Loader2 className="h-20 w-20 text-primary/20 animate-spin absolute -top-2 -left-2" />
                  </div>
                  <p className="font-medium">Checking GPS Location...</p>
                  <p className="text-sm text-muted-foreground">
                    {verificationDistance !== null 
                      ? `Distance: ${verificationDistance.toFixed(0)}m (Max: 100m)`
                      : "Verifying geofence (100m radius)"}
                  </p>
                  {error && (
                    <Button variant="outline" size="sm" onClick={() => setIsVerifying(false)}>
                      Close & Fix Location
                    </Button>
                  )}
                </div>
              )}

              {verificationStep === 'success' && (
                <div className="text-center space-y-4 animate-in zoom-in duration-500">
                  <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-700">Attendance Marked!</h3>
                  <p className="text-muted-foreground">Shift started successfully.</p>
                </div>
              )}

              {verificationStep === 'face' && (
                <div className="text-center space-y-4 w-full">
                  <div className="relative rounded-2xl overflow-hidden border-4 border-primary/20 shadow-2xl bg-black aspect-video">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover"
                      videoConstraints={{ facingMode: "user" }}
                    />
                    <div className="absolute inset-0 border-[20px] border-black/40 pointer-events-none rounded-full scale-110"></div>
                  </div>
                  <p className="font-medium flex items-center justify-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    Position your face in the center
                  </p>
                  <Button onClick={captureAndVerify} className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20">
                    Capture & Verify
                  </Button>
                </div>
              )}

              {verificationStep === 'submitting' && (
                <div className="text-center space-y-4">
                  <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
                  <p className="font-medium">Finalizing Attendance...</p>
                  <p className="text-sm text-muted-foreground">This will only take a moment</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
