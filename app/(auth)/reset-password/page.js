"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
import { Building, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { AuthShell } from "@/components/AuthShell"
import { useToast } from "@/hooks/use-toast"
import { AxiosPost } from "@/context/AuthContext"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      })
      return
    }

    setIsLoading(true)

    try {
      const data = await AxiosPost("reset-password/", { 
        email, 
        password 
      })

      setIsSuccess(true)
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      })
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
      
    } catch (error) {
      console.error("Reset password error:", error)
      const errorMessage = error.response?.data?.error || "Failed to reset password. Please try again."
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthShell>
        <Card className="w-full max-w-md text-center rounded-2xl auth-gradient-border bg-card shadow-2xl shadow-blue-500/10">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Password Reset!</CardTitle>
            <CardDescription>
              Your password has been changed successfully. Redirecting you to login...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login Now</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-md rounded-2xl auth-gradient-border bg-card shadow-2xl shadow-blue-500/10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 brand-tile rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Set a new password for <span className="font-semibold text-primary">{email || "your account"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Wait! I remember it now.{" "}
              <Link href="/login" className="text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
