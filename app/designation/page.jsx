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
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Header } from '@/components/Header'
import { jwtDecode } from "jwt-decode"

// Helper functions to get access token and org_id from localStorage
const getAccessToken = () => localStorage.getItem("access_token")
const getOrgId = () => localStorage.getItem("org_id")

// Token verification function
const verifyToken = async (token, router, toast) => {
  if (!token) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "No token found. Please login again.",
    })
    router.push("/login")
    return false
  }

  try {
    const decodedToken = jwtDecode(token)
    if (Date.now() >= decodedToken.exp * 1000) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Session expired. Please login again.",
      })
      localStorage.removeItem("access_token")
      localStorage.removeItem("org_id")
      router.push("/login")
      return false
    }

    const response = await fetch("http://127.0.0.1:8000/api/token/verify/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Invalid token")
    }

    return true
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message,
    })
    localStorage.removeItem("access_token")
    localStorage.removeItem("org_id")
    router.push("/login")
    return false
  }
}

export default function DesignationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [designations, setDesignations] = useState([])
  const [departments, setDepartments] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentDesignation, setCurrentDesignation] = useState(null)
  const [formData, setFormData] = useState({
    details: "",
    department: "",
    org_id: getOrgId(),
  })
  const [isLoading, setIsLoading] = useState(false)

  // Fetch designations and departments on component mount
  useEffect(() => {
    fetchDesignations()
    fetchDepartments()
  }, [])

  // Fetch designations from API
  const fetchDesignations = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      router.push("/login")
      return
    }

    const tokenValid = await verifyToken(token, router, toast)
    if (!tokenValid) return

    try {
      const response = await fetch("http://127.0.0.1:8000/api/designations/", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch designations")

      const data = await response.json()
      setDesignations(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
  }, [router, toast])

  // Fetch departments from API
  const fetchDepartments = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      router.push("/login")
      return
    }

    const tokenValid = await verifyToken(token, router, toast)
    if (!tokenValid) return

    try {
      const response = await fetch("http://127.0.0.1:8000/api/departments/", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch departments")

      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
  }, [router, toast])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDepartmentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      department: value,
    }))
  }

  const resetForm = () => {
    setFormData({
      details: "",
      department: "",
      org_id: getOrgId(),
    })
    setCurrentDesignation(null)
    setIsEditMode(false)
  }

  const handleOpenDialog = (designation = null) => {
    if (designation) {
      setFormData({
        details: designation.details,
        department: designation.department,
        org_id: designation.org_id,
      })
      setCurrentDesignation(designation)
      setIsEditMode(true)
    } else {
      resetForm()
    }
    setIsOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = getAccessToken()
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No token found. Please login again.",
      })
      router.push("/login")
      return
    }

    const tokenValid = await verifyToken(token, router, toast)
    if (!tokenValid) return

    setIsLoading(true)
    try {
      const url = isEditMode && currentDesignation
        ? `http://127.0.0.1:8000/api/designations/update/${currentDesignation.designation_id}/`
        : "http://127.0.0.1:8000/api/designations/add/"

      const method = isEditMode && currentDesignation ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          details: formData.details,
          department: formData.department,
          org_id: formData.org_id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to save designation")
      }

      toast({
        title: "Success",
        description: `Designation ${isEditMode ? "updated" : "created"} successfully.`,
      })

      setIsOpen(false)
      resetForm()
      fetchDesignations()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (designationId) => {
    if (confirm("Are you sure you want to delete this designation?")) {
      const token = getAccessToken()
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No token found. Please login again.",
        })
        router.push("/login")
        return
      }

      const tokenValid = await verifyToken(token, router, toast)
      if (!tokenValid) return

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/designations/delete/${designationId}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Failed to delete designation")
        }

        toast({
          title: "Designation Deleted",
          description: "The designation has been deleted successfully.",
          variant: "destructive",
        })

        fetchDesignations()
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        })
      }
    }
  }

  return (
    <>
      <Header />
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
                          <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                            {dept.details}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Saving..." : isEditMode ? "Update Designation" : "Create Designation"}
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
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {designations.map((designation) => (
                <TableRow key={designation.designation_id}>
                  <TableCell className="font-medium">{designation.details}</TableCell>
                  <TableCell>{designation.department}</TableCell>
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