"use client"

import { Button } from "@/components/ui/button"
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
import { Plus, Search, ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from '@/components/Header';

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState([
    { id: 1, name: "Admin", permissions: "Full Access", members: 5 },
    { id: 2, name: "Manager", permissions: "Manage Team", members: 12 },
    { id: 3, name: "Employee", permissions: "Basic Access", members: 84 },
    { id: 4, name: "HR", permissions: "HR Access", members: 3 },
    { id: 5, name: "Supervisor", permissions: "Team Lead", members: 8 },
  ])

  const [isOpen, setIsOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentRole, setCurrentRole] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    permissions: "",
    members: ""
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      permissions: "",
      members: ""
    })
    setCurrentRole(null)
    setIsEditMode(false)
  }

  const handleOpenDialog = (role = null) => {
    if (role) {
      setFormData({
        name: role.name,
        permissions: role.permissions,
        members: role.members.toString()
      })
      setCurrentRole(role)
      setIsEditMode(true)
    } else {
      resetForm()
    }
    setIsOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const roleData = {
      name: formData.name,
      permissions: formData.permissions,
      members: parseInt(formData.members)
    }

    if (isEditMode && currentRole) {
      setRoles(roles.map(role => 
        role.id === currentRole.id 
          ? { ...roleData, id: role.id }
          : role
      ))
    } else {
      setRoles([...roles, { ...roleData, id: roles.length + 1 }])
    }

    setIsOpen(false)
    resetForm()
  }

  const handleDelete = (roleId) => {
    if (confirm("Are you sure you want to delete this role?")) {
      setRoles(roles.filter(role => role.id !== roleId))
    }
  }

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.permissions.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
    <Header/>
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        {/* <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button> */}
        <h1 className="text-3xl font-bold">Roles Management</h1>
        <div className="ml-auto">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Role" : "Create New Role"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter role name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permissions">Permissions</Label>
                  <Input
                    id="permissions"
                    name="permissions"
                    value={formData.permissions}
                    onChange={handleInputChange}
                    placeholder="Enter permissions"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="members">Number of Members</Label>
                  <Input
                    id="members"
                    name="members"
                    type="number"
                    value={formData.members}
                    onChange={handleInputChange}
                    placeholder="Enter number of members"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isEditMode ? "Update Role" : "Create Role"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search roles..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>{role.permissions}</TableCell>
                <TableCell>{role.members}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(role)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(role.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    </>
  )
}