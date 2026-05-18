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
import { Building2, Mail, Phone, Loader2, ArrowRight, ShieldCheck, Building } from "lucide-react"
import Link from "next/link"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { registerUser } = useContext(AuthContext)
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
      const response = await registerUser(formData)

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
    <div className="min-h-screen flex items-center justify-center bg-[#02040a] px-4 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 aurora-flow opacity-20 pointer-events-none" />
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-slow-pulse" />
      
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
        <Card className="quantanex-card relative z-10 overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-xl">
          <CardHeader className="space-y-2 pb-8 pt-10 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
              <Building className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tighter text-white uppercase">Register Organization</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Organization Name</Label>
                <div className="relative group">
                   <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                   <Input
                    id="name"
                    placeholder="Enter organization name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className="h-12 bg-white/5 border-white/10 pl-10 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</Label>
                <div className="relative group">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                   <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className="h-12 bg-white/5 border-white/10 pl-10 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_number" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Phone Number</Label>
                <div className="relative dark-phone-input">
                  <PhoneInput
                    country={"in"} 
                    value={formData.mobile_number}
                    onChange={handlePhoneChange}
                    disabled={isLoading}
                    inputProps={{
                      name: "mobile_number",
                      required: true,
                    }}
                    containerClass="!bg-transparent"
                    inputClass="!w-full !h-12 !bg-white/5 !border-white/10 !text-white !rounded-lg focus:!border-primary/50 focus:!ring-1 focus:!ring-primary/50 transition-all !pl-12"
                    buttonClass="!bg-transparent !border-white/10 !rounded-l-lg"
                    dropdownClass="!bg-[#11141b] !text-white !border-white/10"
                    enableSearch={true} 
                    countryCodeEditable={false} 
                  />
                </div>
              </div>

              <Button
                className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Initializing...
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    Register Organization <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>

              {generatedPassword && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center animate-in fade-in slide-in-from-top-4">
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Temporary Password</p>
                  <p className="text-lg font-mono font-bold text-white tracking-widest">{generatedPassword}</p>
                </div>
              )}
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Existing Organization ? {" "}
                <Link href="/login" className="text-primary font-bold hover:text-primary/80 transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-8 text-center w-full">
        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.3em]">
          Mukham Security Systems &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
