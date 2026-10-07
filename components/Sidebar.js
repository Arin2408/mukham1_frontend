"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Building2,
  Users,
  Clock,
  User,
  LogOut,
  ScanFace,
  Menu,
  MapPin,
  Briefcase,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun
} from "lucide-react"

const SIDEBAR_WIDTH = "14rem"
const SIDEBAR_WIDTH_COLLAPSED = "5rem"
const COLLAPSED_STORAGE_KEY = "sidebar-collapsed"

export function Sidebar() {
  const [isEmbedded, setIsEmbedded] = useState(false)
  const { user, logoutUser } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const embedded = urlParams.get('embed') === 'true' || window.self !== window.top;
      setIsEmbedded(embedded);
    }
  }, []);

  // Restore the collapsed preference
  useEffect(() => {
    setIsMounted(true);
    try {
      setIsCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true");
    } catch {}
  }, []);

  // Pages offset their content by --sidebar-w
  useEffect(() => {
    const width = isEmbedded ? "0px" : isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;
    document.documentElement.style.setProperty("--sidebar-w", width);
  }, [isCollapsed, isEmbedded]);

  // Leave room for the mobile top bar on pages that use the sidebar
  useEffect(() => {
    if (isEmbedded) return;
    document.body.classList.add("with-app-sidebar");
    return () => document.body.classList.remove("with-app-sidebar");
  }, [isEmbedded]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(!prev));
      } catch {}
      return !prev;
    });
  };

  const isDark = !isMounted || resolvedTheme !== "light";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

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
        { name: "Designation", href: "/designation", icon: Briefcase },
        { name: "Department", href: "/department", icon: Building2 },
        { name: "Employees", href: "/employees", icon: Users },
        { name: "Location", href: "/geolocation", icon: MapPin },
        { name: "Shifts", href: "/shifts", icon: CalendarClock },
        { name: "Profile", href: "/profile", icon: User },
      ];

  const userName = user?.name || "Member User";
  const userRole = isMember ? "Team Member" : "System Admin";
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  // Collapsing only applies on desktop; the mobile drawer is always full width
  const collapsed = isCollapsed && !isMobileMenuOpen;

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-[60] h-14 flex items-center justify-between gap-3 px-3 bg-background/85 backdrop-blur-md border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="h-10 w-10 text-foreground hover:bg-foreground/10"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href={isMember ? "/member" : "/dashboard"} className="flex items-center gap-2">
          <div className="w-8 h-8 brand-tile rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <ScanFace className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-blue-500">Mukham</span>
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="h-10 w-10 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </header>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`fixed top-0 left-0 bottom-0 bg-sidebar border-r border-sidebar-border z-[70] lg:z-50 flex flex-col text-sidebar-foreground transition-[width,transform] duration-300 lg:translate-x-0 ${
        collapsed ? "w-56 lg:w-20" : "w-56"
      } ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
      {/* Brand Header */}
      <div className="px-4 pt-6 pb-4 border-b border-sidebar-border">
        <div className={`flex items-center ${collapsed ? "lg:flex-col lg:gap-3" : "justify-between"}`}>
          <Link href={isMember ? "/member" : "/dashboard"} className="flex items-center gap-3 px-1 min-w-0">
            <div className="w-9 h-9 shrink-0 brand-tile rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ScanFace className="h-5 w-5 text-white" />
            </div>
            <span className={`text-xl font-bold text-blue-500 ${collapsed ? "lg:hidden" : ""}`}>Mukham</span>
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* User card */}
        {collapsed ? (
          <div
            title={`${userName} · ${userRole}`}
            className="hidden lg:flex mt-5 mx-auto w-10 h-10 rounded-full items-center justify-center bg-blue-500/10 border border-blue-500/30 text-blue-500 text-sm font-semibold"
          >
            {userInitials}
          </div>
        ) : null}
        <div className={`mt-5 p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 ${collapsed ? "lg:hidden" : ""}`}>
          <p className="text-base font-semibold text-foreground truncate">{userName}</p>
          <p className="text-xs text-muted-foreground truncate">{userRole}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 pt-4 space-y-1 overflow-y-auto overflow-x-hidden">
        <p className={`px-2 pb-2 text-xs font-medium text-muted-foreground/70 uppercase ${collapsed ? "lg:text-center lg:px-0" : ""}`}>Main</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="block" title={collapsed ? item.name : undefined}>
              <Button
                variant="ghost"
                className={`w-full gap-3 h-10 rounded-lg text-sm font-medium transition-colors ${
                  collapsed ? "justify-start px-3 lg:justify-center lg:px-0" : "justify-start px-3"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-500 hover:text-blue-500 hover:bg-blue-500/10"
                    : "text-sidebar-foreground hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={collapsed ? "lg:hidden" : ""}>{item.name}</span>
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className={`flex items-center gap-2 p-2 rounded-lg bg-foreground/5 ${collapsed ? "lg:justify-center" : ""}`}>
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
          >
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <span className={`text-sm text-muted-foreground ${collapsed ? "lg:hidden" : ""}`}>
            {isDark ? "Dark mode" : "Light mode"}
          </span>
        </div>
        <Button
          onClick={logoutUser}
          variant="ghost"
          title={collapsed ? "Sign Out" : undefined}
          className={`w-full gap-3 h-10 rounded-md bg-foreground/5 border border-foreground/10 text-sm font-normal text-sidebar-foreground hover:bg-foreground/10 hover:text-foreground ${
            collapsed ? "justify-start px-4 lg:justify-center lg:px-0" : "justify-start px-4"
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={collapsed ? "lg:hidden" : ""}>Sign Out</span>
        </Button>
      </div>
      </div>
    </>
  )
}
