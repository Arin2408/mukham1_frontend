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
import { Sidebar } from "@/components/Sidebar";
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
  const [leaderboard, setLeaderboard] = useState([]);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const { orgId } = useAuth(); // Get orgId from AuthContext

  // Helper function to verify token and handle authentication issues
  const verifyToken = useCallback(async () => {
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
  }, [router, toast]);

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
  }, [toast, verifyToken]);

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
  }, [orgId, toast, verifyToken]);

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
  }, [toast, verifyToken]);

  const fetchLeaderboard = useCallback(async () => {
    if (!(await verifyToken())) return;
    try {
      const data = await AxiosGet("departments/leaderboard/");
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to fetch leaderboard", error);
    }
  }, [verifyToken]);

  const fetchShifts = useCallback(async () => {
    if (!(await verifyToken())) return;
    try {
      const data = await AxiosGet("shifts/");
      setAvailableShifts(data);
    } catch (error) {
      console.error("Failed to fetch shifts", error);
    }
  }, [verifyToken]);

  useEffect(() => {
    fetchOrganizations();
    fetchLocations();
    fetchDepartments();
    fetchLeaderboard();
    fetchShifts();
  }, [fetchOrganizations, fetchLocations, fetchDepartments, fetchLeaderboard, fetchShifts]);

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

  const handleBulkAssignShift = async (departmentId) => {
    if (!selectedShiftId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a shift" });
      return;
    }
    if (!(await verifyToken())) return;

    setIsLoading(true);
    try {
      await AxiosPost("bulk-assign/", {
        department_id: departmentId,
        shift_id: selectedShiftId
      });
      toast({ title: "Success", description: "Shift assigned to all department employees" });
      setSelectedShiftId("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Failed to assign shift",
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
      <Sidebar />
      <div className="lg:ml-[var(--sidebar-w)] transition-[margin] duration-300 p-6 lg:p-10 space-y-8 min-h-screen bg-background">
        <h1 className="text-2xl font-bold tracking-tight page-title">Department Management</h1>

        {/* 🏆 Attendance Leaderboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="quantanex-card p-6 col-span-1 md:col-span-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-6 bg-yellow-500 rounded-full" />
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Attendance Leaderboard
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {leaderboard.map((item, index) => (
                <div key={item.department_id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border hover:border-yellow-500/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold  text-foreground/20 group-hover:text-yellow-500/40 transition-colors"> </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.department_name}</p>
                      <p className="text-xs text-muted-foreground">{item.total_attendances} Records</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-500">{item.punctuality_score}%</p>
                    <p className="text-xs text-muted-foreground tracking-tight">Punctuality</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-8">
          <Card className="p-8">
            <h2 className="text-lg font-semibold mb-6">Add New Department</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization</label>
                <Input
                  required
                  readOnly
                  placeholder="Enter organization name"
                  value={formData.org.name}
                  className="h-11 bg-foreground/5 border-foreground/10 w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department Name</label>
                <Input
                  value={formData.details}
                  onChange={(e) => handleInputChange("details", e.target.value)}
                  placeholder="Enter department name"
                  className="h-11 bg-foreground/5 border-foreground/10 w-full"
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
                  <SelectTrigger className="h-11 bg-foreground/5 border-foreground/10 w-full">
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

              <Button type="submit" disabled={isLoading} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/10">
                {isLoading ? "Adding..." : "Add Department"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">Departments List</h2>
            <div className="space-y-4">
              {departments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No departments found
                </p>
              ) : (
                departments.map((dept) => (
                  <Card key={dept.department_id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="space-y-2 min-w-0">
                        <h3 className="font-medium break-words">{dept.details}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {/* 📅 Bulk Shift Assignment Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all text-xs font-bold">
                              Assign Shift
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-foreground/10">
                            <DialogHeader>
                              <DialogTitle className="text-foreground">Bulk Assign Shift: {dept.details}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Select a shift to apply to ALL employees currently in the <span className="text-foreground font-bold">{dept.details}</span> department.
                              </p>
                              <Select onValueChange={setSelectedShiftId}>
                                <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground h-12">
                                  <SelectValue placeholder="Choose a Shift" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableShifts.filter(s => s.department === dept.department_id).map(shift => (
                                    <SelectItem key={shift.shift_id} value={shift.shift_id.toString()}>
                                      {shift.shift_name} ({shift.shift_start_time} - {shift.shift_end_time})
                                    </SelectItem>
                                  ))}
                                  {availableShifts.filter(s => s.department === dept.department_id).length === 0 && (
                                    <p className="text-center py-2 text-xs text-muted-foreground">No shifts defined for this department</p>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline" className="text-foreground border-foreground/10 hover:bg-foreground/5">Cancel</Button>
                              </DialogClose>
                              <Button 
                                onClick={() => handleBulkAssignShift(dept.department_id)} 
                                disabled={isLoading || !selectedShiftId}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {isLoading ? "Assigning..." : "Assign to All"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

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
