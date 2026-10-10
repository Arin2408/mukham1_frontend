"use client";



import { useState, useEffect, useCallback, Suspense } from "react";

import { useSearchParams } from "next/navigation";

import { FastAPI, FastAPIGet, useAuth } from "@/context/AuthContext";

import { useRouter } from "next/navigation";

import { jwtDecode } from "jwt-decode";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Header } from "@/components/Header";

import { Sidebar } from "@/components/Sidebar";

import {

  AlertDialog,

  AlertDialogContent,

  AlertDialogHeader,

  AlertDialogTitle,

  AlertDialogDescription,

  AlertDialogFooter,

  AlertDialogAction,

} from "@/components/ui/alert-dialog";

import { useToast } from "@/hooks/use-toast";



export default function ProfilePage() {

  return (

    <Suspense fallback={<div>Loading...</div>}>

      <ProfileContent />

    </Suspense>

  );

}



function ProfileContent() {

  const [isMounted, setIsMounted] = useState(false);

  const searchParams = useSearchParams();

  const isEmbed = searchParams.get("embed") === "true";



  useEffect(() => {

    setIsMounted(true);

  }, []);



  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { toast } = useToast();

  const { orgId, logoutUser, authChecked, user } = useAuth();



  const emptyData = {

    name: user?.name || "",

    email: user?.profile?.email || "",

    details: "",

    mobile: user?.mobile_number || ""

  };



  const [displayedOrganisation, setDisplayedOrganisation] = useState(emptyData);

  const [formData, setFormData] = useState({ ...emptyData, modified: false });



  // Update if user changes

  useEffect(() => {

    if (user?.name) {

      setDisplayedOrganisation(prev => ({

        ...prev,

        name: user.name,

        email: user.profile?.email || prev.email,

        mobile: user.mobile_number || prev.mobile

      }));

      setFormData(prev => ({

        ...prev,

        name: user.name,

        email: user.profile?.email || prev.email,

        mobile: user.mobile_number || prev.mobile

      }));

    }

  }, [user]);



  // Helper function to verify token and handle authentication issues

  const verifyToken = useCallback(async () => {

    const token = localStorage.getItem("access_token");

    if (!token) {

      if (typeof window !== "undefined" && (window.location.pathname === "/member" || window.self !== window.top)) {

        return true;

      }

      return false;

    }



    try {

      const decodedToken = jwtDecode(token);

      if (Date.now() >= decodedToken.exp * 1000) {

        localStorage.removeItem("access_token");

        return false;

      }



      await FastAPIGet("auth/verify");

      return true;

    } catch (error) {

      return false;

    }

  }, []);



  const fetchOrganisationDetails = useCallback(async () => {

    const token = localStorage.getItem("access_token");

    if (!token) return;



    try {

      // Prioritize embedded view for employees

      const isEmbeddedView = typeof window !== "undefined" && (window.self !== window.top || searchParams.get("embed") === "true");



      if (isEmbeddedView) {

        try {



          const profile = await FastAPIGet("employee-details");



          if (profile) {

            const formattedData = {

              name: `${profile.first_name} ${profile.last_name}`,

              email: profile.email || "",

              details: `${profile.designation_name || "Employee"} in ${profile.department_name || "N/A"

                }`,

              mobile: profile.mobile_number || "",

            };



            setDisplayedOrganisation(formattedData);

            setFormData({ ...formattedData, modified: false });

            return;

          }



        } catch (err) {

          console.error("Employee fetch failed", err);

        }

      }



      // Default/Fallback: Fetch Organisation Details

      if (orgId) {
        const orgData = await FastAPIGet(`organisations/${orgId}`);
        const formattedData = {
          name: orgData.name || "",
          email: orgData.email || "",
          details: orgData.details || "",
          mobile: user?.mobile_number || "",
        };

        setDisplayedOrganisation(formattedData);
        setFormData({ ...formattedData, modified: false });
      } else {

        throw new Error("No organization ID found");

      }

    } catch (error) {

      console.error("Failed to fetch profile details", error);

      toast({

        variant: "destructive",

        title: "Error",

        description: "Failed to load profile details.",

      });

    } finally {

      setIsLoading(false);

    }

  }, [orgId, toast, verifyToken]);



  useEffect(() => {

    fetchOrganisationDetails();

  }, [fetchOrganisationDetails, authChecked]);



  const handleInputChange = (field, value) => {

    setFormData((prev) => ({

      ...prev,

      [field]: value,

      modified: true,

    }));

  };



  const handleSaveChanges = async (e) => {

    e.preventDefault();

    if (!formData || !formData.modified) return;

    if (!(await verifyToken())) return;



    setIsLoading(true);



    try {

      // Update the organisation profile through FastAPI

      const { data: updatedData } = await FastAPI.put(`profile/${orgId}`, {
        name: formData.name,
        email: formData.email,
        details: formData.details,
      });



      setDisplayedOrganisation({

        name: updatedData.name,

        email: updatedData.email,

        details: updatedData.details,

      });



      setFormData({

        name: updatedData.name,

        email: updatedData.email,

        details: updatedData.details,

        modified: false,

      });



      toast({

        title: "Success",

        description: "Profile updated successfully!",

      });



      setShowSuccessDialog(true);

    } catch (error) {

      toast({

        variant: "destructive",

        title: "Error",

        description: error.response?.data?.detail || "Failed to update profile",

      });

    } finally {

      setIsLoading(false);

    }

  };



  useEffect(() => {

    const checkAuth = async () => {

      if (!(await verifyToken())) {

        router.push("/");

      }

    };

    checkAuth();

  }, [router, verifyToken]);



  useEffect(() => {

    fetchOrganisationDetails();

  }, [fetchOrganisationDetails]);



  const handleSuccessDialogClose = () => {

    setShowSuccessDialog(false);

  };



  if (isLoading) {

    return (

      <>

        {!isEmbed && <Header />}

        <div className="p-6 flex items-center justify-center min-h-screen">

          <div className="text-lg">Loading organization details...</div>

        </div>

      </>

    );

  }



  const hasChanges = formData?.modified;



  if (!isMounted) return null;



  return (

    <>

      <style jsx global>{`

        ${isEmbed ? 'body { overflow: hidden; }' : ''}

      `}</style>

      {!isEmbed && <Sidebar />}

      <div className="flex-1 lg:ml-[var(--sidebar-w)] transition-[margin] duration-300 relative z-10">

        <div className="p-6 lg:p-10">

          <div className="flex items-center gap-4 mb-8">

            <h1 className="text-2xl font-bold tracking-tight page-title">Organisation Profile</h1>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="quantanex-card border-foreground/5 col-span-1">

              <CardHeader>

                <CardTitle className="text-foreground">Information</CardTitle>

              </CardHeader>

              <CardContent className="flex flex-col items-center">

                <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-3xl font-bold text-foreground shadow-2xl shadow-primary/20 mb-6">

                  {displayedOrganisation.name.charAt(0)}

                </div>

                <h2 className="text-xl font-bold text-foreground mb-1">{displayedOrganisation.name}</h2>

                <p className="text-xs text-muted-foreground font-bold mb-6">{displayedOrganisation.email}</p>

                <Button variant="outline" className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 font-bold text-xs h-11" onClick={logoutUser}>

                  Terminate Session

                </Button>

              </CardContent>

            </Card>



            <Card className="quantanex-card border-foreground/5 col-span-1 md:col-span-2">

              <CardHeader>

                <CardTitle className="text-foreground tracking-tight text-lg">Edit Organisation</CardTitle>

              </CardHeader>

              <CardContent>

                <form className="space-y-6" onSubmit={handleSaveChanges}>

                  <div className="flex flex-wrap gap-6">

                    <div className="space-y-2 w-80">

                      <Label htmlFor="name" className="text-xs font-bold text-muted-foreground ml-1">Org Name</Label>

                      <Input

                        id="name"

                        className="bg-foreground/5 border-foreground/10 text-foreground h-11 focus:border-primary/50 transition-all"

                        value={formData.name}

                        onChange={(e) => handleInputChange("name", e.target.value)}

                      />

                    </div>

                    <div className="space-y-2 w-80">

                      <Label htmlFor="email" className="text-xs font-bold text-muted-foreground ml-1">Support Email</Label>

                      <Input

                        id="email"

                        type="email"

                        className="bg-foreground/5 border-foreground/10 text-foreground h-11 focus:border-primary/50 transition-all"

                        value={formData.email}

                        onChange={(e) => handleInputChange("email", e.target.value)}

                      />

                    </div>

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="details" className="text-xs font-bold text-muted-foreground ml-1">Org Details</Label>

                    <Input

                      id="details"

                      className="bg-foreground/5 border-foreground/10 text-foreground h-11 focus:border-primary/50 transition-all"

                      value={formData.details}

                      onChange={(e) => handleInputChange("details", e.target.value)}

                    />

                  </div>

                  <div className="flex justify-end pt-4">

                    <Button type="submit" disabled={isLoading || !hasChanges} className={`px-10 h-11 font-bold text-xs shadow-lg transition-all ${hasChanges ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20" : "bg-foreground/5 text-muted-foreground"

                      }`}>

                      {isLoading ? "Synchronizing..." : hasChanges ? "Save Changes" : "No Changes Detected"}

                    </Button>

                  </div>

                </form>

              </CardContent>

            </Card>

          </div>



          <AlertDialog open={showSuccessDialog} onOpenChange={handleSuccessDialogClose}>

            <AlertDialogContent>

              <AlertDialogHeader>

                <AlertDialogTitle>Profile Updated Successfully</AlertDialogTitle>

                <AlertDialogDescription>

                  Your organisation profile has been updated with the new information.

                </AlertDialogDescription>

              </AlertDialogHeader>

              <AlertDialogFooter>

                <AlertDialogAction onClick={handleSuccessDialogClose}>OK</AlertDialogAction>

              </AlertDialogFooter>

            </AlertDialogContent>

          </AlertDialog>

        </div>

      </div>

    </>

  );

}