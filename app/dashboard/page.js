"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Clock, Users, Calendar, ArrowUpRight, ArrowDown, ArrowUp, UserPlus, MapPin } from "lucide-react"
import { useState } from "react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts"
import Link from "next/link"
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { FastAPIGet } from "@/context/AuthContext";
import { useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { format, parseISO } from "date-fns";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']

const chartMargin = { top: 10, right: 30, left: 0, bottom: 0 }
const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '12px'
  },
  itemStyle: { color: 'hsl(var(--popover-foreground))' },
  labelStyle: { color: 'hsl(var(--popover-foreground))' },
  cursor: { fill: 'rgba(128,128,128,0.1)' }
}

export default function DashboardPage() {
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    activeShifts: 0,
    attendanceRate: 0,
    activeLocations: 0,
  });
  const [roleStats, setRoleStats] = useState([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const { toast } = useToast();
  const router = useRouter();


  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return false;
    }

    // Member tokens get 403 from the organization endpoints below.
    if (localStorage.getItem("user_role") === "employee") {
      router.replace("/member");
      return false;
    }

    try {
      const decodedToken = jwtDecode(token);

      if (!decodedToken.exp || Date.now() >= decodedToken.exp * 1000) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
        return false;
      }

      return true;
    } catch (error) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      router.push("/login");
      return false;
    }
  }, [router]);



  const fetchDashboardData = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      // One call for the whole dashboard (also used by the mobile app).
      const summary = await FastAPIGet("dashboard/summary");

      setDashboardStats({
        totalEmployees: summary.total_employees,
        activeShifts: summary.active_shifts,
        activeLocations: summary.office_locations,
        attendanceRate: summary.attendance_score,
      });

      // Most common designations first
      setRoleStats(
        summary.roles.slice(0, 4).map((role) => ({
          name: role.name,
          value: role.count,
        }))
      );

      // Share of employees who checked in, for each of the last 7 days
      setWeeklyAttendance(
        summary.weekly_attendance.map((day) => ({
          name: format(parseISO(day.date), "EEE"),
          attendance: day.percent,
          present: day.present,
        }))
      );
    } catch (error) {
      console.error(
        "Dashboard fetch error:",
        error.response?.status,
        error.response?.data || error.message
      );

      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
        return;
      }

      toast({
        title: "Dashboard error",
        description:
          error.response?.data?.detail ||
          "Unable to load dashboard data.",
        variant: "destructive",
      });
    }
  }, [verifyToken, router, toast]);


  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-background relative selection:bg-primary/30 lg:ml-[var(--sidebar-w)] transition-[margin] duration-300">
        <div className="p-6 lg:p-10 space-y-8 relative z-10 max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight page-title">Dashboard</h1>
              <p className="text-muted-foreground text-sm">Organization health today. Secure tomorrow.</p>
            </div>
          </div>

          {/* Quick Stats with Sparklines and Color Accents */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Attendance Score", value: `${dashboardStats.attendanceRate}%`, sub: "/100", color: "blue", trend: "Live Metric", icon: Building2 },
              { label: "Total Employees", value: dashboardStats.totalEmployees.toLocaleString(), sub: "Members", color: "blue", trend: "Database Count", icon: Users },
              { label: "Active Shifts", value: dashboardStats.activeShifts.toString(), sub: "Patterns", color: "orange", trend: "Current Config", icon: Clock },
              { label: "Active Locations", value: dashboardStats.activeLocations.toString(), sub: "Sites", color: "green", trend: "GPS Verified", icon: MapPin },
            ].map((stat, i) => (
              <Card key={i} className={`${i % 2 === 0 ? "stat-card-blue" : "stat-card-purple"} p-4`}>
                <div className="flex items-start justify-between">
                  <p className="text-base text-foreground">{stat.label}</p>
                  <div className={`p-2 rounded-lg ${i % 2 === 0 ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                  <span className="text-xs text-muted-foreground">{stat.sub}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{stat.trend}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Role Distribution (Donut Chart) */}
            <Card className="quantanex-card p-8 lg:col-span-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">Role Distribution</h3>
              <p className="text-xs text-muted-foreground mb-8">Breakdown of organizational roles</p>

              <div className="h-[250px] relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-foreground">{dashboardStats.totalEmployees}</span>
                  <span className="text-xs text-muted-foreground font-bold">Total</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleStats}
                      innerRadius={75}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {roleStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 mt-8">
                {roleStats.length > 0 ? roleStats.map((role, index) => (
                  <div key={role.name} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{role.name}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{role.value} ({(role.value / dashboardStats.totalEmployees * 100).toFixed(0)}%)</span>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground text-center">No data found</p>
                )}
              </div>
            </Card>

            {/* Weekly Attendance (Bar Chart) */}
            <Card className="quantanex-card p-8 lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Weekly Attendance</h3>
                  <p className="text-xs text-muted-foreground">Percentage of presence per day</p>
                </div>
                <Link href="/attendance">
                  <Button variant="link" className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors">
                    View full report →
                  </Button>
                </Link>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyAttendance}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(128,128,128,0.8)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      stroke="rgba(128,128,128,0.8)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(128,128,128,0.1)' }} />
                    <Bar
                      dataKey="attendance"
                      fill="url(#barGradient)"
                      radius={[20, 20, 20, 20]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
