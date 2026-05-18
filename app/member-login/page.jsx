"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Smartphone, Lock, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { Axios } from "@/context/AuthContext";
import FaceCamera from "@/components/FaceCamera";
import Link from "next/link";

export default function MemberLoginPage() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Credentials, 2: Face Verification
  const [isFaceRegistered, setIsFaceRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { loginMember } = useAuth();
  const router = useRouter();

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (mobileNumber.length < 10 || !password) return;
    
    setErrorMsg("");
    setIsLoading(true);
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10);
      
      const { data } = await Axios.post("member/login/", { 
        mobile_number: cleanMobile,
        password: password
      });

      let faceRegistered = false;
      try {
        const { data: faceData } = await Axios.post("face/check-status/", { mobile_number: cleanMobile });
        faceRegistered = faceData.is_face_registered;
        setIsFaceRegistered(faceRegistered);
      } catch (fErr) {
        setIsFaceRegistered(false);
      }

      if (faceRegistered) {
        const res = await loginMember({ mobile_number: mobileNumber, password: password });
        if (res.success) {
          router.push("/member");
          return;
        } else {
          throw new Error(res.message || "Final authentication failed");
        }
      }

      setStep(2);
    } catch (error) {
      console.error("Credentials verification failed", error);
      setErrorMsg(error.response?.data?.error || "Invalid mobile number or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceAction = async (base64Image) => {
    setErrorMsg("");
    setIsLoading(true);
    const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10);

    try {
      if (!isFaceRegistered) {
        await Axios.post("face/register/", {
          mobile_number: cleanMobile,
          face_image_base64: base64Image
        });
        setIsFaceRegistered(true);
      } else {
        const { data } = await Axios.post("face/verify/", {
          mobile_number: cleanMobile,
          face_image_base64: base64Image
        });
        
        if (!data.verified) {
          setErrorMsg("Face verification failed. Please try again.");
          setIsLoading(false);
          return;
        }
      }

      const res = await loginMember({ mobile_number: mobileNumber, password: password });
      if (res.success) {
        router.push("/member");
      } else {
        setErrorMsg(res.message || "Authentication failed during final step.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Face action failed", error);
      setErrorMsg(error.response?.data?.error || "Face operation failed. Please try again.");
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
        <CardHeader className="space-y-2 pb-8 pt-10 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
            <Smartphone className="text-primary w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tighter text-white uppercase">Member Portal</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground opacity-70">
            {step === 1 ? "Authorized Personnel Only" : "Biometric Protocol"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8 pb-12">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-lg text-center animate-in fade-in zoom-in duration-300">
              {errorMsg}
            </div>
          )}
          
          {step === 1 ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="mobile" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Mobile Number</Label>
                    <Smartphone className="h-3 w-3 text-primary/40" />
                  </div>
                  <Input
                    id="mobile"
                    type="text"
                    placeholder="10-digit number"
                    className="h-12 bg-white/5 border-white/10 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder:text-muted-foreground/30"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="password" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Member Password</Label>
                    <Lock className="h-3 w-3 text-primary/40" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    className="h-12 bg-white/5 border-white/10 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder:text-muted-foreground/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Identifying...
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    Access Portal <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Authenticated</p>
                  <p className="text-sm font-bold text-white font-mono tracking-widest">{mobileNumber}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="h-8 text-[10px] font-bold uppercase text-primary hover:text-primary/80 hover:bg-white/5">Change</Button>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                  {isFaceRegistered ? "Biometric Verification" : "Secure Enrollment"}
                </h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Position your face within the frame for protocol confirmation.
                </p>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                <FaceCamera 
                  isRegistered={isFaceRegistered} 
                  isLoading={isLoading} 
                  onCapture={handleFaceAction} 
                />
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] hover:text-white"
                onClick={() => setStep(1)}
              >
                Cancel Protocol
              </Button>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Admin Personnel? {" "}
              <Link href="/" className="text-primary hover:text-primary/80 font-bold transition-colors">Return Entry</Link>
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
