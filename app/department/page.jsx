"use client";

import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Pencil, Trash2 } from "lucide-react";

const getAccessToken = () => localStorage.getItem("access_token");

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

  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchDepartments = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const tokenValid = await verifyToken(token, router, toast);
    if (!tokenValid) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/departments/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch departments");

      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }, [router, toast]);

  const fetchOrganizations = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const tokenValid = await verifyToken(token, router, toast);
    if (!tokenValid) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/organisations/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch organizations");

      const data = await response.json();
      setOrganizations(data);
      if (data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          org: { id: data[0].org_id.toString(), name: data[0].name },
        }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }, [router, toast]);

  const fetchLocations = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const tokenValid = await verifyToken(token, router, toast);
    if (!tokenValid) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/locations/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch locations");

      const data = await response.json();
      setLocations(data);
      if (data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          location: { 
            id: data[0].location_id.toString(), 
            name: data[0].location_name 
          },
        }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }, [router, toast]);

  useEffect(() => {
    fetchOrganizations();
    fetchLocations();
    fetchDepartments();
  }, [fetchOrganizations, fetchLocations, fetchDepartments]);

  const handleInputChange = (field, value) => {
    if (editingDepartment) {
      setEditingDepartment(prev => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

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

    const tokenValid = await verifyToken(token, router, toast);
    if (!tokenValid) return;

    setIsLoading(true);
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
          location: formData.location.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to add department");

      toast({
        title: "Success",
        description: "Department added successfully",
      });

      setFormData({
        org: { id: "", name: "" },
        details: "",
        location: { id: "", name: "" },
      });
      
      fetchDepartments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (isLoading || !editingDepartment) return;

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

    const tokenValid = await verifyToken(token, router, toast);
    if (!tokenValid) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/departments/update/${editingDepartment.department_id}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          org_id: parseInt(editingDepartment.org.id),
          details: editingDepartment.details,
          location_id: parseInt(editingDepartment.location.id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update department");
      }

      toast({
        title: "Success",
        description: "Department updated successfully",
      });

      setEditingDepartment(null);
      fetchDepartments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (departmentId) => {
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

    const tokenValid = await verifyToken(token, router, toast);
    if (!tokenValid) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/departments/delete/${departmentId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete department");
      }

      toast({
        title: "Success",
        description: "Department deleted successfully",
      });

      fetchDepartments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization</label>
                <Select
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Department Name</label>
                <Input
                  value={formData.details}
                  onChange={(e) => handleInputChange("details", e.target.value)}
                  placeholder="Enter department name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select
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

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Adding..." : "Add Department"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Departments List</h2>
            <div className="space-y-4">
              {departments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No departments found</p>
              ) : (
                departments.map((dept) => (
                  <Card key={dept.department_id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-medium">{dept.details}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{organizations.find(org => org.org_id.toString() === dept.org.toString())?.name || 'Unknown Organization'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{locations.find(loc => loc.location_id.toString() === dept.location.toString())?.location_name || 'Unknown Location'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditingDepartment({
                                ...dept,
                                org: {
                                  id: dept.org.toString(),
                                  name: organizations.find(org => org.org_id.toString() === dept.org.toString())?.name
                                },
                                location: {
                                  id: dept.location.toString(),
                                  name: locations.find(loc => loc.location_id.toString() === dept.location.toString())?.location_name
                                }
                              })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Department</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleEdit} className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Organization</label>
                                <Select
                                  value={editingDepartment?.org.id}
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

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Department Name</label>
                                <Input
                                  value={editingDepartment?.details}
                                  onChange={(e) => handleInputChange("details", e.target.value)}
                                  placeholder="Enter department name"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Location</label>
                                <Select
                                  value={editingDepartment?.location.id}
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

                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button" variant="outline">
                                    Cancel
                                  </Button>
                                </DialogClose>
                                <Button type="submit" disabled={isLoading}>
                                  {isLoading ? "Updating..." : "Update Department"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Department</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this department? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(dept.department_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}