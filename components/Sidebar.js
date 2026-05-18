"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Settings, 
  Building2, 
  Users, 
  Clock, 
  User, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react"

export function Sidebar() {
  const [isEmbedded, setIsEmbedded] = useState(false)
  const { user, logoutUser } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
        { name: "Profile", href: "/member?tab=profile", icon: User },
      ]
    : [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Attendance", href: "/attendance", icon: Clock },
        { name: "Designation", href: "/designation", icon: Settings },
        { name: "Department", href: "/department", icon: Building2 },
        { name: "Employees", href: "/employees", icon: Users },
        { name: "Location", href: "/geolocation", icon: Building2 },
        { name: "Shifts", href: "/shifts", icon: Clock },
        { name: "Profile", href: "/profile", icon: User },
      ];

  const userName = user?.name || "Member User";
  const userRole = isMember ? "Team Member" : "System Admin";
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-4 left-4 z-[60] lg:hidden bg-[#02040a]/80 backdrop-blur-xl border border-white/10 text-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Zap className={`h-6 w-6 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`fixed top-0 left-0 bottom-0 w-64 bg-[#02040a]/80 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
      {/* Brand Header */}
      <div className="p-8">
        <Link href={isMember ? "/member" : "/dashboard"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter uppercase">Mukham</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Main Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button 
                variant="ghost" 
                className={`w-full justify-between px-4 h-12 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "group-hover:text-primary transition-colors"}`} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{item.name}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-primary" />}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 mt-auto border-t border-white/5">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">{userRole}</p>
            </div>
          </div>
          <Button 
            onClick={logoutUser}
            variant="ghost" 
            className="w-full h-10 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-400 gap-2 font-bold uppercase tracking-widest text-[9px]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      </div>
    </>
  )
}
