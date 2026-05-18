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
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Edit2, Trash2, Plus, Info, Users, Briefcase } from "lucide-react";

export default function DesignationPage() {
  const [selectedDesignation, setSelectedDesignation] = useState(null);
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
  const { orgId } = useAuth();

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast({ variant: "destructive", title: "Error", description: "No token found. Please login again." });
      router.push("/login");
      return false;
    }
    try {
      const decodedToken = jwtDecode(token);
      if (Date.now() >= decodedToken.exp * 1000) {
        toast({ variant: "destructive", title: "Error", description: "Session expired. Please login again." });
        localStorage.removeItem("access_token");
        router.push("/login");
        return false;
      }
      await AxiosPost("token/verify/", { token });
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Invalid token" });
      localStorage.removeItem("access_token");
      router.push("/login");
      return false;
    }
  }, [router, toast]);

  const [employees, setEmployees] = useState([]);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    if (!(await verifyToken())) return;
    
    setIsLoading(true);
    try {
      const [designationsData, departmentsData, employeesData] = await Promise.all([
        AxiosGet("designations/"),
        AxiosGet("departments/"),
        AxiosGet(`list/?org_id=${orgId}`),
      ]);
      setDesignations(designationsData);
      setDepartments(departmentsData);
      setEmployees(employeesData);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch data" });
    } finally {
      setIsLoading(false);
    }
  }, [orgId, verifyToken, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (field, value) => {
    if (editingDesignation) {
      setEditingDesignation((prev) => ({ ...prev, [field]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!(await verifyToken())) return;

    if (!formData.details || !formData.department) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields" });
      return;
    }
    setIsLoading(true);
    try {
      await AxiosPost("designations/add/", {
        details: formData.details,
        department: parseInt(formData.department),
      });
      toast({ title: "Success", description: "Designation created successfully" });
      setFormData({ details: "", department: "" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create designation" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!(await verifyToken())) return;

    setIsLoading(true);
    try {
      console.log("DEBUG: Updating designation", editingDesignation.designation_id, {
        details: editingDesignation.details,
        department: parseInt(editingDesignation.department)
      });
      
      await AxiosPost(`designations/update/${editingDesignation.designation_id}/`, {
        details: editingDesignation.details,
        department: parseInt(editingDesignation.department),
      }, "put");

      toast({ title: "Success", description: "Designation updated successfully" });
      setEditingDesignation(null);
      fetchData();
    } catch (error) {
      console.error("Update error detail:", error);
      let errorMessage = "Failed to update designation";
      if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await verifyToken())) return;
    try {
      console.log("DEBUG: Deleting designation", id);
      await AxiosPost(`designations/delete/${id}/`, {}, "delete");
      toast({ title: "Success", description: "Designation deleted successfully" });
      if (selectedDesignation?.designation_id === id) setSelectedDesignation(null);
      fetchData();
    } catch (error) {
      console.error("Delete error detail:", error);
      let errorMessage = "Failed to delete designation";
      if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    }
  };

  const getDepartmentName = (id) => {
    const dept = departments.find((d) => d.department_id.toString() === id.toString());
    return dept ? dept.details : "N/A";
  };

  return (
    <>
      <Sidebar />
      <div className="ml-64 p-6 lg:p-10 space-y-8 min-h-screen bg-[#02040a] text-white">
        <div className="pt-10 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Designation Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <Card className="p-8 w-full border-white/5">
              <h2 className="text-lg font-semibold mb-6 text-white">Add New Designation</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Designation Name</label>
                  <Input
                    value={formData.details}
                    onChange={(e) => handleInputChange("details", e.target.value)}
                    placeholder="Enter designation name"
                    className="h-11 bg-white/5 border-white/10 w-full"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleInputChange("department", value)}
                  >
                    <SelectTrigger className="h-11 bg-white/5 border-white/10 w-full text-white">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1117] border-white/10 text-white">
                      {departments.map((dept) => (
                        <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                          {dept.details}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10 transition-all active:scale-95">
                  {isLoading ? "Adding..." : "Add Designation"}
                </Button>
              </form>
            </Card>

            <Card className="p-6 w-full border-white/5">
              <h2 className="text-lg font-semibold mb-6 text-white">Designations List</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent text-[10px] uppercase tracking-widest font-bold">
                      <TableHead className="text-muted-foreground">Designation</TableHead>
                      <TableHead className="text-muted-foreground">Department</TableHead>
                      <TableHead className="text-muted-foreground">Members</TableHead>
                      <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          No designations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      designations.map((designation) => {
                        const memberCount = employees.filter(emp => String(emp.designation) === String(designation.designation_id)).length;
                        return (
                          <TableRow
                            key={designation.designation_id}
                            className={`border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                              selectedDesignation?.designation_id === designation.designation_id ? 'bg-white/[0.05]' : ''
                            }`}
                            onClick={() => setSelectedDesignation(designation)}
                          >
                            <TableCell className="font-medium text-white/90">{designation.details}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
                                {getDepartmentName(designation.department)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs font-mono text-white/60">
                              {memberCount} Employees
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 bg-transparent border-white/10 hover:bg-white/10 text-white"
                                      onClick={() => setEditingDesignation({ ...designation })}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                <DialogContent className="bg-[#0f1117] border-white/10 text-white">
                                  <DialogHeader>
                                    <DialogTitle>Edit Designation</DialogTitle>
                                  </DialogHeader>
                                  <form onSubmit={handleEdit} className="space-y-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Designation Name</label>
                                      <Input
                                        value={editingDesignation?.details}
                                        onChange={(e) => handleInputChange("details", e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Department</label>
                                      <Select
                                        value={editingDesignation?.department.toString()}
                                        onValueChange={(value) => handleInputChange("department", value)}
                                      >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0f1117] border-white/10 text-white">
                                          {departments.map((dept) => (
                                            <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                                              {dept.details}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancel</Button>
                                      </DialogClose>
                                      <Button type="submit" disabled={isLoading}>
                                        {isLoading ? "Updating..." : "Update Designation"}
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent border-white/10 hover:bg-destructive/10 text-white">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-[#0f1117] border-white/10 text-white">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Designation</AlertDialogTitle>
                                    <AlertDialogDescription className="text-white/60">
                                      Are you sure you want to delete this designation?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-transparent border-white/10 text-white">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(designation.designation_id)}
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Sidebar Insights */}
          <div className="lg:col-span-4 sticky top-10">
            {selectedDesignation ? (
              <Card className="quantanex-card p-0 border-primary/20 bg-primary/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-primary/10 p-6 border-b border-primary/20">
                  <div className="flex items-center gap-3 mb-2 text-primary">
                    <Briefcase className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Designation Detail</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{selectedDesignation.details}</h3>
                  <p className="text-sm text-primary/80 font-medium">{getDepartmentName(selectedDesignation.department)}</p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <Users className="h-4 w-4 text-primary mb-2" />
                      <div className="text-2xl font-mono font-bold text-white">
                        {employees.filter(emp => String(emp.designation) === String(selectedDesignation.designation_id)).length}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Employees</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <Info className="h-4 w-4 text-primary mb-2" />
                      <div className="text-2xl font-mono font-bold text-white">Active</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Status</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Quick Actions</h4>
                    <div className="flex flex-col gap-2">
                      <Button
                        className="w-full justify-start bg-white/5 border-white/10 hover:bg-white/10 text-xs text-white"
                        onClick={() => router.push(`/employees?designation=${selectedDesignation.designation_id}`)}
                      >
                        <Users className="mr-2 h-4 w-4" /> View Employees
                      </Button>
                      <Button variant="ghost" className="w-full justify-start hover:bg-white/5 text-xs text-white/60 hover:text-white" onClick={() => setSelectedDesignation(null)}>
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="quantanex-card p-10 border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center gap-4 border-dashed">
                <div className="p-4 rounded-full bg-white/5 border border-white/10">
                  <Info className="h-8 w-8 text-white/20" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">No Selection</h3>
                  <p className="text-xs text-white/40 max-w-[200px]">Click on a designation in the list to view advanced insights.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
