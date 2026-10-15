"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Bell, User, LayoutDashboard, Settings, Building2, Users, Clock, Network, CalendarCheck, ScanFace } from "lucide-react"

export function Header() {
  const [isEmbedded, setIsEmbedded] = useState(false)
  const { user, logoutUser } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const embedded = urlParams.get('embed') === 'true' || window.self !== window.top;
      setIsEmbedded(embedded);
    }
  }, []);

  if (isEmbedded) return null;

  const isMember = pathname.startsWith('/member') || pathname.startsWith('/dashboard2');

  const navItems = isMember 
    ? [
        { name: "Dashboard", href: "/member?tab=dashboard", icon: LayoutDashboard },
        { name: "My Tasks", href: "/member?tab=tasks", icon: CalendarCheck },
        { name: "Profile", href: "/member?tab=profile", icon: User },
      ]
    : [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Designation", href: "/designation", icon: Settings },
        { name: "Department", href: "/department", icon: Building2 },
        { name: "Employees", href: "/employees", icon: Users },
        { name: "Org Chart", href: "/org-chart", icon: Network },
        { name: "Tasks", href: "/tasks", icon: CalendarCheck },
        { name: "Location", href: "/geolocation", icon: Building2 },
        { name: "Shifts", href: "/shifts", icon: Clock },
        { name: "Profile", href: "/profile", icon: User },
      ];

  const userName = user?.name || "Member User";
  const userRole = isMember ? "Team Member" : "System Admin";
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 header-glass h-16">
      <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between gap-8">
        {/* Left Side: Brand */}
        <div className="flex items-center gap-8">
          <Link href={isMember ? "/member" : "/dashboard"} className="flex items-center gap-2">
            <div className="w-8 h-8 brand-tile rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ScanFace className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-500">Mukham</span>
          </Link>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex items-center gap-2 px-3 h-10 rounded-lg transition-all ${
                  pathname === item.href 
                    ? "bg-primary/10 text-primary hover:bg-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">{item.name}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right Side: Profile */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 pl-2 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground leading-none">{userName}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1 tracking-tight">{userRole}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold group-hover:scale-105 transition-all">
              {userInitials}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
