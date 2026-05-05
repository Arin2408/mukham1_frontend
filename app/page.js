import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Clock, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Mukham Organization Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Streamline your organizational tasks with our comprehensive management platform.
              Handle roles, attendance, and shifts efficiently in one place.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/login">
                <Button size="lg">
                  Login as Organization
                </Button>
              </Link>
              <Link href="/member-login">
                <Button size="lg">
                  Login as Member
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg">
                  Create an Organisation
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="ghost" size="lg">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Manage Better</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to run your organization
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
              {/* Role Management */}
              <Card className="p-8">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Role Management</h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Create and manage organizational roles with specific permissions.
                  Easily assign roles to team members and track responsibilities.
                </p>
              </Card>

              {/* Attendance Tracking */}
              <Card className="p-8">
                <div className="flex items-center gap-4">
                  <Clock className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Attendance Tracking</h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Monitor attendance in real-time with our advanced tracking system.
                  Generate reports and analyze attendance patterns.
                </p>
              </Card>

              {/* Shift Management */}
              <Card className="p-8">
                <div className="flex items-center gap-4">
                  <Building2 className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Shift Management</h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Schedule and manage shifts efficiently with our intuitive interface.
                  Keep your team organized and informed.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}