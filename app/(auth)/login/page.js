"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Building, ShieldCheck, Lock, Smartphone, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { loginUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    mobile_number: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (value) => {
    const formattedNumber = value.replace("+", "").trim();
    setFormData((prev) => ({
      ...prev,
      mobile_number: formattedNumber,
    }));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await loginUser(formData);
      if (res?.success) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02040a] px-4 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 aurora-flow opacity-20 pointer-events-none" />
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-slow-pulse" />
      
      <Card className="w-full max-w-md quantanex-card relative z-10 overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="space-y-2 pb-8 pt-10">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/20 relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <Building className="h-10 w-10 text-primary relative z-10" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center tracking-tighter text-white">
            Welcome back
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8 pb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="mobile_number" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  Mobile Number
                </Label>
                <Smartphone className="h-3 w-3 text-primary/40" />
              </div>
              <PhoneInput
                country={"in"}
                value={formData.mobile_number}
                onChange={handlePhoneChange}
                containerClass="!bg-transparent"
                inputClass="!w-full !h-12 !bg-white/5 !border-white/10 !text-white !rounded-lg focus:!border-primary/50 focus:!ring-1 focus:!ring-primary/50 transition-all placeholder:text-muted-foreground/30"
                buttonClass="!bg-transparent !border-white/10 !rounded-l-lg"
                dropdownClass="!bg-[#11141b] !text-white !border-white/10"
                inputProps={{
                  name: "mobile_number",
                  required: true,
                }}
                countryCodeEditable={false}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  Password
                </Label>
                <Lock className="h-3 w-3 text-primary/40" />
              </div>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="h-12 bg-white/5 border-white/10 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30 text-white"
                placeholder="••••••••"
              />
            </div>

            <Button
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ShieldCheck className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
          
          <div className="text-center pt-2">
            <Link 
              href="/forgot-password" 
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-black"
            >
              Forgot Password ?
            </Link>
          </div>
          <div className="text-center pt-4 border-t border-white/5">
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Not Registered ? {" "}
                <Link href="/register" className="text-primary font-bold hover:text-primary/80 transition-colors">Create Account</Link>
             </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="absolute bottom-8 text-center w-full">
        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.3em]">
          Mukham Security Systems &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
