"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FastAPIGet, FastAPIPost, apiErrorMessage, useAuth } from "@/context/AuthContext";
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
  GPS_MAX_ACCURACY_METERS,
  getCurrentCoords,
  officeRadius,
} from "@/lib/geo";
import { Sidebar } from "@/components/Sidebar";
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

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '12px'
  },
  itemStyle: { color: 'hsl(var(--popover-foreground))' },
  cursor: { fill: 'rgba(128,128,128,0.1)' }
};

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

const emptyEmployeeData = {
  id: "---",
  name: "Loading...",
  department: "---",
  designation: "---",
  availableShifts: [],
  attendanceHistory: [],
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
  
  const [employeeData, setEmployeeData] = useState({
  ...emptyEmployeeData,
  name: user?.name || emptyEmployeeData.name
});

const [verificationLocation, setVerificationLocation] = useState(null);

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
        // FastAPI returns a flat profile (no nested `profile` object)
        const profile = await FastAPIGet("employee-details");
        if (profile) {
          setEmployeeData({
            id: `EMP${profile.user_id || '---'}`,
            name: `${profile.first_name} ${profile.last_name}`,
            department: profile.department_name || "N/A",
            designation: profile.designation_name || "N/A",
            availableShifts: profile.shift_id ? [
               {
                 id: profile.shift_id,
                 name: profile.shift_name,
                 startTime: profile.shift_start_time,
                 endTime: profile.shift_end_time
               }
            ] : [],
            attendanceHistory: [],
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
        const { latitude, longitude, accuracy } = position.coords;

        if (accuracy > GPS_MAX_ACCURACY_METERS) {
          setError(`Your location is only accurate to about ${Math.round(accuracy)}m (needs ${GPS_MAX_ACCURACY_METERS}m or better). Turn on precise location, move near a window or outdoors, and try again.`);
          return;
        }

        const officeLat = parseFloat(employeeData.office_location?.latitude);
        const officeLon = parseFloat(employeeData.office_location?.longitude);

        // Pre-check only against an assigned office. Without one, the server
        // matches the nearest organisation location.
        if (!isNaN(officeLat) && !isNaN(officeLon)) {
          const radius = officeRadius(employeeData.office_location);
          const distance = calculateDistance(latitude, longitude, officeLat, officeLon);
          setVerificationDistance(distance);

          if (distance > radius) {
            // 2. Geofence Check Failed -> attendance is NOT recorded
            setError(`Location Mismatch: You are ${distance.toFixed(0)}m away from the office. (Allowed: ${radius}m)`);
            return;
          }
        }

        // 3. Geofence Check Passed -> Check if we actually have a face registered
        try {
          const mobile = user?.mobile_number || localStorage.getItem("user_mobile");
          const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
          const faceData = await FastAPIPost("face/check-status", { mobile_number: cleanMobile });
          
          if (!faceData.is_face_registered) {
            setError("No face registered. Please register your face in the profile settings first.");
            return;
          }
        } catch (err) {
          console.warn("Face status check failed, proceeding anyway", err);
        }
        setVerificationLocation({
          latitude,
          longitude,
          accuracy
        });


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
      const res = await FastAPIPost("face/verify", {
        mobile_number: cleanMobile,
        face_image_base64: imageSrc.split(',')[1] // Just the base64 part
      });

      if (res.verified && res.confidence >= 90 && res.face_token) {
        await submitAttendance(res.face_token, false, verificationLocation.latitude, verificationLocation.longitude, verificationLocation.accuracy);
      } else {
        // Attendance is not recorded for a failed face match.
        setError(`Face verification failed (Confidence: ${res.confidence?.toFixed(1)}%). Please try again.`);
        setVerificationStep('face');
      }
    } catch (err) {
      console.error("Face verification error:", err);
      setError(`Face verification failed: ${apiErrorMessage(err, "Connection error")}`);
      setVerificationStep('face');
    }
  };

  const submitAttendance = async (faceToken, stayOpen = false, latitude = null, longitude = null, accuracy = null) => {
    try {
      const res = await FastAPIPost("attendance/mark", {
        action: "checkin",
        // Server-issued proof of the face match from face/verify
        face_token: faceToken,
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy
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
      setError("Failed to record: " + apiErrorMessage(err, "Unknown error"));
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
      // Send current GPS so the backend can flag check-outs away from the
      // office; check-out still works if location is unavailable.
      const coords = await getCurrentCoords();
      await FastAPIPost("attendance/mark", { action: "checkout", ...(coords || {}) });
      // Refresh local state instead of reload
      setActiveShifts(prev => {
        const next = { ...prev };
        delete next[shiftId];
        return next;
      });
      toast({ title: "Shift Ended", description: "Your attendance has been recorded." });
    } catch (err) {
      setError("Failed to end shift: " + apiErrorMessage(err, "Unknown error"));
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

  if (!isMounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex">
      <Sidebar />
      
      <div className="flex-1 lg:ml-[var(--sidebar-w)] transition-[margin] duration-300 ml-0 p-4 lg:p-10 space-y-8 relative z-10 max-w-[1600px] mx-auto w-full">
        {!isMounted ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4">
               <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
               <p className="text-muted-foreground animate-pulse">Initializing Command Center...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight page-title">Member Dashboard</h1>
                <p className="text-muted-foreground text-sm">Welcome back, {employeeData.name.split(' ')[0]}. Here is your status.</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-3 bg-foreground/5 px-4 py-2 rounded-lg border border-foreground/10">
                   <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-xs font-bold text-muted-foreground">Active Session</span>
                 </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <Card className="quantanex-card p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 sparkline-blue opacity-20" />
                  <div className="relative z-10">
                    <h2 className="text-4xl font-bold text-foreground tracking-tight mb-1">
                      {isMounted && currentTime ? formatTime(currentTime) : "--:--"}
                    </h2>
                    <p className="text-xs font-bold text-primary">
                      {isMounted && currentTime ? currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : "---"}
                    </p>
                  </div>
               </Card>

               {[
                 { label: "Department", value: employeeData.department, color: "blue", icon: Building2 },
                 { label: "Designation", value: employeeData.designation, color: "orange", icon: Briefcase },
                 { label: "Current Shift", value: employeeData.availableShifts[0]?.name || "None", color: "green", icon: Clock },
               ].map((stat, i) => (
                 <Card key={i} className="quantanex-card p-6 group relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl bg-accent-${stat.color}-10 border border-${stat.color}-500/20`}>
                        <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-muted-foreground mb-1">{stat.label}</p>
                        <h3 className="text-lg font-bold text-foreground truncate max-w-[150px]">{stat.value}</h3>
                      </div>
                    </div>
                    <div className={`mt-4 h-1 w-full bg-${stat.color}-500/10 rounded-full overflow-hidden`}>
                      <div className={`h-full bg-${stat.color}-500 w-2/3 opacity-50`} />
                    </div>
                 </Card>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Shift Control Center */}
              <Card className="quantanex-card p-8 lg:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Shift Control</h3>
                    <p className="text-xs text-muted-foreground">Manage your active work session</p>
                  </div>
                  {Object.keys(activeShifts).length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold text-green-500">LIVE</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {Object.keys(activeShifts).length === 0 ? (
                    <div className="flex flex-col sm:flex-row items-end gap-4 bg-foreground/[0.02] p-6 rounded-xl border border-foreground/5">
                      <div className="flex-1 w-full space-y-2">
                        <label className="text-xs font-bold text-muted-foreground ml-1">Available Shift</label>
                        <Select
                          value={selectedShift?.id}
                          onValueChange={(v) => setSelectedShift(employeeData.availableShifts.find(s => s.id === v))}
                        >
                          <SelectTrigger className="w-full bg-foreground/5 border-foreground/10 h-12 text-foreground">
                            <SelectValue placeholder="Select shift to start..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableShiftsForSelection.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleMarkAttendance}
                        disabled={!canStartShift(selectedShift) || isVerifying}
                        className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/20"
                      >
                        {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        Start Session
                      </Button>
                    </div>
                  ) : (
                    Object.entries(activeShifts).map(([id, info]) => (
                      <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-green-500/5 rounded-xl border border-green-500/20">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Timer className="h-6 w-6 text-green-500 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground tracking-tight">{info.shift.name}</p>
                            <p className="text-xs text-muted-foreground">Started at {formatTime(info.startTime)} • Status: <span className="text-green-500 font-bold">{info.status.type}</span></p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => handleEndShift(id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-8 h-12 mt-4 sm:mt-0 shadow-lg shadow-red-900/20 border-none"
                        >
                          End Session
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Recent Logs mini-list */}
              <Card className="quantanex-card p-0 flex flex-col h-full">
                <div className="p-6 border-b border-foreground/5 bg-foreground/[0.02]">
                  <h3 className="text-lg font-bold text-foreground">Recent Logs</h3>
                  <p className="text-xs text-muted-foreground font-bold mt-1">Activity Feed</p>
                </div>
                <div className="flex-1 overflow-auto max-h-[400px] divide-y divide-foreground/5">
                  {[...employeeData.attendanceHistory, ...completedShifts]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((record, index) => (
                      <div key={index} className="p-4 flex items-center justify-between hover:bg-foreground/[0.01] transition-colors group">
                         <div className="flex items-center gap-3">
                           <div className={`w-1.5 h-1.5 rounded-full ${record.status.includes("Late") ? "bg-amber-500" : "bg-green-500"}`} />
                           <div>
                             <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{record.shift}</p>
                             <p className="text-xs text-muted-foreground">{record.date}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className={`text-xs font-bold ${record.status.includes("Late") ? "text-amber-500" : "text-green-500"}`}>{record.status.toUpperCase()}</p>
                           <p className="text-xs text-muted-foreground font-mono">{record.hours}H</p>
                         </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            {/* Attendance Analytics (Full Width Chart) */}
            <Card className="quantanex-card p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Attendance Analytics</h3>
                  <p className="text-xs text-muted-foreground">Historical work hour performance</p>
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold text-muted-foreground">Average</p>
                   <p className="text-lg font-bold text-primary tracking-tight">7.4 HRS</p>
                </div>
              </div>
              <div className="h-[350px] w-full flex items-center justify-center">
                {[...employeeData.attendanceHistory, ...completedShifts].length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...employeeData.attendanceHistory, ...completedShifts].slice(0, 10).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="rgba(128,128,128,0.8)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10} 
                      />
                      <YAxis 
                        stroke="rgba(128,128,128,0.8)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">No attendance data available yet.</p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Verification Modal */}
      <Dialog open={isVerifying} onOpenChange={(o) => !o && setIsVerifying(false)}>
        <DialogContent className="bg-card border-foreground/10 text-foreground max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Identity Verification</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">Command Center Security Protocol</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
             {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold animate-in fade-in zoom-in">
                  {error}
                </div>
             )}
             
             {verificationStep === 'location' && (
                <div className="text-center space-y-4 py-8">
                  <div className="relative inline-block">
                    <MapPin className="h-16 w-16 text-primary animate-bounce mx-auto" />
                    <Loader2 className="h-20 w-20 text-primary/20 animate-spin absolute -top-2 -left-2" />
                  </div>
                  <p className="text-sm font-bold">Checking Geofence...</p>
                </div>
             )}

             {verificationStep === 'face' && (
                <div className="space-y-6">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-foreground/10 bg-card aspect-video">
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-[30px] border-black/40 rounded-full scale-110 pointer-events-none" />
                  </div>
                  <Button onClick={captureAndVerify} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-xs">
                    Verify Identity
                  </Button>
                </div>
             )}

             {verificationStep === 'success' && (
                <div className="text-center py-8 animate-in zoom-in">
                   <div className="h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-12 w-12 text-green-500" />
                   </div>
                   <h3 className="text-xl font-bold">Authenticated</h3>
                   <p className="text-sm text-muted-foreground">Session started successfully</p>
                </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
