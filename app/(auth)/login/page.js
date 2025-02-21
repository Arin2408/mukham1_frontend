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
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"


export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    mobile_number: "",
    password: ""
  })

  const handlePhoneChange = (value) => {
  setFormData((prev) => ({
    ...prev,
    mobile_number: value,
  }));
};


  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/org/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Show success toast
        toast({
          title: "Login successful",
          description: "Welcome to the dashboard",
        })

        // Set the access and refresh tokens in localStorage
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)

        // Redirect to the dashboard using router.push
        router.push("/dashboard")
      } else {
        // Show error toast with the message from backend
        toast({
          variant: "destructive",
          title: "Login failed",
          description: data.detail || "Invalid login credentials",
        })
      }
    } catch (error) {
      // Show error toast
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during login",
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
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
  <Label htmlFor="mobile_number">Phone Number</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input 
                Label='password'
                id="password" 
                type="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <Button 
              className="w-full" 
              size="lg" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="text-center text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
