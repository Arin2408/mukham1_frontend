"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LogIn, Phone, Lock, Smartphone, ArrowRight, Camera, ShieldCheck } from "lucide-react";
import { Axios } from "@/context/AuthContext";
import FaceCamera from "@/components/FaceCamera";

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
      
      // 1. First, verify if mobile and password are correct
      // We call member/login but we don't redirect yet if face is required
      const { data } = await Axios.post("member/login/", { 
        mobile_number: cleanMobile,
        password: password
      });

      // 2. Check face status
      let faceRegistered = false;
      try {
        const { data: faceData } = await Axios.post("face/check-status/", { mobile_number: cleanMobile });
        faceRegistered = faceData.is_face_registered;
        setIsFaceRegistered(faceRegistered);
      } catch (fErr) {
        setIsFaceRegistered(false);
      }

      // 3. Flow Logic: If already registered, skip face and login now.
      if (faceRegistered) {
        const res = await loginMember({ mobile_number: mobileNumber, password: password });
        if (res.success) {
          router.push("/member");
          return;
        } else {
          throw new Error(res.message || "Final authentication failed");
        }
      }

      // 4. If NOT registered, go to step 2 (Face Registration)
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
        // Path A: Registering face for the first time
        await Axios.post("face/register/", {
          mobile_number: cleanMobile,
          face_image_base64: base64Image
        });
        setIsFaceRegistered(true);
      } else {
        // Path B: Verify face
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

      // If we reach here, credentials were confirmed in step 1 and face is now confirmed/registered
      // We complete the login using the same credentials from step 1
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/10 transition-all duration-500">
        <CardHeader className="space-y-1 text-center bg-primary/5 rounded-t-xl pb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Smartphone className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Member Portal</CardTitle>
          <CardDescription>
            {step === 1 ? "Enter your credentials to begin" : "Biometric Verification"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          {errorMsg && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg text-center animate-in fade-in zoom-in duration-300">
              {errorMsg}
            </div>
          )}
          
          {step === 1 ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-sm font-semibold">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mobile"
                      type="text"
                      placeholder="10-digit mobile number"
                      className="pl-10 h-11"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold">Member Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10 h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">
                    Format: 5 digits of mobile + 5 letters of name (lowercase)
                  </p>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-lg group" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-3 bg-muted rounded-lg flex items-center justify-between mb-4">
                <div className="flex flex-col">
                   <span className="text-xs text-muted-foreground">Authenticated as</span>
                   <span className="text-sm font-bold">{mobileNumber}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="h-7 text-xs">Change</Button>
              </div>

              <div className="text-center space-y-2 mb-4">
                <h3 className="font-semibold text-lg">
                  {isFaceRegistered ? "Verify your face" : "Register your face"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Look at the camera and ensure your face is clearly visible
                </p>
              </div>

              <div className="py-2">
                <FaceCamera 
                  isRegistered={isFaceRegistered} 
                  isLoading={isLoading} 
                  onCapture={handleFaceAction} 
                />
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground text-xs"
                onClick={() => setStep(1)}
              >
                Back to credentials
              </Button>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Organization Admin? {" "}
              <a href="/" className="text-primary hover:underline font-medium">Back to Login</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
