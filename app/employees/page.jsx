"use client";

// Uses the shared FastAPI Axios client from AuthContext (base URL: /api/v1/).
import { useState, useEffect, useCallback } from "react";
import { departmentLabel, designationLabel, shiftLabel } from "@/lib/setupLabels";
import { FastAPI, apiErrorMessage, useAuth } from "@/context/AuthContext";
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
import { UserPlus, Users, FileDown, Search, Trash2, IdCard, Pencil, Network } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import VirtualIDCard from "@/components/VirtualIDCard";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
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
    manager: "",
});
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(10);
  // Validate the saved session through FastAPI. The shared client attaches the Bearer token.
  const verifyToken = useCallback(async () => {
    if (typeof window === "undefined" || !localStorage.getItem("access_token")) {
      toast({
        variant: "destructive",
        title: "Session required",
        description: "Please log in again.",
      });
      router.push("/login");
      return false;
    }

    try {
      const { data } = await FastAPI.get("auth/verify");
      // Member tokens get 403 from GET /employees.
      if (data?.role === "employee") {
        router.replace("/member");
        return false;
      }
      return true;
    } catch (error) {
      const status = error?.response?.status;
      toast({
        variant: "destructive",
        title: "Authentication error",
        description:
          error?.response?.data?.detail ||
          "Your session could not be verified. Please log in again.",
      });

      if (status === 401 || status === 403) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("org_id");
        router.push("/login");
      }
      return false;
    }
  }, [router, toast]);

  const fetchMasterData = useCallback(async () => {
    if (!(await verifyToken())) return;
    try {
      const [
        departmentsResponse,
        designationsResponse,
        shiftsResponse,
        locationsResponse,
      ] = await Promise.all([
        FastAPI.get("departments"),
        FastAPI.get("designations"),
        FastAPI.get("shifts"),
        FastAPI.get("locations"),
      ]);
      setDepartments(
        Array.isArray(departmentsResponse.data)
          ? departmentsResponse.data
          : []
      );
      setDesignations(
        Array.isArray(designationsResponse.data)
          ? designationsResponse.data
          : []
      );
      setShifts(
        Array.isArray(shiftsResponse.data)
          ? shiftsResponse.data
          : []
      );
      setLocations(
        Array.isArray(locationsResponse.data)
          ? locationsResponse.data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch employee master data:",
        error.response?.status,
        error.response?.data || error.message
      );
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch master data",
      });
    }
  }, [verifyToken, toast]);
  const fetchEmployees = useCallback(async () => {
    if (!(await verifyToken())) return;
    try {
      const response = await FastAPI.get("employees");
      const data = Array.isArray(response.data)
        ? response.data
        : [];
      setEmployees(data);
    } catch (error) {
      console.error(
        "Failed to fetch employees:",
        error.response?.status,
        error.response?.data || error.message
      );
      toast({
        title: "Error",
        description:
          error.response?.data?.detail ||
          "Failed to fetch employees.",
        variant: "destructive",
      });
    }
  }, [verifyToken, toast]);
  useEffect(() => {
    let active = true;
    const loadPage = async () => {
      // Each fetch handles its own errors and uses the shared FastAPI client.
      if (!active) return;
      await Promise.all([fetchMasterData(), fetchEmployees()]);
    };
    loadPage();
    return () => {
      active = false;
    };
  }, [fetchMasterData, fetchEmployees]);
  // Select value "org" means the employee reports directly to the
  // organisation admin (top of the reporting tree).
  const managerValueToId = (value) =>
    value && value !== "org" ? Number(value) : null;

  const employeeName = (e) => `${e.first_name} ${e.last_name}`.trim();

  const startEdit = (employee) => {
    setEditingEmployee({
      employee_id: employee.employee_id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      mobile_number: employee.mobile_number,
      email: employee.email,
      department: employee.department ? String(employee.department) : "",
      designation: employee.designation ? String(employee.designation) : "",
      shift: employee.shift ? String(employee.shift) : "",
      office_location: employee.office_location
        ? String(employee.office_location)
        : "",
      manager: employee.manager_id ? String(employee.manager_id) : "org",
    });
  };

  const handleInputChange = (field, value) => {
    if (field === "department") {
      // A new department: its own designations and shifts only, and its
      // office to start with (still changeable).
      const department = departments.find((d) => String(d.department_id) === value);
      setFormData((prev) => ({
        ...prev,
        department: value,
        designation: designations.some(
          (d) => String(d.designation_id) === prev.designation && String(d.department_id) === value
        )
          ? prev.designation
          : "",
        shift: shifts.some((s) => String(s.shift_id) === prev.shift && String(s.department_id) === value)
          ? prev.shift
          : "",
        office_location: department?.location_id ? String(department.location_id) : prev.office_location,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  // Designations and shifts of the chosen department.
  const departmentDesignations = designations.filter(
    (d) => String(d.department_id) === formData.department
  );
  const departmentShifts = shifts.filter((s) => String(s.department_id) === formData.department);
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
// Update formData with the cleaned number and org context
      const submissionData = {
        ...formData,
        mobile_number: mobileNumber,};
      console.log('DEBUG FINAL DATA:', submissionData);
      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }
      // Every employee must report to someone
      if (!formData.manager) {
        throw new Error("Select who this employee reports to");
      }
      // Send formatted data to backend
      console.log('DEBUG SUBMITTING:', submissionData);
      const employeePayload = {
        first_name: submissionData.first_name,
        last_name: submissionData.last_name,
        mobile_number: submissionData.mobile_number,
        email: submissionData.email,
        department: submissionData.department
          ? Number(submissionData.department)
          : null,
        designation: submissionData.designation
          ? Number(submissionData.designation)
          : null,
        shift: submissionData.shift
          ? Number(submissionData.shift)
          : null,
        office_location: submissionData.office_location
          ? Number(submissionData.office_location)
          : null,
        // "org" = reports directly to the organisation admin
        manager: managerValueToId(submissionData.manager),
      };
      const response = await FastAPI.post(
        "employees",
        employeePayload
      );
      const res = response.data;
      toast({
        title: "Success",
        description: res.member_password ? `Employee added. Temporary password: ${res.member_password}` : "Employee added successfully.",
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
        manager: "",
      });
      fetchEmployees();
    } catch (error) {
      console.error("Employee signup error:", error.response?.data || error.message);
      const errorDetail = error.response
        ? apiErrorMessage(error, "Failed to add employee")
        : error.message || "Failed to add employee";
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
        ...editingEmployee,};
      const employeePayload = {
        first_name: submissionData.first_name,
        last_name: submissionData.last_name,
        mobile_number: submissionData.mobile_number,
        email: submissionData.email,
        department: submissionData.department
          ? Number(submissionData.department)
          : null,
        designation: submissionData.designation
          ? Number(submissionData.designation)
          : null,
        shift: submissionData.shift
          ? Number(submissionData.shift)
          : null,
        office_location: submissionData.office_location
          ? Number(submissionData.office_location)
          : null,
        manager: managerValueToId(submissionData.manager),
      };
      await FastAPI.put(
        `employees/${editingEmployee.employee_id}`,
        employeePayload
      );
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error("Employee update error detail:", error.response?.data || error);
      const errorMsg = apiErrorMessage(error, error.message || "Unknown error");
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
      await FastAPI.delete(`employees/${id}`);
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
      const firstName = String(employee.first_name ?? "");
      const lastName = String(employee.last_name ?? "");
      const email = String(employee.email ?? "");
      const mobile = String(employee.mobile_number ?? "");
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        firstName.toLowerCase().includes(query) ||
        lastName.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        mobile.includes(searchTerm);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, designationFilter]);
  // Get department, designation, shift, and location names by their IDs
  const getDesignationName = (id) => {
    const designation = designations.find(
      (d) => String(d.designation_id) === String(id)
    );
    return designation?.details || designation?.name || `Designation #${id}`;
  };
return (
    <>
      <Sidebar />
      <div className="lg:ml-[var(--sidebar-w)] transition-[margin] duration-300 p-4 sm:p-6 lg:p-10 space-y-8 min-h-screen bg-background">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight page-title">Employee Management</h1>
            {designationFilter && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  Filter: {getDesignationName(designationFilter)}
                </span>
                <Button
                  variant="ghost"
                  className="h-5 px-1.5 text-xs font-bold text-foreground/40 hover:text-foreground"
                  onClick={() => router.push("/employees")}
                >
                  Clear Filter
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
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
            <Button variant="outline" asChild>
              <Link href="/org-chart">
                <Network className="mr-2 h-4 w-4" />
                Org chart
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="quantanex-card p-6 border-foreground/5">
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
                  inputClass="!w-full !h-10 !bg-foreground/5 !border-foreground/10 !text-foreground !rounded-lg focus:!border-primary/50 focus:!ring-1 focus:!ring-primary/50 transition-all"
                  buttonClass="!bg-transparent !border-foreground/10 !rounded-l-lg"
                  dropdownClass="!bg-card !text-foreground !border-foreground/10"
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
                          {departmentLabel(dept, locations)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Designation</label>
                  <Select
                    required
                    disabled={!formData.department}
                    value={formData.designation}
                    onValueChange={(value) =>
                      handleInputChange("designation", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !formData.department
                            ? "Select department first"
                            : departmentDesignations.length
                            ? "Select designation"
                            : "No designations in this department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentDesignations.map((desig) => (
                        <SelectItem
                          key={desig.designation_id}
                          value={desig.designation_id.toString()}
                        >
                          {designationLabel(desig, departments, locations)}
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
                    disabled={!formData.department}
                    value={formData.shift}
                    onValueChange={(value) => handleInputChange("shift", value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !formData.department
                            ? "Select department first"
                            : departmentShifts.length
                            ? "Select shift"
                            : "No shifts in this department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentShifts.map((shift) => (
                        <SelectItem
                          key={shift.shift_id}
                          value={shift.shift_id.toString()}
                        >
                          {shiftLabel(shift, departments, locations)}
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Reports to</label>
                <Select
                  required
                  value={formData.manager}
                  onValueChange={(value) => handleInputChange("manager", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org">Organisation admin (top level)</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.employee_id} value={String(emp.employee_id)}>
                        {employeeName(emp)}
                        {emp.designation_name && emp.designation_name !== "N/A"
                          ? ` · ${emp.designation_name}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 shadow-lg shadow-primary/10" disabled={isSubmitting}>
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
          <Card className="quantanex-card p-6 lg:col-span-2 min-w-0 border-foreground/5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold">All Employees</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search employees..."
                  className="w-full sm:w-64"
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
                      <tr className="bg-muted text-xs font-medium text-muted-foreground">
                        <th className="py-3 px-3 text-left">Name</th>
                        <th className="py-3 px-3 text-left">Mobile</th>
                        <th className="py-3 px-3 text-left">Email</th>
                        <th className="py-3 px-3 text-left">Department</th>
                        <th className="py-3 px-3 text-left">Designation</th>
                        <th className="py-3 px-3 text-left">Shift</th>
                        <th className="py-3 px-3 text-left">Location</th>
                        <th className="py-3 px-3 text-left">Reports to</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentEmployees.map((employee) => (
                        <tr
                          key={employee.employee_id}
                          className="border-b border-foreground/5 hover:bg-foreground/[0.03] transition-colors group"
                        >
                          <td className="py-3 px-3 font-medium text-foreground/90">{`${employee.first_name} ${employee.last_name}`}</td>
                          <td className="py-3 px-3 text-foreground/60">{employee.mobile_number}</td>
                          <td className="py-3 px-3 text-foreground/60">{employee.email}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs border border-blue-500/20">
                              {employee.department_name || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs border border-purple-500/20">
                              {employee.designation_name || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-foreground/60">
                            {employee.shift_name || "N/A"}
                          </td>
                          <td className="py-3 px-3 text-foreground/60">
                            {employee.location_name || "N/A"}
                          </td>
                          <td className="py-3 px-3 text-foreground/60 whitespace-nowrap">
                            {employee.manager_name || "Organisation"}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" title="View ID card"
                                onClick={() => setSelectedEmployeeForCard(employee)}
                              >
                                <IdCard className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                                title="Edit employee"
                                onClick={() => startEdit(employee)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card border-foreground/10 text-foreground">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                                    <AlertDialogDescription className="text-foreground/60">
                                      Are you sure you want to delete {employee.first_name} {employee.last_name}?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-transparent border-foreground/10 text-foreground hover:bg-foreground/5">Cancel</AlertDialogCancel>
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
      {/* EDIT EMPLOYEE */}
      <Dialog
        open={Boolean(editingEmployee)}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    required
                    value={editingEmployee.first_name}
                    onChange={(e) => handleEditInputChange("first_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    required
                    value={editingEmployee.last_name}
                    onChange={(e) => handleEditInputChange("last_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mobile</label>
                  <Input
                    required
                    inputMode="numeric"
                    value={editingEmployee.mobile_number}
                    onChange={(e) => handleEditInputChange("mobile_number", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    required
                    type="email"
                    value={editingEmployee.email}
                    onChange={(e) => handleEditInputChange("email", e.target.value)}
                  />
                </div>
                {[
                  ["department", "Department", departments, "department_id", (d) => departmentLabel(d, locations)],
                  ["designation", "Designation", designations, "designation_id", (d) => designationLabel(d, departments, locations)],
                  ["shift", "Shift", shifts, "shift_id", (s) => shiftLabel(s, departments, locations)],
                  ["office_location", "Office Location", locations, "location_id", (l) => l.location_name],
                ].map(([field, label, options, idKey, getLabel]) => (
                  <div className="space-y-2" key={field}>
                    <label className="text-sm font-medium">{label}</label>
                    <Select
                      value={editingEmployee[field]}
                      onValueChange={(value) => handleEditInputChange(field, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option[idKey]} value={String(option[idKey])}>
                            {getLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Reports to</label>
                  <Select
                    value={editingEmployee.manager}
                    onValueChange={(value) => handleEditInputChange("manager", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="org">Organisation admin (top level)</SelectItem>
                      {employees
                        .filter((emp) => emp.employee_id !== editingEmployee.employee_id)
                        .map((emp) => (
                          <SelectItem key={emp.employee_id} value={String(emp.employee_id)}>
                            {employeeName(emp)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingEmployee(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
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
