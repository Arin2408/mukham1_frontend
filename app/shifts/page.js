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
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { jwtDecode } from "jwt-decode";

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

export default function ShiftsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [formData, setFormData] = useState({
    shift_name: "",
    shift_start_time: "",
    shift_end_time: "",
    department: { id: "", name: "" },
  });

  // Token verification and fetching departments when the page loads
  useEffect(() => {
    const token = getAccessToken();
    verifyToken(token, router, toast);

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
      // Set the first department in the dropdown as the default
      setFormData((prev) => ({
        ...prev,
        department: { id: data[0].department_id, name: data[0].details },
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


  // fetching
  const fetchShifts = async () => {
  try {
    const token = getAccessToken();
    const response = await fetch("http://127.0.0.1:8000/api/shifts/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch shifts");
    }

    const data = await response.json();
    setShifts(data);
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message,
    });
  }
};

useEffect(() => {
  const token = getAccessToken();
  verifyToken(token, router, toast);
  fetchShifts(); // Fetch shifts on page load
}, [router, toast]);


// handle submit
const handleShiftSubmit = async (e) => {
  e.preventDefault();
  const shiftData = {
    shift_name: formData.shift_name,
    shift_start_time: formData.shift_start_time,
    shift_end_time: formData.shift_end_time,
    department: formData.department.id,
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
      throw new Error(`Failed to ${isEditMode ? "update" : "create"} the shift`);
    }

    toast({
      title: isEditMode ? "Shift Updated" : "Shift Created",
      description: `${shiftData.shift_name} has been successfully ${isEditMode ? "updated" : "created"}.`,
    });

    setIsOpen(false);
    resetForm();
    fetchShifts(); // Refresh the shifts list
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message,
    });
  }
};


  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   const shiftData = {
  //     shift_name: formData.shift_name,
  //     shift_start_time: formData.shift_start_time,
  //     shift_end_time: formData.shift_end_time,
  //     department: formData.department.id,
  //   };

  //   try {
  //     const token = getAccessToken();
  //     const response = await fetch("http://127.0.0.1:8000/api/add-shift/", {
  //       method: isEditMode ? "PUT" : "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify(shiftData),
  //     });

  //     if (!response.ok) {
  //       throw new Error(
  //         `Failed to ${isEditMode ? "update" : "create"} the shift`
  //       );
  //     }

  //     const newShift = await response.json();

  //     if (isEditMode && currentShift) {
  //       setShifts(
  //         shifts.map((shift) =>
  //           shift.id === currentShift.id ? { ...newShift } : shift
  //         )
  //       );
  //       toast({
  //         title: "Shift Updated",
  //         description: `${newShift.shift_name} has been updated successfully.`,
  //       });
  //     } else {
  //       setShifts([...shifts, newShift]);
  //       toast({
  //         title: "Shift Created",
  //         description: `${newShift.shift_name} has been created successfully.`,
  //       });
  //     }

  //     setIsOpen(false);
  //     resetForm();
  //   } catch (error) {
  //     toast({
  //       variant: "destructive",
  //       title: "Error",
  //       description: error.message,
  //     });
  //   }
  // };

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
                    {isEditMode ? "Edit Shift" : "Create New Shift"}
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
                        placeholder="Start Time e.g., 09:00 AM"
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
                        placeholder="End Time e.g., 05:00 PM"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department.id} onValueChange={handleDepartmentChange}>
  <SelectTrigger>
    <SelectValue placeholder="Select department">
      {formData.department.name || "Select department"}
    </SelectValue>
  </SelectTrigger>
  <SelectContent>
    {departments.map((department) => (
      <SelectItem key={department.department_id} value={department.department_id}>
        {department.details}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

                  </div>
                  <Button type="submit">
                    {isEditMode ? "Update Shift" : "Create Shift"}
                  </Button>
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
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>{shift.shift_name}</TableCell>
                  <TableCell>{shift.shift_start_time}</TableCell>
                  <TableCell>{shift.shift_end_time}</TableCell>
                  <TableCell>{shift.department?.name || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => handleOpenDialog(shift)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(shift.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
