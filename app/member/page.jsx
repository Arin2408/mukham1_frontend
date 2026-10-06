"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AxiosGet, AxiosPost, useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  Briefcase,
  CheckCircle2,
  Timer,
  MapPin,
  Camera,
  Loader2,
  ShieldCheck,
  Mail,
  Phone,
  LogOut,
  AlertCircle,
} from "lucide-react";

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

import {
  GPS_MAX_ACCURACY_METERS,
  getCurrentCoords,
  officeRadius,
} from "@/lib/geo";

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#11141b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "8px",
    fontSize: "12px",
  },
  itemStyle: { color: "#fff" },
  cursor: { fill: "rgba(255,255,255,0.05)" },
};

const emptyEmployeeData = {
  id: "---",
  name: "Loading...",
  email: "---",
  department: "---",
  designation: "---",
  availableShifts: [],
  attendanceHistory: [],
  office_location: null,
};

export default function MemberPortal() {
  const { user, authChecked, logoutUser } = useAuth();
  const { toast } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const [currentTime, setCurrentTime] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [activeShifts, setActiveShifts] = useState({});
  const [completedShifts, setCompletedShifts] = useState([]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState("none");

  const [verificationLocation, setVerificationLocation] = useState(null);
  const [verificationDistance, setVerificationDistance] = useState(null);
  const [error, setError] = useState(null);

  const webcamRef = useRef(null);

  const [employeeData, setEmployeeData] = useState({
    ...emptyEmployeeData,
    name: user?.name || emptyEmployeeData.name,
    email: user?.email || emptyEmployeeData.email,
  });

  // ---------------------------------------------------------
  // MOUNT + CLOCK
  // ---------------------------------------------------------

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // ---------------------------------------------------------
  // USER DATA
  // ---------------------------------------------------------

  useEffect(() => {
    if (user?.name) {
      setEmployeeData((prev) => ({
        ...prev,
        name: user.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // ---------------------------------------------------------
  // FETCH EMPLOYEE PROFILE + ATTENDANCE
  // ---------------------------------------------------------

  useEffect(() => {
    if (!authChecked) return;

    const fetchProfile = async () => {
      try {
        const [data, history] = await Promise.all([
          AxiosGet("employee-details/"),
          // Recent sessions only (newest first, so an open session is included)
          AxiosGet("attendance-history/?limit=60"),
        ]);

        if (data?.profile) {
          const p = data.profile;

          const mappedHistory = Array.isArray(history)
            ? history.map((log) => ({
                date: log.check_in
                  ? new Date(log.check_in).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A",
                shift: log.shift_name || "Shift",
                status: log.status || "Completed",
                hours: parseFloat(log.hours_worked) || 0,
              }))
            : [];

          setEmployeeData({
            id: `EMP${p.user_id || "---"}`,
            name: `${p.first_name} ${p.last_name}`,
            email: p.email || "N/A",
            department: p.department?.details || "N/A",
            designation: p.designation?.details || "N/A",

            availableShifts: p.shift
              ? [
                  {
                    id: p.shift.shift_id,
                    name: p.shift.shift_name,
                    startTime: p.shift.shift_start_time,
                    endTime: p.shift.shift_end_time,
                  },
                ]
              : [],

            attendanceHistory: mappedHistory,

            // Organization office location
            office_location: p.office_location,
          });

          // Restore an open session (check-in without check-out)
          // so "End Session" still works after a page refresh.
          const openLog = Array.isArray(history)
            ? history.find((log) => log.check_in && !log.check_out)
            : null;

          if (openLog && p.shift) {
            const restoredShift = {
              id: p.shift.shift_id,
              name: p.shift.shift_name,
              startTime: p.shift.shift_start_time,
              endTime: p.shift.shift_end_time,
            };

            setActiveShifts({
              [restoredShift.id]: {
                shift: restoredShift,
                startTime: new Date(openLog.check_in),
                status: {
                  type: openLog.status || "On Time",
                },
              },
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch employee profile:", e);
      }
    };

    fetchProfile();
  }, [authChecked]);

  // ---------------------------------------------------------
  // FORMAT HELPERS
  // ---------------------------------------------------------

  const formatTime = (d) =>
    d?.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) || "--:--";

  const formatDate = (d) =>
    d?.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    }) || "";

  // ---------------------------------------------------------
  // PARSE SHIFT TIME
  // ---------------------------------------------------------

  const parseTime = (timeStr) => {
    if (!timeStr) {
      return {
        hours: 23,
        minutes: 59,
      };
    }

    const [hours, minutes] = timeStr.split(":").map(Number);

    return {
      hours,
      minutes,
    };
  };

  // ---------------------------------------------------------
  // CHECK WHETHER SHIFT CAN START
  // ---------------------------------------------------------

  const canStartShift = (shift) => {
    if (!shift || !currentTime) return false;

    const now = currentTime;
    const today = formatDate(now);

    const { hours: endHours, minutes: endMinutes } = parseTime(
      shift.endTime
    );

    const cutoffTime = new Date(now);

    cutoffTime.setHours(endHours, endMinutes, 0, 0);

    // Already active
    if (activeShifts[shift.id]) {
      return false;
    }

    // Already completed today
    const isCompleted = completedShifts.some(
      (cs) => cs.shift === shift.name && cs.date === today
    );

    if (isCompleted) {
      return false;
    }

    return now < cutoffTime;
  };

  // ---------------------------------------------------------
  // HAVERSINE DISTANCE
  // ---------------------------------------------------------

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;

    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;

    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // ---------------------------------------------------------
  // START SHIFT
  // GPS -> OFFICE LOCATION -> GEOFENCE
  // ---------------------------------------------------------

  const handleMarkAttendance = async () => {
    if (!canStartShift(selectedShift)) {
      return;
    }

    setIsVerifying(true);
    setVerificationStep("location");
    setVerificationDistance(null);
    setVerificationLocation(null);
    setError(null);

    // Check browser geolocation support
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;

          console.log("CURRENT EMPLOYEE GPS:", {
            latitude,
            longitude,
            accuracy,
          });

          // -------------------------------------------------
          // GPS ACCURACY CHECK
          // -------------------------------------------------

          if (accuracy > GPS_MAX_ACCURACY_METERS) {
            setError(
              `Your location is only accurate to about ${Math.round(
                accuracy
              )}m (needs ${GPS_MAX_ACCURACY_METERS}m or better). Turn on precise location, move near a window or outdoors, and try again.`
            );

            return;
          }

          // -------------------------------------------------
          // ORGANIZATION OFFICE LOCATION
          // -------------------------------------------------

          const officeLat = parseFloat(
            employeeData.office_location?.latitude
          );

          const officeLon = parseFloat(
            employeeData.office_location?.longitude
          );

          // -------------------------------------------------
          // GEOFENCE PRE-CHECK (assigned office only)
          // Without an assigned office the server matches the
          // nearest organisation location, so skip the pre-check.
          // -------------------------------------------------

          if (!isNaN(officeLat) && !isNaN(officeLon)) {
            const radius = officeRadius(employeeData.office_location);

            const distance = calculateDistance(
              latitude,
              longitude,
              officeLat,
              officeLon
            );

            console.log("DISTANCE FROM OFFICE:", distance, "meters");

            setVerificationDistance(distance);

            if (distance > radius) {
              // Outside office -> show error only. Attendance is NOT recorded.
              setError(
                `Location Mismatch: You are ${distance.toFixed(
                  0
                )}m away from the office. Allowed radius: ${radius}m.`
              );

              return;
            }
          }

          // -------------------------------------------------
          // SAVE GPS FOR ATTENDANCE
          // -------------------------------------------------

          setVerificationLocation({
            latitude,
            longitude,
            accuracy,
          });

          // -------------------------------------------------
          // CHECK FACE REGISTRATION
          // -------------------------------------------------

          try {
            const mobile =
              user?.mobile_number ||
              localStorage.getItem("user_mobile");

            if (!mobile) {
              setError(
                "User mobile number not found. Please login again."
              );
              return;
            }

            const cleanMobile = mobile
              .replace(/\D/g, "")
              .slice(-10);

            const faceData = await AxiosPost(
              "face/check-status/",
              {
                mobile_number: cleanMobile,
              }
            );

            if (!faceData?.is_face_registered) {
              setError(
                "No face registered. Please register your face in profile settings first."
              );
              return;
            }
          } catch (err) {
            console.warn(
              "Face registration status check failed:",
              err
            );

            setError(
              "Unable to verify face registration status. Please try again."
            );

            return;
          }

          // -------------------------------------------------
          // LOCATION PASSED
          // SHOW FACE UI
          // -------------------------------------------------

          setVerificationStep("face");
        } catch (err) {
          console.error("Location processing error:", err);

          setError(
            err.message || "Unable to process your location."
          );
        }
      },
      (err) => {
        console.error("GPS ERROR:", err);

        setError(
          `Location Error: ${err.message}. Please ensure GPS is ON and location permission is allowed.`
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // ---------------------------------------------------------
  // CAPTURE FACE + VERIFY
  // ---------------------------------------------------------

  const captureAndVerify = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      setError(
        "Failed to capture image. Please check camera permissions."
      );
      return;
    }

    if (!verificationLocation) {
      setError(
        "Location information is missing. Please restart the attendance process."
      );
      return;
    }

    setVerificationStep("submitting");
    setError(null);

    try {
      const mobile =
        user?.mobile_number ||
        localStorage.getItem("user_mobile");

      if (!mobile) {
        setError(
          "User mobile number not found. Please login again."
        );
        return;
      }

      const cleanMobile = mobile
        .replace(/\D/g, "")
        .slice(-10);

      // -----------------------------------------------------
      // FACE VERIFICATION
      // -----------------------------------------------------

      const res = await AxiosPost("face/verify/", {
        mobile_number: cleanMobile,
        face_image_base64: imageSrc.split(",")[1],
      });

      console.log("FACE VERIFICATION RESULT:", res);

      // -----------------------------------------------------
      // FACE VERIFIED
      // -----------------------------------------------------

      if (res?.verified && res?.confidence >= 90) {
        await submitAttendance(
          "inside",
          "verified",
          false,
          verificationLocation.latitude,
          verificationLocation.longitude,
          verificationLocation.accuracy
        );
      } else {
        // ---------------------------------------------------
        // FACE FAILED -> show error, let the user retry.
        // Attendance is NOT recorded.
        // ---------------------------------------------------

        setError(
          `Face verification failed. Confidence: ${
            res?.confidence
              ? res.confidence.toFixed(1)
              : "N/A"
          }%`
        );

        setVerificationStep("face");
      }
    } catch (err) {
      console.error("Face verification error:", err);

      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Connection error";

      setError(`Face verification failed: ${errorMsg}`);

      setVerificationStep("face");
    }
  };

  // ---------------------------------------------------------
  // SUBMIT ATTENDANCE
  // ---------------------------------------------------------

  const submitAttendance = async (
    locationStatus,
    faceStatus,
    stayOpen = false,
    latitude = null,
    longitude = null,
    accuracy = null
  ) => {
    try {
      const res = await AxiosPost("mark-attendance/", {
        // Explicit check-in: a repeated request never checks the user out
        action: "checkin",
        location_status: locationStatus,
        face_status: faceStatus,
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy,
      });

      console.log("ATTENDANCE RESPONSE:", res);

      if (stayOpen) {
        return res;
      }

      // -----------------------------------------------------
      // UPDATE ATTENDANCE HISTORY
      // -----------------------------------------------------

      setEmployeeData((prev) => ({
        ...prev,

        attendanceHistory: [
          {
            date: formatDate(new Date()),
            shift: selectedShift?.name || "Shift",
            status: res?.status || "Completed",
            hours: 0,
          },
          ...prev.attendanceHistory,
        ],
      }));

      // -----------------------------------------------------
      // ACTIVATE SHIFT
      // -----------------------------------------------------

      const shift =
        selectedShift ||
        (employeeData.availableShifts &&
        employeeData.availableShifts.length > 0
          ? employeeData.availableShifts[0]
          : null);

      if (shift) {
        setActiveShifts({
          [shift.id]: {
            shift,
            startTime: new Date(),
            status: {
              type: "On Time",
            },
          },
        });
      }

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      setError(null);
      setVerificationStep("success");

      setTimeout(() => {
        setIsVerifying(false);
        setVerificationStep("none");
      }, 2000);

      return res;
    } catch (error) {
      console.error("Attendance submission error:", error);

      // Backend sends the readable text in `detail`
      // (e.g. "You are 245028m away from the office...")
      const message =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        "Failed to record attendance.";

      setError(message);

      setVerificationStep("error");

      return null;
    }
  };

  // ---------------------------------------------------------
  // END SHIFT
  // ---------------------------------------------------------

  const handleEndShift = async (id) => {
    try {
      const s = activeShifts[id];

      if (!s) {
        return;
      }

      // Send current GPS with the check-out so the backend can flag
      // check-outs made away from the office. Check-out is never blocked:
      // if location is unavailable it is sent without coordinates.
      const coords = await getCurrentCoords();

      // Tell backend this is a check-out (never a new check-in)
      await AxiosPost("mark-attendance/", {
        action: "checkout",
        ...(coords || {}),
      });

      setActiveShifts((prev) => {
        const next = { ...prev };

        setCompletedShifts((p) => [
          ...p,
          {
            date: formatDate(new Date()),
            shift: s.shift.name,
            status: "Completed",
            hours: 8,
          },
        ]);

        delete next[id];

        return next;
      });

      toast({
        title: "Shift Ended",
        description:
          "Your attendance has been recorded successfully.",
      });
    } catch (error) {
      // No open record in DB -> clear the stale "live session" in UI
      if (error.response?.status === 404) {
        setActiveShifts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }

      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Failed to end shift: " +
          (error.response?.data?.detail ||
            error.response?.data?.error ||
            error.message),
      });
    }
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0b0e14]" />
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white selection:bg-primary/30 flex">
      <Sidebar />

      <main className="lg:ml-64 ml-0 p-4 lg:p-10 space-y-10 max-w-[1600px] mx-auto relative z-10 w-full">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

          <div className="space-y-1">

            <h1 className="text-3xl font-bold tracking-tight text-white uppercase">
              {activeTab === "dashboard"
                ? "Command Center"
                : "Member Profile"}
            </h1>

            <p className="text-muted-foreground text-sm">
              {activeTab === "dashboard"
                ? `Welcome back, ${
                    employeeData.name.split(" ")[0]
                  }. System operational.`
                : "Manage your biometric and deployment data."}
            </p>

          </div>

          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/10">

            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />

            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Authorized Access
            </span>

          </div>

        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" ? (

          <div className="space-y-10 animate-in fade-in duration-500">

            {/* STATUS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              <Card className="quantanex-card p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group">

                <div className="absolute inset-0 sparkline-blue opacity-20" />

                <div className="relative z-10">

                  <h2 className="text-4xl font-black text-white tracking-tighter mb-1">
                    {formatTime(currentTime)}
                  </h2>

                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    {currentTime?.toLocaleDateString([], {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>

                </div>

              </Card>

              {[
                {
                  label: "Department",
                  value: employeeData.department,
                  color: "blue",
                  icon: Building2,
                },
                {
                  label: "Designation",
                  value: employeeData.designation,
                  color: "orange",
                  icon: Briefcase,
                },
                {
                  label: "Scheduled",
                  value:
                    employeeData.availableShifts.length +
                    " Shifts",
                  color: "green",
                  icon: Clock,
                },
              ].map((stat, i) => (

                <Card
                  key={i}
                  className="quantanex-card p-6 relative overflow-hidden group"
                >

                  <div className="flex items-start justify-between">

                    <div
                      className={`p-3 rounded-xl bg-accent-${stat.color}-10 border border-${stat.color}-500/20`}
                    >
                      <stat.icon
                        className={`h-5 w-5 text-${stat.color}-500`}
                      />
                    </div>

                    <div className="text-right">

                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        {stat.label}
                      </p>

                      <h3 className="text-lg font-bold text-white truncate max-w-[150px]">
                        {stat.value}
                      </h3>

                    </div>

                  </div>

                </Card>

              ))}

            </div>

            {/* MAIN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* SESSION CONTROLLER */}
              <Card className="quantanex-card p-8 lg:col-span-2">

                <div className="flex items-center justify-between mb-8">

                  <div>

                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                      Session Controller
                    </h3>

                    <p className="text-xs text-muted-foreground mt-1">
                      Manage your active duty session
                    </p>

                  </div>

                  {Object.keys(activeShifts).length > 0 && (

                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">

                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />

                      <span className="text-[10px] font-bold text-green-500">
                        LIVE SESSION
                      </span>

                    </div>

                  )}

                </div>

                {Object.keys(activeShifts).length === 0 ? (

                  <div className="flex flex-col sm:flex-row items-end gap-4 bg-white/[0.02] p-6 rounded-xl border border-white/5">

                    <div className="flex-1 w-full space-y-2">

                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                        Identify Active Shift
                      </label>

                      <Select
                        onValueChange={(v) =>
                          setSelectedShift(
                            employeeData.availableShifts.find(
                              (s) =>
                                String(s.id) === String(v)
                            )
                          )
                        }
                      >

                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
                          <SelectValue placeholder="Select shift..." />
                        </SelectTrigger>

                        <SelectContent className="bg-[#11141b] border-white/10 text-white">

                          {employeeData.availableShifts.map(
                            (s) => (

                              <SelectItem
                                key={s.id}
                                value={String(s.id)}
                              >
                                {s.name} ({s.startTime}-
                                {s.endTime})
                              </SelectItem>

                            )
                          )}

                        </SelectContent>

                      </Select>

                    </div>

                    <Button
                      onClick={handleMarkAttendance}
                      disabled={
                        !selectedShift ||
                        !canStartShift(selectedShift)
                      }
                      className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Start Shift
                    </Button>

                  </div>

                ) : (

                  Object.entries(activeShifts).map(
                    ([id, info]) => (

                      <div
                        key={id}
                        className="p-6 bg-green-500/5 rounded-xl border border-green-500/20 flex flex-col sm:flex-row justify-between items-center group"
                      >

                        <div className="flex items-center gap-5">

                          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">

                            <Timer className="h-6 w-6 text-green-500 animate-pulse" />

                          </div>

                          <div>

                            <p className="text-sm font-bold text-white uppercase">
                              {info.shift.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Authenticated at{" "}
                              {formatTime(info.startTime)}
                            </p>

                          </div>

                        </div>

                        <Button
                          variant="destructive"
                          onClick={() =>
                            handleEndShift(id)
                          }
                          className="mt-4 sm:mt-0 bg-red-600 hover:bg-red-700 text-white px-8 h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-red-900/20 border-none"
                        >
                          End Session
                        </Button>

                      </div>

                    )
                  )

                )}

              </Card>

              {/* ACTIVITY LOGS */}
              <Card className="quantanex-card p-0 flex flex-col overflow-hidden">

                <div className="p-6 border-b border-white/5 bg-white/[0.02]">

                  <h3 className="text-lg font-bold text-white">
                    Verified Activity
                  </h3>

                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Last 7 sessions
                  </p>

                </div>

                <div className="flex-1 overflow-auto max-h-[400px] divide-y divide-white/5 scrollbar-hide">

                  {Object.values(
                    [
                      ...employeeData.attendanceHistory,
                      ...completedShifts,
                    ].reduce((acc, curr) => {

                      const key = `${curr.date}-${curr.shift}`;

                      if (!acc[key]) {
                        acc[key] = { ...curr };
                      } else {
                        acc[key].hours += curr.hours;
                      }

                      return acc;

                    }, {})
                  )
                    .reverse()
                    .map((r, i) => (

                      <div
                        key={i}
                        className="p-4 flex justify-between items-center hover:bg-white/[0.02] transition-colors"
                      >

                        <div className="flex items-center gap-3">

                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />

                          <div>

                            <p className="text-[10px] font-bold text-white uppercase">
                              {r.shift}
                            </p>

                            <p className="text-[10px] text-muted-foreground">
                              {r.date}
                            </p>

                          </div>

                        </div>

                        <div className="text-right">

                          <p className="text-[10px] font-bold text-green-500 uppercase">
                            {r.status}
                          </p>

                          <p className="text-[10px] text-muted-foreground font-mono">
                            {r.hours} HRS
                          </p>

                        </div>

                      </div>

                    ))}

                </div>

              </Card>

            </div>

            {/* ANALYTICS */}
            <Card className="quantanex-card p-8">

              <div className="flex justify-between items-center mb-8">

                <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                  Hours Analytics
                </h3>

                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  Efficiency Report
                </p>

              </div>

              <div className="h-[300px] w-full flex items-center justify-center">

                {[...employeeData.attendanceHistory, ...completedShifts]
                  .length > 0 ? (

                  <ResponsiveContainer width="100%" height="100%">

                    <BarChart
                      data={Object.values(
                        [
                          ...employeeData.attendanceHistory,
                          ...completedShifts,
                        ].reduce((acc, curr) => {

                          if (!acc[curr.date]) {
                            acc[curr.date] = {
                              date: curr.date,
                              hours: 0,
                            };
                          }

                          acc[curr.date].hours += curr.hours;

                          return acc;

                        }, {})
                      ).slice(0, 10)}
                    >

                      <defs>

                        <linearGradient
                          id="memberBarGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >

                          <stop
                            offset="0%"
                            stopColor="#4f46e5"
                            stopOpacity={1}
                          />

                          <stop
                            offset="100%"
                            stopColor="#4f46e5"
                            stopOpacity={0.3}
                          />

                        </linearGradient>

                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.05)"
                      />

                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />

                      <YAxis
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip {...tooltipStyle} />

                      <Bar
                        dataKey="hours"
                        fill="url(#memberBarGradient)"
                        radius={[20, 20, 20, 20]}
                        barSize={20}
                        isAnimationActive={false}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                ) : (

                  <p className="text-muted-foreground text-sm">
                    No attendance data available yet.
                  </p>

                )}

              </div>

            </Card>

          </div>

        ) : (

          /* PROFILE */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">

            <Card className="quantanex-card p-8 flex flex-col items-center text-center">

              <div className="relative mb-6">

                <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-3xl font-black text-white">

                  {employeeData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}

                </div>

                <div className="absolute -bottom-1 -right-1 p-2 bg-green-500 rounded-full border-4 border-[#11141b]">

                  <ShieldCheck className="h-4 w-4 text-white" />

                </div>

              </div>

              <h2 className="text-2xl font-bold text-white mb-1">
                {employeeData.name}
              </h2>

              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-6">
                {employeeData.id}
              </p>

              <div className="w-full space-y-3 mt-4 pt-4 border-t border-white/5">

                <div className="flex items-center gap-3 text-left p-3 rounded-xl bg-white/5 border border-white/5">

                  <Mail className="h-4 w-4 text-muted-foreground" />

                  <p className="text-xs text-white truncate">
                    {employeeData.email}
                  </p>

                </div>

                <div className="flex items-center gap-3 text-left p-3 rounded-xl bg-white/5 border border-white/5">

                  <Phone className="h-4 w-4 text-muted-foreground" />

                  <p className="text-xs text-white">
                    Confidential
                  </p>

                </div>

              </div>

              <Button
                onClick={logoutUser}
                variant="outline"
                className="w-full mt-8 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 gap-2 font-bold uppercase tracking-widest text-[10px] h-11"
              >
                <LogOut className="h-4 w-4" />
                Terminate Session
              </Button>

            </Card>

            <div className="md:col-span-2 space-y-8">

              <Card className="quantanex-card p-8">

                <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">
                  Deployment Status
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Department
                    </p>
                    <p className="text-xl font-bold text-white">
                      {employeeData.department}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Designation
                    </p>
                    <p className="text-xl font-bold text-white">
                      {employeeData.designation}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Primary Office
                    </p>
                    <p className="text-xl font-bold text-white">
                      Main Command Center
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Contract Type
                    </p>
                    <p className="text-xl font-bold text-green-500 uppercase">
                      Permanent
                    </p>
                  </div>

                </div>

              </Card>

              <Card className="quantanex-card p-8 bg-primary/5 border-primary/20">

                <div className="flex items-center gap-4 mb-4">

                  <div className="p-2 rounded-lg bg-primary/20">

                    <ShieldCheck className="h-6 w-6 text-primary" />

                  </div>

                  <div>

                    <h4 className="font-bold text-white uppercase tracking-tight">
                      Security Clearance Active
                    </h4>

                    <p className="text-xs text-muted-foreground">
                      Your biometric data is verified and synchronized.
                    </p>

                  </div>

                </div>

              </Card>

            </div>

          </div>

        )}

      </main>

      {/* =====================================================
          VERIFICATION DIALOG
      ===================================================== */}

      <Dialog
        open={isVerifying}
        onOpenChange={(open) => {
          if (!open) {
            setIsVerifying(false);
            setVerificationStep("none");
            setError(null);
          }
        }}
      >

        <DialogContent className="bg-[#11141b] border-white/10 text-white max-w-md rounded-2xl overflow-hidden p-0">

          <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.02]">

            <DialogTitle className="text-xl font-bold text-center uppercase tracking-tight">
              Biometric Audit
            </DialogTitle>

            <DialogDescription className="text-center text-muted-foreground">
              Establishing secure session link...
            </DialogDescription>

          </DialogHeader>

          <div className="p-8 space-y-6">

            {/* LOCATION CHECK (hidden once an error is shown) */}
            {verificationStep === "location" && !error && (

              <div className="text-center py-8 space-y-4">

                <MapPin className="h-16 w-16 text-primary animate-bounce mx-auto" />

                <p className="text-xs font-bold uppercase tracking-widest text-primary animate-pulse">
                  Detecting Your Location
                </p>

                <p className="text-xs text-muted-foreground">
                  Comparing your current GPS location with the organization office.
                </p>

              </div>

            )}

            {/* FACE */}
            {verificationStep === "face" && (

              <div className="space-y-6">

                {verificationDistance !== null && (

                  <div className="flex items-center justify-center gap-2 text-xs text-green-500">

                    <MapPin className="h-4 w-4" />

                    <span>
                      Office distance:{" "}
                      {verificationDistance.toFixed(0)}m
                    </span>

                  </div>

                )}

                <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 bg-black aspect-video shadow-2xl">

                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 border-[30px] border-black/40 rounded-full scale-110 pointer-events-none" />

                </div>

                <Button
                  onClick={captureAndVerify}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Authorize Session
                </Button>

              </div>

            )}

            {/* SUBMITTING */}
            {verificationStep === "submitting" && (

              <div className="text-center py-12 space-y-5">

                <Loader2 className="h-14 w-14 text-primary animate-spin mx-auto" />

                <p className="text-sm font-bold text-white uppercase tracking-widest">
                  Verifying Face
                </p>

                <p className="text-xs text-muted-foreground">
                  Please wait while your biometric identity is verified.
                </p>

              </div>

            )}

            {/* SUCCESS */}
            {verificationStep === "success" && (

              <div className="text-center py-12 space-y-4 animate-in zoom-in duration-500">

                <div className="h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">

                  <CheckCircle2 className="h-10 w-10 text-green-500" />

                </div>

                <h3 className="text-xl font-black text-white tracking-tight uppercase">
                  Session Verified
                </h3>

                <p className="text-xs text-muted-foreground">
                  Attendance has been recorded successfully.
                </p>

              </div>

            )}

            {/* ERROR */}
            {verificationStep === "error" || error ? (

              <div className="space-y-5">

                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">

                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />

                  <p className="text-sm text-red-400">
                    {error || "Verification failed."}
                  </p>

                </div>

                <Button
                  onClick={() => {
                    setError(null);
                    setIsVerifying(false);
                    setVerificationStep("none");
                  }}
                  variant="outline"
                  className="w-full border-white/10 text-white"
                >
                  Close
                </Button>

              </div>

            ) : null}

          </div>

        </DialogContent>

      </Dialog>

    </div>
  );
}