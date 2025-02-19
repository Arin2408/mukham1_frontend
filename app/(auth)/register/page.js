"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "hooks/use-toast.ts"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    password: ""
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
   
    try {
      // API call to backend to register organization
      const response = await fetch('http://127.0.0.1:8000/api/org/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          mobile_number: formData.mobile_number,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Registration successful",
          description: "Your organization has been registered successfully",
        })
       
        // Add a small delay to allow the toast to show
        await new Promise(resolve => setTimeout(resolve, 500))
       
        // Redirect to login page after successful registration
        router.push("/login")
      } else {
        throw new Error(data?.error || "An error occurred during registration")
      }
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <Building className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Register Organization</CardTitle>
          <CardDescription className="text-center">
            Create an account for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="Enter organization name"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="organization@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="mobile_number">Phone Number</Label>
              <Input
                id="mobile_number"
                type="tel"
                placeholder="Enter phone number"
                value={formData.mobile_number}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="password"> Headquaters Location</Label>
              <Input
                id="location"
                type="loacation"
                value={formData.location}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div> */}
            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register Organization"}
            </Button>
          </form>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}