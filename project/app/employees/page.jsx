"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserPlus, Users, Download, FileDown } from "lucide-react"
import { Header } from '@/components/Header'

export default function EmployeePage() {
  // ... [Previous state declarations remain the same] ...
  const [formData, setFormData] = useState({
    mobile_number: "",
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    designation: "",
    shift: "",
    office_location: ""
  })

  const [departments] = useState([
    { id: 1, name: "IT" },
    { id: 2, name: "HR" },
    { id: 3, name: "Finance" }
  ])

  const [designations] = useState([
    { id: 1, name: "Software Engineer" },
    { id: 2, name: "Manager" },
    { id: 3, name: "Director" }
  ])

  const [shifts] = useState([
    { id: 1, name: "Morning Shift" },
    { id: 2, name: "Afternoon Shift" },
    { id: 3, name: "Night Shift" }
  ])

  const [locations] = useState([
    { id: 1, name: "Headquarters" },
    { id: 2, name: "Branch Office" },
    { id: 3, name: "Remote" }
  ])

  const [employees, setEmployees] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exportFormat, setExportFormat] = useState("csv")

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const exportToCSV = (data) => {
    const headers = [
      "First Name",
      "Last Name",
      "Mobile Number",
      "Email",
      "Department",
      "Designation",
      "Shift",
      "Office Location"
    ]

    const csvRows = [
      headers.join(','),
      ...data.map(employee => [
        employee.first_name,
        employee.last_name,
        employee.mobile_number,
        employee.email,
        departments.find(d => d.id.toString() === employee.department)?.name || '',
        designations.find(d => d.id.toString() === employee.designation)?.name || '',
        shifts.find(s => s.id.toString() === employee.shift)?.name || '',
        locations.find(l => l.id.toString() === employee.office_location)?.name || ''
      ].join(','))
    ].join('\n')

    return csvRows
  }

  const exportToJSON = (data) => {
    const formattedData = data.map(employee => ({
      first_name: employee.first_name,
      last_name: employee.last_name,
      mobile_number: employee.mobile_number,
      email: employee.email,
      department: departments.find(d => d.id.toString() === employee.department)?.name || '',
      designation: designations.find(d => d.id.toString() === employee.designation)?.name || '',
      shift: shifts.find(s => s.id.toString() === employee.shift)?.name || '',
      office_location: locations.find(l => l.id.toString() === employee.office_location)?.name || ''
    }))

    return JSON.stringify(formattedData, null, 2)
  }

  const handleExport = () => {
    let content
    let filename
    let type

    if (exportFormat === "csv") {
      content = exportToCSV(employees)
      filename = "employees.csv"
      type = "text/csv"
    } else {
      content = exportToJSON(employees)
      filename = "employees.json"
      type = "application/json"
    }

    const blob = new Blob([content], { type })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ... [Previous handleSubmit function remains the same] ...
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!/^\d{10}$/.test(formData.mobile_number)) {
        alert("Please enter a valid 10-digit mobile number")
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        alert("Please enter a valid email address")
        return
      }

      const newEmployee = {
        id: Date.now(),
        ...formData
      }
      setEmployees(prev => [...prev, newEmployee])

      setFormData({
        mobile_number: "",
        first_name: "",
        last_name: "",
        email: "",
        department: "",
        designation: "",
        shift: "",
        office_location: ""
      })

      alert("Employee added successfully!")
    } catch (error) {
      console.error("Error adding employee:", error)
      alert("Error adding employee. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Select
                value={exportFormat}
                onValueChange={setExportFormat}
              >
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

        {/* ... [Rest of the component remains the same] ... */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Employee</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ... [Form fields remain the same] ... */}
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
                <label className="text-sm font-medium">Mobile Number</label>
                <Input
                  required
                  value={formData.mobile_number}
                  onChange={(e) => handleInputChange("mobile_number", e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
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
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
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
                        <SelectItem key={desig.id} value={desig.id.toString()}>
                          {desig.name}
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
                        <SelectItem key={shift.id} value={shift.id.toString()}>
                          {shift.name}
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
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
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
                  <Card key={employee.id} className="p-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{`${employee.first_name} ${employee.last_name}`}</span>
                      <span className="text-muted-foreground">Mobile:</span>
                      <span>{employee.mobile_number}</span>
                      <span className="text-muted-foreground">Email:</span>
                      <span>{employee.email}</span>
                      <span className="text-muted-foreground">Department:</span>
                      <span>{departments.find(d => d.id.toString() === employee.department)?.name}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}