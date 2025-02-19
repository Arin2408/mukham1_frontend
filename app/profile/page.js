"use client";

import { useState, useEffect } from "react";
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

const getAccessToken = () => localStorage.getItem("access_token");

const verifyToken = async (token, setTokenStatus, router) => {
  if (!token) {
    setTokenStatus("No token found.");
    return false;
  }

  try {
    const decodedToken = jwtDecode(token);
    if (Date.now() >= decodedToken.exp * 1000) {
      setTokenStatus("Token expired.");
      localStorage.removeItem("access_token");
      router.push("/login");
      return false;
    }

    const response = await fetch("http://127.0.0.1:8000/api/token/verify/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.detail || "Invalid token");
    }

    return true;
  } catch (error) {
    console.log("Token verification error:", error);
    setTokenStatus("Invalid token.");
    localStorage.removeItem("access_token");
    router.push("/login");
    return false;
  }
};

export default function ProfilePage() {
  const router = useRouter();
  const [displayedOrganisation, setDisplayedOrganisation] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tokenStatus, setTokenStatus] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const fetchOrganisationDetails = async (token) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/organisations/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch organization");
      }
      
      const data = await response.json();
      // Check if data is an array and take the first item
      const orgData = Array.isArray(data) ? data[0] : data;
      
      const formattedData = {
        name: orgData?.name || "",
        email: orgData?.email || "",
        details: orgData?.details || ""
      };
      
      setDisplayedOrganisation(formattedData);
      setFormData({ ...formattedData, modified: false });
    } catch (error) {
      setErrorMessage(error.message);
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      modified: true
    }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!formData || !formData.modified) return;

    const token = getAccessToken();
    const isValid = await verifyToken(token, setTokenStatus, router);
    if (!isValid) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/organisations/update/", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          details: formData.details
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }

      const updatedData = await response.json();
      
      setDisplayedOrganisation({
        name: updatedData.name,
        email: updatedData.email,
        details: updatedData.details
      });
      
      setFormData({
        name: updatedData.name,
        email: updatedData.email,
        details: updatedData.details,
        modified: false
      });

      setSuccessMessage("Profile updated successfully!");
      setShowSuccessDialog(true);
    } catch (error) {
      setErrorMessage(error.message);
      console.error("Update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
  };

  useEffect(() => {
    const initialize = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        router.push("/login");
        return;
      }

      const isValid = await verifyToken(token, setTokenStatus, router);
      if (isValid) {
        await fetchOrganisationDetails(token);
      } else {
        setIsLoading(false);
      }
    };
    initialize();
  }, [router]);

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

  if (errorMessage && !displayedOrganisation) {
    return (
      <>
        <Header />
        <div className="p-6">
          <div className="mb-4 p-4 text-white bg-red-600 rounded-md">
            {errorMessage}
          </div>
          <Button onClick={() => router.push("/login")}>
            Return to Login
          </Button>
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
          <Button onClick={() => router.push("/login")}>
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

        {errorMessage && (
          <div className="mb-4 p-4 text-white bg-red-600 rounded-md">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 text-white bg-green-600 rounded-md">
            {successMessage}
          </div>
        )}

        {tokenStatus && (
          <div className={`mb-4 p-4 text-white ${tokenStatus.includes("valid") ? "bg-green-600" : "bg-red-600"} rounded-md`}>
            {tokenStatus}
          </div>
        )}

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