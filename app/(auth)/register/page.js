"use client"

import { useState, useContext } from "react"
import { useRouter } from "next/navigation"
import { AuthContext } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
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
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { registerUser } = useContext(AuthContext) // Get register function from AuthContext
  const [isLoading, setIsLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_number: "",
  })

  const handlePhoneChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      mobile_number: value,
    }))
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await registerUser(formData) // Use registerUser from context

      if (response?.success) {
        setGeneratedPassword(response.generated_password || "Check SMS for your password")

        toast({
          title: "Registration successful",
          description: "Your organization has been registered successfully.",
        })
      } else {
        throw new Error(response?.message || "An error occurred during registration")
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
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_number">Phone Number</Label>
              <PhoneInput
                country={"in"} 
                value={formData.mobile_number}
                onChange={handlePhoneChange}
                inputProps={{
                  name: "mobile_number",
                  required: true,
                  autoFocus: false,
                }}
                enableSearch={true} 
                countryCodeEditable={false} 
              />
            </div>
            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register Organization"}
            </Button>
            {generatedPassword && (
              <div className="mt-3 text-center text-sm font-medium text-green-600">
                Your password: <span className="font-bold">{generatedPassword}</span>
              </div>
            )}
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
