"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Header } from '@/components/Header';

export default function DesignationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [designations, setDesignations] = useState([
    { designation_id: 1, department: "IT", details: "Software Engineer" },
    { designation_id: 2, department: "HR", details: "HR Manager" },
    { designation_id: 3, department: "Finance", details: "Financial Analyst" },
  ])

  // Sample departments - in real app, this would come from API
  const departments = [
    "IT",
    "HR",
    "Finance",
    "Marketing",
    "Operations"
  ]

  const [isOpen, setIsOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentDesignation, setCurrentDesignation] = useState(null)
  const [formData, setFormData] = useState({
    details: "",
    department: ""
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDepartmentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      department: value
    }))
  }

  const resetForm = () => {
    setFormData({
      details: "",
      department: ""
    })
    setCurrentDesignation(null)
    setIsEditMode(false)
  }

  const handleOpenDialog = (designation = null) => {
    if (designation) {
      setFormData({
        details: designation.details,
        department: designation.department
      })
      setCurrentDesignation(designation)
      setIsEditMode(true)
    } else {
      resetForm()
    }
    setIsOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const designationData = {
      details: formData.details,
      department: formData.department
    }

    if (isEditMode && currentDesignation) {
      setDesignations(designations.map(designation => 
        designation.designation_id === currentDesignation.designation_id 
          ? { ...designationData, designation_id: designation.designation_id }
          : designation
      ))
      toast({
        title: "Designation Updated",
        description: `${designationData.details} has been updated successfully.`
      })
    } else {
      setDesignations([...designations, { 
        ...designationData, 
        designation_id: designations.length + 1 
      }])
      toast({
        title: "Designation Created",
        description: `${designationData.details} has been created successfully.`
      })
    }

    setIsOpen(false)
    resetForm()
  }

  const handleDelete = (designationId) => {
    if (confirm("Are you sure you want to delete this designation?")) {
      setDesignations(designations.filter(
        designation => designation.designation_id !== designationId
      ))
      toast({
        title: "Designation Deleted",
        description: "The designation has been deleted successfully.",
        variant: "destructive"
      })
    }
  }

  return (
    <>
    <Header/>
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Designation Management</h1>
        <div className="ml-auto">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Designation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Edit Designation" : "Create New Designation"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="details">Designation Details</Label>
                  <Input
                    id="details"
                    name="details"
                    value={formData.details}
                    onChange={handleInputChange}
                    placeholder="Enter designation details"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={handleDepartmentChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isEditMode ? "Update Designation" : "Create Designation"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Active Designations</h3>
          <div className="text-3xl font-bold">{designations.length}</div>
          <p className="text-sm text-muted-foreground">Current active designations</p>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Designation Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designations.map((designation) => (
              <TableRow key={designation.designation_id}>
                <TableCell className="font-medium">{designation.details}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(designation)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(designation.designation_id)}
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
  )
}