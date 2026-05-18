"use client";

import { useState, useEffect, useCallback } from "react";
import { AxiosPost, AxiosGet, AxiosPut, AxiosDelete, useAuth } from "@/context/AuthContext";
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
import { UserPlus, Users, FileDown, Search, Pencil, Trash2, IdCard } from "lucide-react";
import VirtualIDCard from "@/components/VirtualIDCard";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export default function EmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const designationFilter = searchParams.get("designation");
  const { toast } = useToast();
  const { orgId } = useAuth(); // Get orgId from AuthContext

  const [selectedEmployeeForCard, setSelectedEmployeeForCard] = useState(null);
  const [formData, setFormData] = useState({
    mobile_number: "",
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    designation: "",
    shift: "",
    office_location: "",
    organisation: "",
    org_id: "",
  });

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [organizationName, setOrganizationName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(10);

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

  const fetchOrganization = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const data = await AxiosGet(`organisations/${orgId}/`);
      setOrganizationName(data.name);

      // Update formData with organization info
      setFormData((prev) => ({
        ...prev,
        organisation: orgId,
        org_id: orgId,
      }));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to fetch organization",
      });
    }
  }, [orgId, toast, verifyToken]);

  const fetchMasterData = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const [departments, designations, shifts, locations] = await Promise.all([
        AxiosGet(`departments/?org_id=${orgId}`),
        AxiosGet(`designations/?org_id=${orgId}`),
        AxiosGet(`shifts/?org_id=${orgId}`),
        AxiosGet(`locations/?org_id=${orgId}`),
      ]);

      setDepartments(departments);
      setDesignations(designations);
      setShifts(shifts);
      setLocations(locations);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to fetch master data",
      });
    }
  }, [orgId, toast, verifyToken]);

  const fetchEmployees = useCallback(async () => {
    if (!(await verifyToken())) return;

    try {
      const data = await AxiosGet(`list/?org_id=${orgId}`);
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to fetch employees",
      });
      setEmployees([]); // Ensure employees is an array even on error
    }
  }, [orgId, toast, verifyToken]);

  useEffect(() => {
    fetchOrganization();
    fetchMasterData();
    fetchEmployees();
  }, [fetchOrganization, fetchMasterData, fetchEmployees]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field, value) => {
    setEditingEmployee((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value, country) => {
    // Assuming the country code is provided by react-phone-input-2
    const countryCodeLength = country.dialCode.length; // e.g., "91" has length 2
    const fullNumber = value.replace("+", "").trim(); // Remove "+" sign
    const mobileNumber = fullNumber.slice(countryCodeLength); // Extract number after country code

    setFormData((prev) => ({
      ...prev,
      mobile_number: mobileNumber, // Store only the 10-digit number
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!(await verifyToken())) return;

    setIsSubmitting(true);

    try {
      // Clean and validate the mobile number
      let mobileNumber = formData.mobile_number.replace(/\D/g, "");
      if (mobileNumber.length > 10) {
        mobileNumber = mobileNumber.slice(-10); // Take last 10 digits
      }

      // Validate org context
      if (!orgId) {
        throw new Error("Organization ID is missing. Please try logging out and logging in again.");
      }

      // Update formData with the cleaned number and org context
      const submissionData = { 
        ...formData, 
        mobile_number: mobileNumber,
        organisation: orgId,
        org_id: orgId 
      };

      console.log('DEBUG FINAL DATA:', submissionData);

      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Send formatted data to backend
      console.log('DEBUG SUBMITTING:', submissionData);
      const res = await AxiosPost("employee/signup/", submissionData);
      toast({
        title: "Success",
        description: `Employee added! Password: ${res.member_member_password || res.member_password}`,
      });

      // Reset form fields
      setFormData({
        mobile_number: "",
        first_name: "",
        last_name: "",
        email: "",
        department: "",
        designation: "",
        shift: "",
        office_location: "",
        organisation: orgId,
        org_id: orgId,
      });

      fetchEmployees();
    } catch (error) {
      console.error("Employee signup error:", error.response?.data || error.message);
      
      let errorDetail = "Failed to add employee";
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          // Flatten the error object to a string
          errorDetail = Object.entries(error.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(' ') : messages}`)
            .join(' | ');
        } else {
          errorDetail = error.response.data;
        }
      } else if (error.message) {
        errorDetail = error.message;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorDetail,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!(await verifyToken())) return;

    setIsSubmitting(true);
    try {
      const submissionData = {
        ...editingEmployee,
        organisation: orgId,
        org_id: orgId
      };

      await AxiosPut(`update/${editingEmployee.employee_id}/`, submissionData);
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error("Employee update error detail:", error.response?.data || error);
      const errorMsg = error.response?.data 
        ? JSON.stringify(error.response.data)
        : error.message || "Unknown error";
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update: ${errorMsg}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await verifyToken())) return;
    try {
      await AxiosDelete(`delete/${id}/`);
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
      fetchEmployees();
    } catch (error) {
      console.error("Employee delete error:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.error || "Failed to delete employee";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg,
      });
    }
  };

  const exportToCSV = (data) => {
    const headers = [
      "First Name",
      "Last Name",
      "Mobile Number",
      "Email",
      "Department",
      "Designation",
      "Shift",
      "Location",
    ].join(",");

    const rows = data.map((employee) =>
      [
        employee.first_name,
        employee.last_name,
        employee.mobile_number,
        employee.email,
        departments.find(
          (d) => d.department_id.toString() === employee.department
        )?.details || "",
        designations.find(
          (d) => d.designation_id.toString() === employee.designation
        )?.details || "",
        shifts.find((s) => s.shift_id.toString() === employee.shift)
          ?.shift_name || "",
        locations.find(
          (l) => l.location_id.toString() === employee.office_location
        )?.location_name || "",
      ].join(",")
    );

    return [headers, ...rows].join("\n");
  };

  const exportToJSON = (data) => {
    return JSON.stringify(
      data.map((employee) => ({
        ...employee,
        department:
          departments.find(
            (d) => d.department_id.toString() === employee.department
          )?.details || "",
        designation:
          designations.find(
            (d) => d.designation_id.toString() === employee.designation
          )?.details || "",
        shift:
          shifts.find((s) => s.shift_id.toString() === employee.shift)
            ?.shift_name || "",
        office_location:
          locations.find(
            (l) => l.location_id.toString() === employee.office_location
          )?.location_name || "",
      })),
      null,
      2
    );
  };

  const handleExport = () => {
    let content, filename, type;

    if (exportFormat === "csv") {
      content = exportToCSV(employees);
      filename = "employees.csv";
      type = "text/csv";
    } else {
      content = exportToJSON(employees);
      filename = "employees.json";
      type = "application/json";
    }

    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search and pagination logic
  const filteredEmployees = (Array.isArray(employees) ? employees : []).filter(
    (employee) => {
      const matchesSearch = 
        employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.mobile_number.includes(searchTerm);
      
      const matchesDesignation = !designationFilter || String(employee.designation) === String(designationFilter);
      
      return matchesSearch && matchesDesignation;
    }
  );

  // Get current employees
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get department, designation, shift, and location names by their IDs
  const getDepartmentName = (id) => {
    const dept = departments.find(
      (d) => String(d.department_id) === String(id)
    );
    return dept?.details || "N/A";
  };

  const getDesignationName = (id) => {
    const desig = designations.find(
      (d) => String(d.designation_id) === String(id)
    );
    return desig?.details || "N/A";
  };

  const getShiftName = (id) => {
    const shift = shifts.find((s) => String(s.shift_id) === String(id));
    return shift?.shift_name || "N/A";
  };

  const getLocationName = (id) => {
    const loc = locations.find((l) => String(l.location_id) === String(id));
    return loc?.location_name || "N/A";
  };



  return (
    <>
      <Sidebar />
      <div className="ml-64 p-6 lg:p-10 space-y-8 min-h-screen bg-[#02040a]">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Employee Management</h1>
            {designationFilter && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  Filter: {getDesignationName(designationFilter)}
                </span>
                <Button 
                  variant="ghost" 
                  className="h-5 px-1.5 text-[9px] uppercase font-bold text-white/40 hover:text-white"
                  onClick={() => router.push("/employees")}
                >
                  Clear Filter
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Export as..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={employees.length === 0}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <span className="text-lg">Total: {employees.length}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="quantanex-card p-6 border-white/5">
            <h2 className="text-lg font-semibold mb-4">Add New Employee</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    required
                    value={formData.first_name}
                    onChange={(e) =>
                      handleInputChange("first_name", e.target.value)
                    }
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    required
                    value={formData.last_name}
                    onChange={(e) =>
                      handleInputChange("last_name", e.target.value)
                    }
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="mobile_number">Phone Number</label>
                <PhoneInput
                  country={"in"}
                  value={formData.mobile_number ? `91${formData.mobile_number}` : ""}
                  onChange={handlePhoneChange}
                  containerClass="!bg-transparent"
                  inputClass="!w-full !h-10 !bg-white/5 !border-white/10 !text-white !rounded-lg focus:!border-primary/50 focus:!ring-1 focus:!ring-primary/50 transition-all"
                  buttonClass="!bg-transparent !border-white/10 !rounded-l-lg"
                  dropdownClass="!bg-[#11141b] !text-white !border-white/10"
                  inputProps={{
                    name: "mobile_number",
                    required: true,
                    autoFocus: false,
                  }}
                  enableSearch={true}
                  countryCodeEditable={false}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    required
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Designation</label>
                  <Select
                    required
                    value={formData.designation}
                    onValueChange={(value) =>
                      handleInputChange("designation", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {designations.map((desig) => (
                        <SelectItem
                          key={desig.designation_id}
                          value={desig.designation_id.toString()}
                        >
                          {desig.details}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shift</label>
                  <Select
                    required
                    value={formData.shift}
                    onValueChange={(value) => handleInputChange("shift", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.map((shift) => (
                        <SelectItem
                          key={shift.shift_id}
                          value={shift.shift_id.toString()}
                        >
                          {shift.shift_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Office Location</label>
                  <Select
                    required
                    value={formData.office_location}
                    onValueChange={(value) =>
                      handleInputChange("office_location", value)
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
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/10" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Employee
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="quantanex-card p-6 col-span-2 border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">All Employees</h2>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search employees..."
                  className="w-64"
                />
              </div>
            </div>

            {employees.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No employees added yet
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                        <th className="py-3 text-left">Name</th>
                        <th className="py-3 text-left">Mobile</th>
                        <th className="py-3 text-left">Email</th>
                        <th className="py-3 text-left">Department</th>
                        <th className="py-3 text-left">Designation</th>
                        <th className="py-3 text-left">Shift</th>
                        <th className="py-3 text-left">Location</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentEmployees.map((employee) => (
                        <tr
                          key={employee.employee_id}
                          className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
                        >
                          <td className="py-3 font-medium text-white/90">{`${employee.first_name} ${employee.last_name}`}</td>
                          <td className="py-3 text-white/60">{employee.mobile_number}</td>
                          <td className="py-3 text-white/60">{employee.email}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">
                              {employee.department_name || "N/A"}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20">
                              {employee.designation_name || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 text-white/60">
                            {employee.shift_name || "N/A"}
                          </td>
                          <td className="py-3 text-white/60">
                            {employee.location_name || "N/A"}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white/40 hover:text-primary hover:bg-primary/10"
                                onClick={() => setSelectedEmployeeForCard(employee)}
                              >
                                <IdCard className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-white/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-[#0f1117] border-white/10 text-white">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                                    <AlertDialogDescription className="text-white/60">
                                      Are you sure you want to delete {employee.first_name} {employee.last_name}? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                      onClick={() => handleDelete(employee.employee_id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredEmployees.length > employeesPerPage && (
                  <div className="flex justify-center mt-4 space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({
                      length: Math.ceil(
                        filteredEmployees.length / employeesPerPage
                      ),
                    }).map((_, index) => (
                      <Button
                        key={index}
                        variant={
                          currentPage === index + 1 ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => paginate(index + 1)}
                      >
                        {index + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={
                        currentPage ===
                        Math.ceil(filteredEmployees.length / employeesPerPage)
                      }
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* ID CARD OVERLAY */}
      {selectedEmployeeForCard && (
        <VirtualIDCard 
          employee={selectedEmployeeForCard} 
          onClose={() => setSelectedEmployeeForCard(null)} 
        />
      )}
    </>
  );
}
