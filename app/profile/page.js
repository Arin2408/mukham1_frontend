"use client";

import { useState, useEffect, useCallback } from "react";
import { AxiosPost, AxiosGet, useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
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
  const router = useRouter();
  const [displayedOrganisation, setDisplayedOrganisation] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { toast } = useToast();
 const { orgId, logoutUser } = useAuth(); // Add logoutUser here // Get orgId from AuthContext


  // Helper function to verify token and handle authentication issues
  const verifyToken = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast({

        variant: "destructive",
        title: "Error",
        description: "No token found. Please login again.",
      });
      router.push("/");
      return false;
    }

    try {
      const decodedToken = jwtDecode(token);
      if (Date.now() >= decodedToken.exp * 1000) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Session expired. Please login again.",
        });
        localStorage.removeItem("access_token");
        localStorage.removeItem("org_id");
        router.push("/");
        return false;
      }

      // Use AxiosPost from AuthContext
      await AxiosPost("token/verify/", { token });
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Invalid token",
      });
      localStorage.removeItem("access_token");
      localStorage.removeItem("org_id");
      router.push("/");
      return false;
    }
  };

  const fetchOrganisationDetails = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const orgData = await AxiosGet(`organisations/${orgId}/`);
      
      const formattedData = {
        name: orgData.name || "",
        email: orgData.email || "",
        details: orgData.details || "",
      };

      setDisplayedOrganisation(formattedData);
      setFormData({ ...formattedData, modified: false });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Failed to fetch organization details",
      });
    } finally {
      setIsLoading(false);
    }
  }, [orgId, router, toast]);

  useEffect(() => {
    fetchOrganisationDetails();
  }, [fetchOrganisationDetails]);

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
      // Using AxiosPost with PUT method
      const updatedData = await AxiosPost(
        `profile/${orgId}/`,
        {
          name: formData.name,
          email: formData.email,
          details: formData.details,
        },
        "PUT"
      );

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
}, [router]);

useEffect(() => {
  fetchOrganisationDetails();
}, [fetchOrganisationDetails]);

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading organization details...</div>
        </div>
      </>
    );
  }

  if (!displayedOrganisation || !formData) {
    return (
      <>
        <Header />
        <div className="p-6">
          <div className="mb-4 p-4 text-white bg-yellow-600 rounded-md">
            No organization data found. Please contact support.
          </div>
          <Button onClick={() => router.push("/")}>
            Return to Login
          </Button>
        </div>
      </>
    );
  }

  const hasChanges = formData.modified;

  return (
    <>
      <Header />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Organisation Profile</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Organisation Information</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>{displayedOrganisation.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{displayedOrganisation.name}</h2>
              <p className="text-sm text-muted-foreground">{displayedOrganisation.email}</p>
              <p className="text-sm text-muted-foreground">{displayedOrganisation.details}</p>
              <Button variant="outline" className="mt-4" onClick={logoutUser}>
      Logout
    </Button>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Edit Organisation</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSaveChanges}>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Details</Label>
                  <Input
                    id="details"
                    value={formData.details}
                    onChange={(e) => handleInputChange("details", e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={isLoading || !hasChanges}>
                  {isLoading ? "Saving..." : hasChanges ? "Save Changes" : "No Changes"}
                </Button>
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
    </>
  );
}