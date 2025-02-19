"use client";

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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";

const getAccessToken = () => localStorage.getItem("access_token");

export default function ShiftsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    shift_name: "",
    shift_start_time: "",
    shift_end_time: "",
    department: "",  // Changed to store only the ID
  });

  // Add this function at the top of your file, after the imports
const verifyToken = async (token, router, toast) => {
  if (!token) {
    router.push("/login");
    toast({
      variant: "destructive",
      title: "Error",
      description: "Please login to continue",
    });
    return;
  }
};

  const fetchShifts = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/shifts/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch shifts");
      }

      const data = await response.json();
      console.log("Fetched shifts:", data); // Debug log
      setShifts(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      setShifts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
  const token = getAccessToken();
  if (!token) {
    router.push("/login");
    toast({
      variant: "destructive",
      title: "Error",
      description: "Please login to continue",
    });
    return;
  }

  // Fetch departments from the backend
  fetchDepartments();
}, [router, toast]);

  const fetchDepartments = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch("http://127.0.0.1:8000/api/departments/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch departments");
      }
  
      const data = await response.json();
      setDepartments(data);
  
      if (data.length > 0) {
        // Automatically set the first department in the form if data exists
        setFormData((prev) => ({
          ...prev,
          department: { id: data[0].department_id, name: data[0].details }, // Set department with the first record
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
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDepartmentChange = (value) => {
    const selectedDepartment = departments.find((dept) => dept.department_id === value);
  
    if (selectedDepartment) {
      setFormData((prev) => ({
        ...prev,
        department: {
          id: selectedDepartment.department_id,
          name: selectedDepartment.details,
        },
      }));
    } else {
      // Handle the case where no department is found
      setFormData((prev) => ({
        ...prev,
        department: { id: "", name: "" },
      }));
    }
  };
  

  const resetForm = () => {
    setFormData({
      shift_name: "",
      shift_start_time: "",
      shift_end_time: "",
      department: { id: "", name: "" },
    });
    setCurrentShift(null);
    setIsEditMode(false);
  };

  const handleOpenDialog = (shift = null) => {
    if (shift) {
      setFormData({
        shift_name: shift.shift_name,
        shift_start_time: shift.shift_start_time,
        shift_end_time: shift.shift_end_time,
        department: shift.department,
      });
      setCurrentShift(shift);
      setIsEditMode(true);
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const shiftData = {
      shift_name: formData.shift_name,
      shift_start_time: formData.shift_start_time,
      shift_end_time: formData.shift_end_time,
      department: formData.department.id, // Pass department ID to the backend
    };

    try {
      const token = getAccessToken();
      const response = await fetch("http://127.0.0.1:8000/api/add-shift/", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(shiftData),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${isEditMode ? "update" : "create"} the shift`
        );
      }

      const newShift = await response.json();

      if (isEditMode && currentShift) {
        setShifts(
          shifts.map((shift) =>
            shift.id === currentShift.id ? { ...newShift } : shift
          )
        );
        toast({
          title: "Shift Updated",
          description: `${newShift.shift_name} has been updated successfully.`,
        });
      } else {
        setShifts([...shifts, newShift]);
        toast({
          title: "Shift Created",
          description: `${newShift.shift_name} has been created successfully.`,
        });
      }

      setIsOpen(false);
      resetForm();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDelete = async (shiftId) => {
    try {
      if (confirm("Are you sure you want to delete this shift?")) {
        const token = getAccessToken();
        const response = await fetch(
          `http://127.0.0.1:8000/api/shifts/${shiftId}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete the shift");
        }

        setShifts(shifts.filter((shift) => shift.id !== shiftId));
        toast({
          title: "Shift Deleted",
          description: "The shift has been deleted successfully.",
          variant: "destructive",
        });
      }
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
      <div className="container mx-auto p-6">
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
                    {isEditMode ? "Edit Shift" : "Create New Shift"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shift_name">Shift Name</Label>
                    <Input
                      id="shift_name"
                      value={formData.shift_name}
                      onChange={(e) =>
                        setFormData({ ...formData, shift_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shift_start_time">Start Time</Label>
                    <Input
                      id="shift_start_time"
                      type="time"
                      value={formData.shift_start_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shift_start_time: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shift_end_time">End Time</Label>
                    <Input
                      id="shift_end_time"
                      type="time"
                      value={formData.shift_end_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shift_end_time: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          {departments.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No departments available. Please add departments first.
            </div>
          ) : (
            <Select
              value={formData.department}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  department: value,
                });
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department">
                          {formData.department.id ? formData.department.name : "Select department"}
                        </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem 
                    key={department.id} 
                    value={department.id} 
                  >
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={departments.length === 0}>
                      {isEditMode ? "Update" : "Create"}
                    </Button>
                  </div>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading shifts...
                  </TableCell>
                </TableRow>
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No shifts found. Create your first shift!
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.shift_name}</TableCell>
                    <TableCell>{shift.shift_start_time}</TableCell>
                    <TableCell>{shift.shift_end_time}</TableCell>
                    <TableCell>
                      {shift.department?.name || "NA"}
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
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(shift.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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