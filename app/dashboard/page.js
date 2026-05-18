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
import { AxiosGet, AxiosPost } from "@/context/AuthContext";
import { useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

const attendanceData = [
  { name: "Mon", attendance: 85 },
  { name: "Tue", attendance: 90 },
  { name: "Wed", attendance: 88 },
  { name: "Thu", attendance: 92 },
  { name: "Fri", attendance: 87 },
]

const shiftData = [
  { name: "Week 1", employees: 150 },
  { name: "Week 2", employees: 158 },
  { name: "Week 3", employees: 165 },
  { name: "Week 4", employees: 172 },
]

const roleDistribution = [
  { name: "Managers", value: 20 },
  { name: "Team Leads", value: 35 },
  { name: "Developers", value: 85 },
  { name: "Support", value: 40 },
]

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']

const chartMargin = { top: 10, right: 30, left: 0, bottom: 0 }
const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#11141b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '12px'
  },
  itemStyle: { color: '#fff' },
  labelStyle: { color: '#fff' },
  cursor: { fill: 'rgba(255,255,255,0.05)' }
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
    try {
      const decodedToken = jwtDecode(token);
      if (Date.now() >= decodedToken.exp * 1000) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return false;
      }
      await AxiosPost("token/verify/", { token });
      return true;
    } catch (error) {
      router.push("/login");
      return false;
    }
  }, [router]);

  const fetchDashboardData = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      // 1. Fetch Employees
      const employees = await AxiosGet("list/");
      
      // 2. Fetch Shifts
      const shifts = await AxiosGet("shifts/");

      // 3. Fetch Locations
      const locations = await AxiosGet("locations/");

      // 4. Fetch Attendance Leaderboard (for average rate)
      const leaderboard = await AxiosGet("departments/leaderboard/");
      const avgRate = leaderboard.length > 0 
        ? leaderboard.reduce((acc, curr) => acc + curr.punctuality_score, 0) / leaderboard.length 
        : 0;

      setDashboardStats({
        totalEmployees: employees.length,
        activeShifts: shifts.length,
        activeLocations: locations.length,
        attendanceRate: Math.round(avgRate)
      });

      // Calculate Role Distribution from actual employees
      const distribution = {};
      employees.forEach(emp => {
        const role = emp.designation_name || "Unassigned";
        distribution[role] = (distribution[role] || 0) + 1;
      });
      
      const roleArray = Object.keys(distribution).map(name => ({
        name,
        value: distribution[name]
      }));
      setRoleStats(roleArray.slice(0, 4)); // Top 4 roles

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  }, [verifyToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-[#0b0e14] relative selection:bg-primary/30 ml-64">
        <div className="p-6 lg:p-10 space-y-8 relative z-10 max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
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
              <Card key={i} className="quantanex-card p-6 group relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-accent-${stat.color}-10 border border-${stat.color}-500/20`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                    <div className="flex items-baseline justify-end gap-1">
                      <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                      <span className="text-xs text-muted-foreground">{stat.sub}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                   <p className={`text-[10px] font-bold uppercase ${stat.color === 'red' ? 'text-red-500' : 'text-green-500'}`}>
                    {stat.trend}
                  </p>
                  {/* Miniature Sparkline Placeholder Accent */}
                  <div className={`mt-1 h-1 w-full rounded-full sparkline-${stat.color === 'red' ? 'red' : 'blue'} opacity-50`} />
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Role Distribution (Donut Chart) */}
            <Card className="quantanex-card p-8 lg:col-span-1">
              <h3 className="text-lg font-semibold text-white mb-1">Role Distribution</h3>
              <p className="text-xs text-muted-foreground mb-8">Breakdown of organizational roles</p>
              
              <div className="h-[250px] relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-white">{dashboardStats.totalEmployees}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total</span>
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
                      <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">{role.name}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{role.value} ({(role.value/dashboardStats.totalEmployees*100).toFixed(0)}%)</span>
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
                  <h3 className="text-lg font-semibold text-white mb-1">Weekly Attendance</h3>
                  <p className="text-xs text-muted-foreground">Percentage of presence per day</p>
                </div>
                <Link href="/attendance">
                  <Button variant="link" className="text-[#4f46e5] text-xs font-bold uppercase tracking-widest hover:text-[#4338ca] transition-colors">
                    View full report →
                  </Button>
                </Link>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name"
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip {...tooltipStyle} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
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
