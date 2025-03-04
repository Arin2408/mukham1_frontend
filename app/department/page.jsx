"use client";

import { useState, useEffect, useCallback } from "react";
import { AxiosPost, AxiosGet, useAuth } from "@/context/AuthContext";
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
  const { orgId } = useAuth(); // Get orgId from AuthContext

  // Helper function to verify token and handle authentication issues
  const verifyToken = async () => {
    const token = localStorage.getItem("access_token");
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
        localStorage.removeItem("org_id");
        router.push("/login");
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
      router.push("/login");
      return false;
    }
  };

  const fetchDepartments = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const data = await AxiosGet("departments/");
      setDepartments(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to fetch departments",
      });
    }
  }, [router, toast]);

  const fetchOrganizations = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const data = await AxiosGet(`organisations/${orgId}/`);
      setOrganizations([data]); // Assuming the response is a single organization object

      // Set the organization name in the formData state
      setFormData((prev) => ({
        ...prev,
        org: { id: orgId, name: data.name },
      }));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to fetch organizations",
      });
    }
  }, [orgId, router, toast]);

  const fetchLocations = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const data = await AxiosGet("locations/");
      setLocations(data);
      if (data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          location: {
            id: data[0].location_id.toString(),
            name: data[0].location_name,
          },
        }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to fetch locations",
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
      setEditingDepartment((prev) => ({
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
    if (!(await verifyToken())) return;

    setIsLoading(true);
    try {
      await AxiosPost("departments/add/", {
        org: formData.org.id,
        details: formData.details,
        location: formData.location.id,
      });

      toast({
        title: "Success",
        description: "Department added successfully",
      });

      setFormData({
        org: { id: orgId, name: organizations[0]?.name || "" },
        details: "",
        location: { id: "", name: "" },
      });

      fetchDepartments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Failed to add department",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (isLoading || !editingDepartment) return;
    if (!(await verifyToken())) return;

    setIsLoading(true);
    try {
      // Using AxiosPost with PUT method (you might want to add AxiosPut to your AuthContext)
      await AxiosPost(
        `departments/update/${editingDepartment.department_id}/`,
        {
          org_id: parseInt(editingDepartment.org.id),
          details: editingDepartment.details,
          location_id: parseInt(editingDepartment.location.id),
        },
        "PUT"
      ); // Add an optional third parameter to specify method

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
        description:
          error.response?.data?.detail || "Failed to update department",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (departmentId) => {
    if (!(await verifyToken())) return;

    try {
      // Using AxiosPost with DELETE method (you might want to add AxiosDelete to your AuthContext)
      await AxiosPost(`departments/delete/${departmentId}/`, {}, "DELETE");

      toast({
        title: "Success",
        description: "Department deleted successfully",
      });

      fetchDepartments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to delete department",
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
                <Input
                  required
                  readOnly
                  placeholder="Enter organization name"
                  value={formData.org.name}
                  onChange={(e) =>
                    handleInputChange("org", {
                      id: orgId,
                      name: e.target.value,
                    })
                  }
                />
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
                      name:
                        locations.find(
                          (loc) => loc.location_id.toString() === value
                        )?.location_name || "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem
                        key={loc.location_id}
                        value={loc.location_id.toString()}
                      >
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
                <p className="text-muted-foreground text-center py-4">
                  No departments found
                </p>
              ) : (
                departments.map((dept) => (
                  <Card key={dept.department_id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-medium">{dept.details}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>
                              {organizations.find(
                                (org) => orgId === dept.org.toString()
                              )?.name || "Unknown Organization"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {locations.find(
                                (loc) =>
                                  loc.location_id.toString() ===
                                  dept.location.toString()
                              )?.location_name || "Unknown Location"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                setEditingDepartment({
                                  ...dept,
                                  org: {
                                    id: dept.org.toString(),
                                    name: organizations.find(
                                      (org) => orgId === dept.org.toString()
                                    )?.name,
                                  },
                                  location: {
                                    id: dept.location.toString(),
                                    name: locations.find(
                                      (loc) =>
                                        loc.location_id.toString() ===
                                        dept.location.toString()
                                    )?.location_name,
                                  },
                                })
                              }
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
                                <label className="text-sm font-medium">
                                  Organization
                                </label>
                                <Select
                                  value={editingDepartment?.org.id}
                                  onValueChange={(value) =>
                                    handleInputChange("org", {
                                      id: value,
                                      name:
                                        organizations.find(
                                          (org) => orgId === value
                                        )?.name || "",
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select organization" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {organizations.map((org) => (
                                      <SelectItem key={orgId} value={orgId}>
                                        {org.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Department Name
                                </label>
                                <Input
                                  value={editingDepartment?.details}
                                  onChange={(e) =>
                                    handleInputChange("details", e.target.value)
                                  }
                                  placeholder="Enter department name"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Location
                                </label>
                                <Select
                                  value={editingDepartment?.location.id}
                                  onValueChange={(value) =>
                                    handleInputChange("location", {
                                      id: value,
                                      name:
                                        locations.find(
                                          (loc) =>
                                            loc.location_id.toString() === value
                                        )?.location_name || "",
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {locations.map((loc) => (
                                      <SelectItem
                                        key={loc.location_id}
                                        value={loc.location_id.toString()}
                                      >
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
                                  {isLoading
                                    ? "Updating..."
                                    : "Update Department"}
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
                              <AlertDialogTitle>
                                Delete Department
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this department?
                                This action cannot be undone.
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
