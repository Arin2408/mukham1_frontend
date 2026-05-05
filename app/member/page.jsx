"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardMember from "@/components/DashboardMember";
import ProfileMember from "@/components/ProfileMember";
import { LogOut, User, LayoutDashboard } from "lucide-react";

export default function MemberPage() {
  const { logoutUser } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Member Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Member Portal</h1>
          </div>
          
          <Button variant="ghost" size="sm" onClick={logoutUser} className="gap-2 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <div className="flex justify-between items-center bg-card p-2 rounded-xl border shadow-sm">
              <TabsList className="bg-transparent gap-2">
                <TabsTrigger 
                  value="dashboard" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 rounded-lg transition-all"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 rounded-lg transition-all"
                >
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </TabsTrigger>
              </TabsList>
              
              <div className="hidden md:block px-4 text-sm text-muted-foreground italic">
                Welcome to your workspace
              </div>
            </div>

            <TabsContent value="dashboard" className="mt-0 ring-offset-background focus-visible:outline-none">
              <div className="rounded-xl overflow-hidden border bg-card shadow-lg min-h-[800px]">
                <DashboardMember />
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-0 ring-offset-background focus-visible:outline-none">
              <div className="rounded-xl overflow-hidden border bg-card shadow-lg min-h-[600px]">
                <ProfileMember />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="py-8 border-t text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Mukham. All rights reserved.
      </footer>
    </div>
  );
}