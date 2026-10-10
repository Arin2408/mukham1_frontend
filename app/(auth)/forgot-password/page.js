"use client"

import { useState } from "react"
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
import { Building, Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthShell } from "@/components/AuthShell"
import { useToast } from "@/hooks/use-toast"

import { FastAPIPost, apiErrorMessage } from "@/context/AuthContext"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = await FastAPIPost("forgot-password", { email })

      toast({
        title: "Success",
        description: data.message || "Reset link sent to your email",
      })
    } catch (error) {
      console.error("Forgot password error:", error)
      const errorMessage = apiErrorMessage(error, "Something went wrong. Please try again.")
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
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
          <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
            <div className="text-center text-sm">
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