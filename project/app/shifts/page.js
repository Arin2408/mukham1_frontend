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
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/Header";

export default function ShiftsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [shifts, setShifts] = useState([
    { id: 1, name: "Morning Shift", time: "6:00 AM - 2:00 PM", department: "Production" },
    { id: 2, name: "Day Shift", time: "2:00 PM - 10:00 PM", department: "Assembly" },
    { id: 3, name: "Night Shift", time: "10:00 PM - 6:00 AM", department: "Packaging" },
  ])

  const departments = [
    "Production",
    "Assembly",
    "Packaging",
    "Maintenance",
    "Quality Control"
  ]

  const [isOpen, setIsOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentShift, setCurrentShift] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
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
      name: "",
      startTime: "",
      endTime: "",
      department: ""
    })
    setCurrentShift(null)
    setIsEditMode(false)
  }

  const handleOpenDialog = (shift = null) => {
    if (shift) {
      const [startTime, endTime] = shift.time.split(" - ")
      setFormData({
        name: shift.name,
        startTime,
        endTime,
        department: shift.department
      })
      setCurrentShift(shift)
      setIsEditMode(true)
    } else {
      resetForm()
    }
    setIsOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const shiftData = {
      name: formData.name,
      time: `${formData.startTime} - ${formData.endTime}`,
      department: formData.department
    }

    if (isEditMode && currentShift) {
      setShifts(shifts.map(shift =>
        shift.id === currentShift.id
          ? { ...shiftData, id: shift.id }
          : shift
      ))
      toast({
        title: "Shift Updated",
        description: `${shiftData.name} has been updated successfully.`
      })
    } else {
      setShifts([...shifts, { ...shiftData, id: shifts.length + 1 }])
      toast({
        title: "Shift Created",
        description: `${shiftData.name} has been created successfully.`
      })
    }

    setIsOpen(false)
    resetForm()
  }

  const handleDelete = (shiftId) => {
    if (confirm("Are you sure you want to delete this shift?")) {
      setShifts(shifts.filter(shift => shift.id !== shiftId))
      toast({
        title: "Shift Deleted",
        description: "The shift has been deleted successfully.",
        variant: "destructive"
      })
    }
  }

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
                  <DialogTitle>{isEditMode ? "Edit Shift" : "Create New Shift"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Shift Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter shift name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        placeholder="e.g., 9:00 AM"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        placeholder="e.g., 5:00 PM"
                        required
                      />
                    </div>
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
                      {isEditMode ? "Update Shift" : "Create Shift"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active Shifts</h3>
            <div className="text-3xl font-bold">{shifts.length}</div>
            <p className="text-sm text-muted-foreground">Current active shifts</p>
          </Card>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift Name</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.name}</TableCell>
                  <TableCell>{shift.time}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(shift)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
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
  )
}
