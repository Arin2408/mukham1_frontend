"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, Home } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const showBackButton = pathname !== "/" && pathname !== "/dashboard"

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="mr-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/designation">
            <Button variant="ghost" size="sm" className={pathname === "/designation" ? "bg-muted" : ""}>
              Designation
            </Button>
          </Link>
          <Link href="/department">
            <Button variant="ghost" size="sm" className={pathname === "/department" ? "bg-muted" : ""}>
              Department
            </Button>
          </Link>
          <Link href="/employees">
            <Button variant="ghost" size="sm" className={pathname === "/employees" ? "bg-muted" : ""}>
              Employees
            </Button>
          </Link>
          <Link href="/geolocation">
            <Button variant="ghost" size="sm" className={pathname === "/geolocation" ? "bg-muted" : ""}>
              Location
            </Button>
          </Link>
          <Link href="/roles">
            <Button variant="ghost" size="sm" className={pathname === "/roles" ? "bg-muted" : ""}>
              Roles
            </Button>
          </Link>
          <Link href="/attendance">
            <Button variant="ghost" size="sm" className={pathname === "/attendance" ? "bg-muted" : ""}>
              Attendance
            </Button>
          </Link>
          <Link href="/shifts">
            <Button variant="ghost" size="sm" className={pathname === "/shifts" ? "bg-muted" : ""}>
              Shifts
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" size="sm" className={pathname === "/profile" ? "bg-muted" : ""}>
              Profile
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className={pathname === "/" ? "bg-muted" : ""}>
              Log Out
            </Button>
          </Link>
        </nav>
      </div>
    </div>
  )
}