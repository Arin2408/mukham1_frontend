"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { jwtDecode } from "jwt-decode";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";

// Utility function to get access token from localStorage
const getAccessToken = () => localStorage.getItem("access_token");

// Function to verify the token
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

    // Send token as form data
    const response = await fetch("http://127.0.0.1:8000/api/token/verify/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.detail || "Invalid token");
    }

    setTokenStatus("Token is valid.");
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
  const [organisation, setOrganisation] = useState(null); // Initialize as null
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tokenStatus, setTokenStatus] = useState("");

  // Fetch organization details
  const fetchOrganisationDetails = async (token) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/organisations/", { // Changed endpoint
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to fetch organization");
      
      const data = await response.json();
      setOrganisation({
        name: data.name || "",
        email: data.email || "",
        details: data.details || ""
      });
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Handle form submission
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!organisation) return;

    const token = getAccessToken();
    const isValid = await verifyToken(token, setTokenStatus, router);
    if (!isValid) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/organisations/", { // Changed endpoint
        method: "PUT", // Changed to PUT for updates
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(organisation),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();
      setSuccessMessage("Profile updated successfully!");
      setOrganisation({
        name: data.name || "",
        email: data.email || "",
        details: data.details || ""
      });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial checks and data fetch
  useEffect(() => {
    const initialize = async () => {
      const token = getAccessToken();
      const isValid = await verifyToken(token, setTokenStatus, router);
      if (isValid) {
        await fetchOrganisationDetails(token);
      }
    };
    initialize();
  }, [router]);

  if (!organisation) {
    return <div className="p-6">Loading...</div>;
  }

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
              {organisation && (
                <>
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>{organisation.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">{organisation.name}</h2>
                  <p className="text-sm text-muted-foreground">{organisation.email}</p>
                  <p className="text-sm text-muted-foreground">{organisation.details}</p>
                </>
              )}
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
                    value={organisation.name}
                    onChange={(e) =>
                      setOrganisation({ ...organisation, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={organisation.email}
                    onChange={(e) =>
                      setOrganisation({ ...organisation, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Details</Label>
                  <Input
                    id="details"
                    value={organisation.details}
                    onChange={(e) =>
                      setOrganisation({ ...organisation, details: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}