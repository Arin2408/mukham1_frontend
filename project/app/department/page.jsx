"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

const getAccessToken = () => localStorage.getItem("access_token");

// Token verification function
const verifyToken = async (token, router, toast) => {
  if (!token) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "No token found. Please login again.",
    });
    router.push("/login");
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
      router.push("/login");
      return false;
    }

    const response = await fetch("http://127.0.0.1:8000/api/token/verify/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Invalid token");
    }

    return true;
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message,
    });
    localStorage.removeItem("access_token");
    router.push("/login");
    return false;
  }
};

export default function DepartmentPage() {
  const [formData, setFormData] = useState({
    org: { id: "", name: "" },
    details: "",
    location: { id: "", name: "" },
  });

  const [departments, setDepartments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [tokenStatus, setTokenStatus] = useState(""); // Added token status
  const toast = useToast();
  const router = useRouter(); // Initialized useRouter

  // Fetch Organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const tokenValid = await verifyToken(token, setTokenStatus, router, toast);
      if (!tokenValid) return;

      try {
        const response = await fetch("http://127.0.0.1:8000/api/organisations/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch organizations");

        const data = await response.json();
        setOrganizations(data); // Correctly update the state
        if (data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            org: { id: data[0].org_id, name: data[0].name },
          }));
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    };

    fetchOrganizations();
  }, [router, toast]);

  // Fetch Locations
  useEffect(() => {
    const fetchLocations = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const tokenValid = await verifyToken(token, setTokenStatus, router, toast);
      if (!tokenValid) return;

      try {
        const response = await fetch("http://127.0.0.1:8000/api/locations/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch locations");

        const data = await response.json();
        setLocations(data); // Correctly update the state
        if (data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            location: { id: data[0].location_id, name: data[0].location_name },
          }));
        }
      } catch (error) {
        // toast({
        //   variant: "destructive",
        //   title: "Error",
        //   description: error.message,
        // });
      }
    };

    fetchLocations();
  }, [router, toast]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAccessToken();
  
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No token found. Please login again.",
      });
      router.push("/login");
      return;
    }
  
    const tokenValid = await verifyToken(token, setTokenStatus, router, toast);
    if (!tokenValid) return;
  
    try {
      const response = await fetch("http://127.0.0.1:8000/api/departments/add/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          org: formData.org.id,
          details: formData.details,
          location: formData.location_id,
        }),
      });
  
      if (!response.ok) throw new Error("Failed to add department");
  
      const newDepartment = await response.json();
      setDepartments((prev) => [...prev, newDepartment]);
  
      setFormData({
        org: { id: "", name: "" },
        details: "",
        location: { id: "", name: "" },
      });
    } catch (error) {
      // toast({
      //   variant: "destructive",
      //   title: "Error",
      //   description: error.message,
      // });
    }
  };

  return (
    <>
      <Header />
      <div className="p-6 space-y-8">
        <h1 className="text-3xl font-bold">Department Management</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Department</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization</label>
                <Select
                  required
                  value={formData.org.id}
                  onValueChange={(value) =>
                    handleInputChange("org", {
                      id: value,
                      name: organizations.find((org) => org.org_id.toString() === value)?.name || "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.org_id} value={org.org_id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Department Name</label>
                <Input
                  required
                  value={formData.details}
                  onChange={(e) => handleInputChange("details", e.target.value)}
                  placeholder="Enter department name"
                />
              </div>

              {/* Location Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select
                  required
                  value={formData.location.id}
                  onValueChange={(value) =>
                    handleInputChange("location", {
                      id: value,
                      name: locations.find((loc) => loc.location_id.toString() === value)?.location_name || "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.location_id} value={loc.location_id.toString()}>
                        {loc.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Add Department
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
