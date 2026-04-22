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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Trash2, Plus } from "lucide-react";

export default function DesignationPage() {
  const [formData, setFormData] = useState({
    details: "",
    department: "",
  });

  const [editingDesignation, setEditingDesignation] = useState(null);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
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

  const fetchDesignations = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const data = await AxiosGet("designations/");
      setDesignations(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to fetch designations",
      });
    }
  }, [toast, verifyToken]);

  const fetchDepartments = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const data = await AxiosGet("departments/");
      setDepartments(data);
      if (data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          department: data[0].department_id.toString(),
        }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to fetch departments",
      });
    }
  }, [toast, verifyToken]);

  useEffect(() => {
    fetchDepartments();
    fetchDesignations();
  }, [fetchDepartments, fetchDesignations]);

  const handleInputChange = (field, value) => {
    if (editingDesignation) {
      setEditingDesignation((prev) => ({
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
      await AxiosPost("designations/add/", {
        details: formData.details,
        department: formData.department,
        org_id: orgId,
      });

      toast({
        title: "Success",
        description: "Designation added successfully",
      });

      setFormData({
        details: "",
        department: departments[0]?.department_id.toString() || "",
      });

      fetchDesignations();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to add designation",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (isLoading || !editingDesignation) return;
    if (!(await verifyToken())) return;

    setIsLoading(true);
    try {
      // Using AxiosPost with PUT method
      await AxiosPost(
        `designations/update/${editingDesignation.designation_id}/`,
        {
          details: editingDesignation.details,
          department: editingDesignation.department,
          org_id: orgId,
        },
        "PUT"
      );

      toast({
        title: "Success",
        description: "Designation updated successfully",
      });

      setEditingDesignation(null);
      fetchDesignations();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to update designation",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (designationId) => {
    if (!(await verifyToken())) return;

    try {
      // Using AxiosPost with DELETE method
      await AxiosPost(`designations/delete/${designationId}/`, {}, "DELETE");

      toast({
        title: "Success",
        description: "Designation deleted successfully",
      });

      fetchDesignations();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to delete designation",
      });
    }
  };

  const getDepartmentName = (departmentId) => {
    const department = departments.find(
      (dept) => dept.department_id.toString() === departmentId.toString()
    );
    return department?.details || "Unknown Department";
  };

  return (
    <>
      <Header />
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Designation Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Designation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Designation Name</label>
                <Input
                  value={formData.details}
                  onChange={(e) => handleInputChange("details", e.target.value)}
                  placeholder="Enter designation name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select
                  value={formData.department}
                  onValueChange={(value) =>
                    handleInputChange("department", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept.department_id}
                        value={dept.department_id.toString()}
                      >
                        {dept.details}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Adding..." : "Add Designation"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Designations List</h2>
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No designations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    designations.map((designation) => (
                      <TableRow key={designation.designation_id}>
                        <TableCell className="font-medium">
                          {designation.details}
                        </TableCell>
                        <TableCell>
                          {getDepartmentName(designation.department)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    setEditingDesignation({
                                      ...designation,
                                    })
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Designation</DialogTitle>
                                </DialogHeader>
                                <form
                                  onSubmit={handleEdit}
                                  className="space-y-4"
                                >
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      Designation Name
                                    </label>
                                    <Input
                                      value={editingDesignation?.details}
                                      onChange={(e) =>
                                        handleInputChange(
                                          "details",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Enter designation name"
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      Department
                                    </label>
                                    <Select
                                      value={editingDesignation?.department.toString()}
                                      onValueChange={(value) =>
                                        handleInputChange("department", value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {departments.map((dept) => (
                                          <SelectItem
                                            key={dept.department_id}
                                            value={dept.department_id.toString()}
                                          >
                                            {dept.details}
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
                                        : "Update Designation"}
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
                                    Delete Designation
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this
                                    designation? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDelete(designation.designation_id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
