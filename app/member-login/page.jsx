
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth";
import { FaceLivenessDetectorCore } from "@aws-amplify/ui-react-liveness";
import { Smartphone, Lock, ArrowRight, Loader2 } from "lucide-react";

import { AuthShell } from "@/components/AuthShell";
import { useAuth, FastAPI, apiErrorMessage } from "@/context/AuthContext";
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

const CLEAR_SESSION_KEYS = [
  "access_token",
  "refresh_token",
  "org_id",
  "user_id",
  "user_mobile",
  "user_role",
];

export default function MemberLoginPage() {
  // State
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1);
  const [isFaceRegistered, setIsFaceRegistered] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState(null);
  const [livenessSessionId, setLivenessSessionId] = useState(null);
  const [livenessRegion, setLivenessRegion] = useState("ap-south-1");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { loginMember } = useAuth();
  const router = useRouter();

  const cleanMobileNumber = () =>
    mobileNumber.replace(/\D/g, "").slice(-10);

  // STEP 1: Verify credentials and receive a temporary token.
  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();

    const cleanMobile = cleanMobileNumber();

    if (cleanMobile.length !== 10 || !password) {
      setErrorMsg("Enter a valid 10-digit mobile number and password.");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);
    setPreAuthToken(null);
    setLivenessSessionId(null);

    try {
      // Do not allow a previous admin/member session to be reused.
      CLEAR_SESSION_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });

      const { data } = await FastAPI.post("member/login", {
        mobile_number: cleanMobile,
        password,
      });

      if (!data.pre_auth_token) {
        throw new Error(
          "The server did not return a pre-authentication token."
        );
      }

      // Temporary token stays in memory only.
      setPreAuthToken(data.pre_auth_token);

      // Determine whether this member already has a registered face.
      let faceRegistered;

      try {
        const { data: faceData } = await FastAPI.post(
          "face/check-status",
          { mobile_number: cleanMobile }
        );

        if (typeof faceData.is_face_registered !== "boolean") {
          throw new Error("Unexpected face registration response.");
        }

        faceRegistered = faceData.is_face_registered;
      } catch (error) {
        setPreAuthToken(null);
        setErrorMsg(
          apiErrorMessage(
            error,
            "Unable to check face registration. Please try again."
          )
        );
        return;
      }

      setIsFaceRegistered(faceRegistered);
      setStep(2);
    } catch (error) {
      setPreAuthToken(null);
      setErrorMsg(
        apiErrorMessage(error, "Invalid mobile number or password.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Create an AWS Face Liveness session.
  const createLivenessSession = async () => {
    setErrorMsg("");

    if (!preAuthToken) {
      setErrorMsg(
        "Your login session has expired. Please enter your credentials again."
      );
      return;
    }

    setIsLoading(true);

    try {
      // Keep this call: Amplify uses the AWS credentials for the detector.
      await fetchAuthSession();

      const { data } = await FastAPI.post(
        "face/liveness/create",
        {},
        {
          headers: {
            Authorization: `Bearer ${preAuthToken}`,
          },
        }
      );

      if (!data.session_id) {
        throw new Error("The server did not return a liveness session ID.");
      }

      setLivenessSessionId(data.session_id);
      setLivenessRegion(data.region || "ap-south-1");
    } catch (error) {
      setErrorMsg(
        apiErrorMessage(
          error,
          "Unable to start face liveness verification."
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Submit the liveness result and complete login.
  const handleLivenessComplete = async () => {
    if (!livenessSessionId || !preAuthToken) {
      setErrorMsg(
        "Your verification session is missing. Please try again."
      );
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    const cleanMobile = cleanMobileNumber();
    const sessionId = livenessSessionId;

    try {
      const mode = isFaceRegistered ? "verify" : "register";

      const { data } = await FastAPI.post(
        "face/liveness/result",
        {
          session_id: sessionId,
          mobile_number: cleanMobile,
          mode,
        },
        {
          headers: {
            Authorization: `Bearer ${preAuthToken}`,
          },
        }
      );

      // Require the expected success response for the selected mode.
      const faceSucceeded = isFaceRegistered
        ? data.status === "SUCCEEDED" && data.verified === true
        : data.status === "SUCCEEDED" && data.registered === true;

      if (!faceSucceeded) {
        setErrorMsg(
          data.message ||
            data.error ||
            (isFaceRegistered
              ? "Face verification failed. Please try again."
              : "Face registration failed. Please try again.")
        );

        // A consumed liveness session cannot be reused.
        setLivenessSessionId(null);
        return;
      }

      // The backend checks face_verified_at and prevents session replay.
      const result = await loginMember({
        mobile_number: cleanMobile,
        session_id: sessionId,
        pre_auth_token: preAuthToken,
      });

      if (!result.success) {
        setErrorMsg(
          result.message || "Unable to complete member login."
        );
        setLivenessSessionId(null);
        return;
      }

      setPreAuthToken(null);
      setLivenessSessionId(null);
      router.push("/member");
    } catch (error) {
      setErrorMsg(
        apiErrorMessage(
          error,
          "Face verification or login completion failed. Please try again."
        )
      );

      // The result endpoint consumes sessions once. A retry must create
      // a new session rather than reuse this one.
      setLivenessSessionId(null);
    } finally {
      setIsLoading(false);
    }
  };

  // AWS detector error.
  const handleLivenessError = () => {
    setErrorMsg(
      "Face liveness could not be completed. Please start a new verification."
    );
    setLivenessSessionId(null);
    setIsLoading(false);
  };

  // Reset the in-memory pre-auth session.
  const goBackToCredentials = () => {
    setStep(1);
    setPreAuthToken(null);
    setLivenessSessionId(null);
    setErrorMsg("");
    setPassword("");
  };

  return (
    <AuthShell>
      <Card className="w-full max-w-md relative z-10 overflow-hidden rounded-2xl auth-gradient-border bg-card shadow-2xl shadow-blue-500/10">
        <CardHeader className="space-y-2 pb-8 pt-10 text-center">
          <div className="mx-auto w-16 h-16 brand-tile rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <Smartphone className="text-white w-8 h-8" />
          </div>

          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
            Member Portal
          </CardTitle>

          <CardDescription className="text-xs font-bold text-muted-foreground opacity-70">
            {step === 1
              ? "Authorized Personnel Only"
              : "Biometric Protocol"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-12">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg text-center"
            >
              {errorMsg}
            </div>
          )}

          {step === 1 ? (
            <form
              onSubmit={handleCredentialsSubmit}
              className="space-y-6"
            >
              <div className="space-y-4">
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
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="10-digit number"
                    className="h-12 bg-foreground/5 border-foreground/10 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground/30"
                    value={mobileNumber}
                    onChange={(event) =>
                      setMobileNumber(event.target.value)
                    }
                    required
                  />
                </div>

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
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className="h-12 bg-foreground/5 border-foreground/10 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground/30"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                  />
                </div>
              </div>

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
            <div className="space-y-6">
              <div className="p-4 bg-foreground/5 rounded-xl border border-foreground/10 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground">
                    Credentials verified
                  </p>
                  <p className="text-sm font-bold text-foreground font-mono">
                    {mobileNumber}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={goBackToCredentials}
                  disabled={isLoading}
                  className="h-8 text-xs font-bold text-primary hover:text-primary/80 hover:bg-foreground/5"
                >
                  Change
                </Button>
              </div>

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

              {!livenessSessionId && (
                <Button
                  type="button"
                  onClick={createLivenessSession}
                  disabled={isLoading || !preAuthToken}
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
                          throw new Error(
                            "AWS credentials not available"
                          );
                        }

                        return session.credentials;
                      },
                    }}
                  />
                </div>
              )}

              {livenessSessionId && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    AWS Face Liveness Active
                  </p>
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground text-xs font-bold hover:text-foreground"
                onClick={goBackToCredentials}
                disabled={isLoading}
              >
                Cancel Protocol
              </Button>
            </div>
          )}

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
