"use client";

import { useState, useEffect, useCallback } from "react";
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
import { UserPlus, Users, FileDown } from "lucide-react";
import { Header } from '@/components/Header';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"

const getAccessToken = () => localStorage.getItem("access_token");
const getOrgId = () => localStorage.getItem("org_id");

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

export default function EmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    mobile_number: "",
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    designation: "",
    shift: "",
    office_location: "",
    organisation: getOrgId(),
    org_id: getOrgId(),
  });

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");

  useEffect(() => {
    const token = getAccessToken();
    verifyToken(token, router, toast).then(isValid => {
      if (isValid) {
        fetchOrganization();
        fetchMasterData();
        fetchEmployees();
      }
    });
  }, [router, toast]);

  const fetchOrganization = useCallback(async () => {
    const token = getAccessToken();
    const orgId = getOrgId();
    if (!token || !orgId) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/organisations/${orgId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizationName(data.name);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    }
  }, []);

  const fetchMasterData = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const orgId = getOrgId();
      const [deptRes, desigRes, shiftRes, locRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/departments/?org_id=${orgId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://127.0.0.1:8000/api/designations/?org_id=${orgId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://127.0.0.1:8000/api/shifts/?org_id=${orgId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://127.0.0.1:8000/api/locations/?org_id=${orgId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [depts, designations, shifts, locations] = await Promise.all([
        deptRes.json(),
        desigRes.json(),
        shiftRes.json(),
        locRes.json(),
      ]);

      setDepartments(depts);
      setDesignations(designations);
      setShifts(shifts);
      setLocations(locations);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }, [toast]);

  const fetchEmployees = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const orgId = getOrgId();
      const response = await fetch(
        `http://127.0.0.1:8000/api/list/?org_id=${orgId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }, [toast]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !(await verifyToken(token, router, toast))) return;

    setIsSubmitting(true);

    try {
      if (!/^\d{10}$/.test(formData.mobile_number)) {
        throw new Error("Please enter a valid 10-digit mobile number");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      const response = await fetch("http://127.0.0.1:8000/api/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add employee");
      }

      toast({
        title: "Success",
        description: "Employee added successfully!",
      });

      setFormData({
        mobile_number: "",
        first_name: "",
        last_name: "",
        email: "",
        department: "",
        designation: "",
        shift: "",
        office_location: "",
        org_id: getOrgId(),
      });

      fetchEmployees();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToCSV = (data) => {
    const headers = [
      "First Name", "Last Name", "Mobile Number", "Email",
      "Department", "Designation", "Shift", "Location"
    ].join(',');

    const rows = data.map(employee => [
      employee.first_name,
      employee.last_name,
      employee.mobile_number,
      employee.email,
      departments.find(d => d.department_id.toString() === employee.department)?.details || '',
      designations.find(d => d.designation_id.toString() === employee.designation)?.details || '',
      shifts.find(s => s.shift_id.toString() === employee.shift)?.shift_name || '',
      locations.find(l => l.location_id.toString() === employee.office_location)?.location_name || ''
    ].join(','));

    return [headers, ...rows].join('\n');
  };

  const exportToJSON = (data) => {
    return JSON.stringify(data.map(employee => ({
      ...employee,
      department: departments.find(d => d.department_id.toString() === employee.department)?.details || '',
      designation: designations.find(d => d.designation_id.toString() === employee.designation)?.details || '',
      shift: shifts.find(s => s.shift_id.toString() === employee.shift)?.shift_name || '',
      office_location: locations.find(l => l.location_id.toString() === employee.office_location)?.location_name || ''
    }), null, 2));
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
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePhoneChange = (value) => {
  setFormData((prev) => ({
    ...prev,
    mobile_number: value,
  }));
};

  return (
    <>
      <Header />
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Employee Management</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Employee</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    required
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    required
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
  <label htmlFor="mobile_number">Phone Number</label>
  <PhoneInput
    country={"in"} // Default to India
    value={formData.mobile_number}
    onChange={handlePhoneChange} // Calls handlePhoneChange when phone input changes
    inputProps={{
      name: "mobile_number",
      required: true,
      autoFocus: false,
    }}
    enableSearch={true} // Allow country search
    countryCodeEditable={false} // Prevent manual change of country code
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
                    onValueChange={(value) => handleInputChange("department", value)}
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
                    onValueChange={(value) => handleInputChange("designation", value)}
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
                    onValueChange={(value) => handleInputChange("office_location", value)}
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <UserPlus className="mr-2 h-4 w-4" />
                {isSubmitting ? "Adding..." : "Add Employee"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Employees</h2>
            <div className="space-y-4">
              {employees.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No employees added yet
                </p>
              ) : (
                employees.slice(-5).map((employee) => (
                  <Card key={employee.employee_id} className="p-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{`${employee.first_name} ${employee.last_name}`}</span>
                      <span className="text-muted-foreground">Mobile:</span>
                      <span>{employee.mobile_number}</span>
                      <span className="text-muted-foreground">Email:</span>
                      <span>{employee.email}</span>
                      <span className="text-muted-foreground">Department:</span>
                      <span>
                        {departments.find(d => d.department_id.toString() === employee.department)?.details}
                      </span>
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