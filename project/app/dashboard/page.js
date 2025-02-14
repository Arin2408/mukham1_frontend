"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Clock, Users, Calendar, ArrowUpRight, ArrowDown, ArrowUp, UserPlus } from "lucide-react"
import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import Link from "next/link"
import { Header } from '@/components/Header';

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
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    padding: '8px'
  }
}

export default function DashboardPage() {
  const [stats] = useState({
    totalEmployees: 180,
    activeShifts: 12,
    attendanceRate: "89%",
    newHires: 8,
  })

  return (
    <>
    <Header/>
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="space-x-2">
          {/* <Link href="/roles">
            <Button variant="outline">Manage Roles</Button>
          </Link>
          <Link href="/shifts">
            <Button>Create Shift</Button>
          </Link> */}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{stats.totalEmployees}</h3>
                <span className="text-sm text-green-500 flex items-center">
                  <ArrowUp className="h-4 w-4" />
                  4.5%
                </span>
              </div>
            </div>
            <Users className="h-8 w-8 text-primary opacity-75" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Shifts</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{stats.activeShifts}</h3>
                <span className="text-sm text-green-500 flex items-center">
                  <ArrowUp className="h-4 w-4" />
                  2.1%
                </span>
              </div>
            </div>
            <Clock className="h-8 w-8 text-primary opacity-75" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{stats.attendanceRate}</h3>
                <span className="text-sm text-red-500 flex items-center">
                  <ArrowDown className="h-4 w-4" />
                  1.2%
                </span>
              </div>
            </div>
            <Building2 className="h-8 w-8 text-primary opacity-75" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">New Hires</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{stats.newHires}</h3>
                <span className="text-sm text-green-500 flex items-center">
                  <ArrowUp className="h-4 w-4" />
                  3.2%
                </span>
              </div>
            </div>
            <UserPlus className="h-8 w-8 text-primary opacity-75" />
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Weekly Attendance</h3>
            <Link href="/attendance">
              <Button variant="ghost" size="sm">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Details
              </Button>
            </Link>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="name"
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
                />
                <Tooltip {...tooltipStyle} />
                <Bar 
                  dataKey="attendance" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Shift Trends */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Shift Trends</h3>
            <Link href="/shifts">
              <Button variant="ghost" size="sm">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Details
              </Button>
            </Link>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={shiftData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="name"
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
                />
                <Tooltip {...tooltipStyle} />
                <Line 
                  type="monotone" 
                  dataKey="employees" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Role Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Role Distribution</h3>
            <Link href="/roles">
              <Button variant="ghost" size="sm">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Details
              </Button>
            </Link>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={chartMargin}>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {roleDistribution.map((role, index) => (
              <div key={role.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-muted-foreground">{role.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        {/* <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/attendance">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Mark Attendance
              </Button>
            </Link>
            <Link href="/shifts">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                View Shifts
              </Button>
            </Link>
            <Link href="/roles">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Roles
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                View Profile
              </Button>
            </Link>
          </div>
        </Card> */}
      </div>
    </div>
    </>
  )
}