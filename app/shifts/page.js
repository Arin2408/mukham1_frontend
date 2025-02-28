"use client";

import { useState, useEffect, useCallback } from "react";
import { AxiosPost, AxiosGet, useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { jwtDecode } from "jwt-decode";
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

export default function ShiftsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { orgId } = useAuth(); // Get orgId from AuthContext
  
  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [formData, setFormData] = useState({
    shift_name: "",
    shift_start_time: "",
    shift_end_time: "",
    department: { id: "", name: "" },
  });
  const [isLoading, setIsLoading] = useState(false);

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

      if (data.length > 0) {
        setFormData(prev => ({
          ...prev,
          department: { 
            id: data[0].department_id.toString(), 
            name: data[0].details 
          },
        }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Failed to fetch departments",
      });
    }
  }, [router, toast]);

  const fetchShifts = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const data = await AxiosGet("shifts/");
      setShifts(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Failed to fetch shifts",
      });
    }
  }, [router, toast]);

  useEffect(() => {
    fetchDepartments();
    fetchShifts();
  }, [fetchDepartments, fetchShifts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value) => {
    const selectedDepartment = departments.find(
      dept => dept.department_id.toString() === value
    );
    if (selectedDepartment) {
      setFormData(prev => ({
        ...prev,
        department: {
          id: selectedDepartment.department_id.toString(),
          name: selectedDepartment.details,
        },
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      shift_name: "",
      shift_start_time: "",
      shift_end_time: "",
      department: { 
        id: departments.length > 0 ? departments[0].department_id.toString() : "",
        name: departments.length > 0 ? departments[0].details : ""
      },
    });
    setCurrentShift(null);
  };

  const handleOpenDialog = (shift = null) => {
    if (shift) {
      setFormData({
        shift_name: shift.shift_name,
        shift_start_time: shift.shift_start_time,
        shift_end_time: shift.shift_end_time,
        department: {
          id: shift.department.toString(),
          name: departments.find(d => d.department_id === shift.department)?.details || ""
        },
      });
      setCurrentShift(shift);
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  const handleShiftSubmit = async (e) => {
    e.preventDefault();
    if (!(await verifyToken())) return;

    setIsLoading(true);
    try {
      const shiftData = {
        shift_name: formData.shift_name,
        shift_start_time: formData.shift_start_time,
        shift_end_time: formData.shift_end_time,
        department: parseInt(formData.department.id),
        org_id: parseInt(orgId),
      };

      if (currentShift) {
        // Update existing shift
        await AxiosPost(
          `shifts/update/${currentShift.shift_id}/`,
          shiftData,
          "PUT"
        );
        
        toast({
          title: "Success",
          description: "Shift updated successfully.",
        });
      } else {
        // Create new shift
        await AxiosPost("add-shift/", shiftData);
        
        toast({
          title: "Success",
          description: "Shift created successfully.",
        });
      }

      setIsOpen(false);
      resetForm();
      fetchShifts();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || `Failed to ${currentShift ? "update" : "create"} shift`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (shiftId) => {
    if (!(await verifyToken())) return;

    try {
      await AxiosPost(`shifts/delete/${shiftId}/`, {}, "DELETE");

      toast({
        title: "Shift Deleted",
        description: "Shift deleted successfully.",
      });
      
      fetchShifts();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete shift",
      });
    }
  };

  return (
    <>
      <Header />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Shift Management</h1>
          <div className="ml-auto">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {currentShift ? "Edit Shift" : "Create New Shift"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleShiftSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shift_name">Shift Name</Label>
                    <Input
                      id="shift_name"
                      name="shift_name"
                      value={formData.shift_name}
                      onChange={handleInputChange}
                      placeholder="Enter shift name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shift_start_time">Start Time</Label>
                      <Input
                        id="shift_start_time"
                        name="shift_start_time"
                        type="time"
                        value={formData.shift_start_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shift_end_time">End Time</Label>
                      <Input
                        id="shift_end_time"
                        name="shift_end_time"
                        type="time"
                        value={formData.shift_end_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department.id.toString()}
                      onValueChange={handleDepartmentChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department">
                          {formData.department.name || "Select department"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem
                            key={department.department_id}
                            value={department.department_id.toString()}
                          >
                            {department.details}
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
                      {isLoading ? "Processing..." : currentShift ? "Update Shift" : "Create Shift"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift Name</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No shifts found
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((shift) => (
                  <TableRow key={shift.shift_id}>
                    <TableCell>{shift.shift_name}</TableCell>
                    <TableCell>{shift.shift_start_time}</TableCell>
                    <TableCell>{shift.shift_end_time}</TableCell>
                    <TableCell>
                      {departments.find(d => d.department_id === shift.department)?.details || "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenDialog(shift)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Shift</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this shift? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(shift.shift_id)}
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
        </Card>
      </div>
    </>
  );
}