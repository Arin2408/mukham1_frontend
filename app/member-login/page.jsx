"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { useRouter } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth";
import { FaceLivenessDetectorCore } from "@aws-amplify/ui-react-liveness";
import { Smartphone, Lock, ArrowRight, Loader2 } from "lucide-react";

import { useAuth, Axios } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import "@aws-amplify/ui-react/styles.css";
import "@/lib/amplify-config";

export default function MemberLoginPage() {
  // =========================================================
  // STATE
  // =========================================================
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1);
  const [isFaceRegistered, setIsFaceRegistered] = useState(false);
  const [livenessSessionId, setLivenessSessionId] = useState(null);
  const [livenessRegion, setLivenessRegion] = useState("ap-south-1");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // =========================================================
  // AUTH + ROUTER
  // =========================================================
  const { loginMember } = useAuth();
  const router = useRouter();

  // =========================================================
  // STEP 1 - MEMBER LOGIN
  // =========================================================
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();

    if (mobileNumber.length < 10 || !password) {
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10);

      // Verify mobile + password
      await Axios.post("member/login/", {
        mobile_number: cleanMobile,
        password: password,
      });

      // Check whether face is registered
      try {
        const { data: faceData } = await Axios.post("face/check-status/", {
          mobile_number: cleanMobile,
        });

        setIsFaceRegistered(faceData.is_face_registered);
      } catch (faceError) {
        console.error("Face status check failed:", faceError);
        setIsFaceRegistered(false);
      }

      // Go to biometric step
      setStep(2);
    } catch (error) {
      console.error("Credentials verification failed:", error);

      setErrorMsg(
        error.response?.data?.error || "Invalid mobile number or password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // CREATE AWS LIVENESS SESSION
  // =========================================================
  const createLivenessSession = async () => {
    setErrorMsg("");
    setIsLoading(true);

    try {
      const session = await fetchAuthSession();

      console.log("AWS IDENTITY ID:", session.identityId);
      console.log("AWS CREDENTIALS:", {
        accessKeyId: session.credentials?.accessKeyId,
        sessionToken: !!session.credentials?.sessionToken,
      });
      console.log("AWS CREDENTIALS REGION:", session.credentials?.expiration);

      const { data } = await Axios.post("face/liveness/create/");

      console.log("AWS Liveness Session Created:", data.session_id);

      setLivenessSessionId(data.session_id);
      setLivenessRegion(data.region || "ap-south-1");
    } catch (error) {
      console.error("Failed to create liveness session:", error);

      setErrorMsg(
        error.response?.data?.error ||
          "Unable to start face liveness verification."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // LIVENESS COMPLETE
  // =========================================================
  const handleLivenessComplete = async () => {
    if (!livenessSessionId) {
      setErrorMsg("Liveness session not found. Please try again.");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10);

    try {
      // New member      -> isFaceRegistered = false -> mode = register
      // Existing member -> isFaceRegistered = true  -> mode = verify
      const mode = isFaceRegistered ? "verify" : "register";

      console.log(`Face Liveness Mode: ${mode}`);

      // Send AWS Liveness result to backend
      const { data } = await Axios.post("face/liveness/result/", {
        session_id: livenessSessionId,
        mobile_number: cleanMobile,
        mode: mode,
      });

      console.log("AWS Liveness Result:", data);

      // =====================================================
      // NEW MEMBER - FACE REGISTRATION
      // =====================================================
      if (!isFaceRegistered) {
        if (data.status !== "SUCCEEDED" || !data.registered) {
          setErrorMsg(
            data.message ||
              data.error ||
              "Face registration failed. Please try again."
          );
          setLivenessSessionId(null);
          return;
        }

        console.log("Face registration successful.");
        setIsFaceRegistered(true);

        // Final member login
        const res = await loginMember({
          mobile_number: cleanMobile,
          password: password,
        });

        if (res.success) {
          router.push("/member");
        } else {
          setErrorMsg(
            res.message || "Authentication failed after face registration."
          );
        }

        return;
      }

      // =====================================================
      // EXISTING MEMBER - FACE VERIFICATION
      // =====================================================
      if (data.status !== "SUCCEEDED" || !data.verified) {
        setErrorMsg(
          data.message ||
            data.error ||
            "Face verification failed. Please try again."
        );
        setLivenessSessionId(null);
        return;
      }

      console.log(
        `Face verification successful for ${cleanMobile}. ` +
          `Liveness confidence: ${data.liveness_confidence}, ` +
          `Face similarity: ${data.similarity}`
      );

      // Final member login
      const res = await loginMember({
        mobile_number: cleanMobile,
        password: password,
      });

      if (res.success) {
        router.push("/member");
      } else {
        setErrorMsg(res.message || "Authentication failed during final step.");
      }
    } catch (error) {
      console.error("Liveness + face operation failed:", error);

      setErrorMsg(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Face operation failed. Please try again."
      );

      setLivenessSessionId(null);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // LIVENESS ERROR
  // =========================================================
  const handleLivenessError = (error) => {
    console.error("AWS Face Liveness Error:", error);

    setErrorMsg("Face liveness could not be completed. Please try again.");
    setLivenessSessionId(null);
    setIsLoading(false);
  };

  // =========================================================
  // RESET
  // =========================================================
  const goBackToCredentials = () => {
    setStep(1);
    setLivenessSessionId(null);
    setErrorMsg("");
  };

  // =========================================================
  // UI
  // =========================================================
  return (
    <AuthShell>

      {/* CARD */}
      <Card className="w-full max-w-md relative z-10 overflow-hidden rounded-2xl auth-gradient-border bg-card shadow-2xl shadow-blue-500/10">
        {/* HEADER */}
        <CardHeader className="space-y-2 pb-8 pt-10 text-center">
          <div className="mx-auto w-16 h-16 brand-tile rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <Smartphone className="text-white w-8 h-8" />
          </div>

          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
            Member Portal
          </CardTitle>

          <CardDescription className="text-xs font-bold text-muted-foreground opacity-70">
            {step === 1 ? "Authorized Personnel Only" : "Biometric Protocol"}
          </CardDescription>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="space-y-6 px-8 pb-12">
          {/* ERROR MESSAGE */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg text-center">
              {errorMsg}
            </div>
          )}

          {step === 1 ? (
            /* STEP 1 - CREDENTIALS */
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* MOBILE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label
                      htmlFor="mobile"
                      className="text-xs font-bold text-muted-foreground ml-1"
                    >
                      Mobile Number
                    </Label>
                    <Smartphone className="h-3 w-3 text-primary/40" />
                  </div>

                  <Input
                    id="mobile"
                    type="text"
                    placeholder="10-digit number"
                    className="h-12 bg-foreground/5 border-foreground/10 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground/30"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                  />
                </div>

                {/* PASSWORD */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label
                      htmlFor="password"
                      className="text-xs font-bold text-muted-foreground ml-1"
                    >
                      Member Password
                    </Label>
                    <Lock className="h-3 w-3 text-primary/40" />
                  </div>

                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    className="h-12 bg-foreground/5 border-foreground/10 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <Button
                type="submit"
                className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/20 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Identifying...
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    Access Portal
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            /* STEP 2 - FACE LIVENESS */
            <div className="space-y-6">
              {/* USER INFO */}
              <div className="p-4 bg-foreground/5 rounded-xl border border-foreground/10 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground">
                    Authenticated
                  </p>
                  <p className="text-sm font-bold text-foreground font-mono">
                    {mobileNumber}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBackToCredentials}
                  className="h-8 text-xs font-bold text-primary hover:text-primary/80 hover:bg-foreground/5"
                >
                  Change
                </Button>
              </div>

              {/* TITLE */}
              <div className="text-center space-y-2">
                <h3 className="text-sm font-bold text-foreground">
                  {isFaceRegistered
                    ? "Biometric Verification"
                    : "Secure Enrollment"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Complete the AWS Face Liveness check.
                </p>
              </div>

              {/* CREATE SESSION */}
              {!livenessSessionId && (
                <Button
                  onClick={createLivenessSession}
                  disabled={isLoading}
                  className="w-full h-12"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting Liveness...
                    </div>
                  ) : (
                    "Start AWS Face Liveness"
                  )}
                </Button>
              )}

              {/* AWS FACE LIVENESS */}
              {livenessSessionId && (
                <div className="rounded-2xl overflow-hidden border border-foreground/10 bg-black/40">
                  <FaceLivenessDetectorCore
                    sessionId={livenessSessionId}
                    region={livenessRegion}
                    onAnalysisComplete={handleLivenessComplete}
                    onError={handleLivenessError}
                    config={{
                      credentialProvider: async () => {
                        const session = await fetchAuthSession();

                        if (!session.credentials) {
                          throw new Error("AWS credentials not available");
                        }

                        return session.credentials;
                      },
                    }}
                  />
                </div>
              )}

              {/* SESSION STATUS */}
              {livenessSessionId && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    AWS Face Liveness Active
                  </p>
                </div>
              )}

              {/* CANCEL */}
              <Button
                variant="ghost"
                className="w-full text-muted-foreground text-xs font-bold hover:text-foreground"
                onClick={goBackToCredentials}
                disabled={isLoading}
              >
                Cancel Protocol
              </Button>
            </div>
          )}

          {/* FOOTER LINK */}
          <div className="mt-8 pt-6 border-t border-foreground/5 text-center">
            <p className="text-xs text-muted-foreground">
              Admin Personnel?{" "}
              <Link
                href="/"
                className="text-primary hover:text-primary/80 font-bold transition-colors"
              >
                Return Entry
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}