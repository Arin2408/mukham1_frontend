"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";

import {
  Smartphone,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { Axios } from "@/context/AuthContext";

import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";

import "@aws-amplify/ui-react/styles.css";

import "@/lib/amplify-config";

import Link from "next/link";


export default function MemberLoginPage() {

  // =========================================================
  // STATE
  // =========================================================

  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");

  const [step, setStep] = useState(1);

  const [isFaceRegistered, setIsFaceRegistered] = useState(false);

  const [livenessSessionId, setLivenessSessionId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");


  // =========================================================
  // AUTH + ROUTER
  // =========================================================

  const { loginMember } = useAuth();

  const router = useRouter();


  // =========================================================
  // STEP 1
  // MEMBER LOGIN
  // =========================================================

  const handleCredentialsSubmit = async (e) => {

    e.preventDefault();

    if (mobileNumber.length < 10 || !password) {
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {

      const cleanMobile = mobileNumber
        .replace(/\D/g, "")
        .slice(-10);


      // -----------------------------------------------------
      // Verify mobile + password
      // -----------------------------------------------------

      await Axios.post(
        "member/login/",
        {
          mobile_number: cleanMobile,
          password: password,
        }
      );


      // -----------------------------------------------------
      // Check whether face is registered
      // -----------------------------------------------------

      try {

        const { data: faceData } = await Axios.post(
          "face/check-status/",
          {
            mobile_number: cleanMobile,
          }
        );

        setIsFaceRegistered(
          faceData.is_face_registered
        );

      } catch (faceError) {

        console.error(
          "Face status check failed:",
          faceError
        );

        setIsFaceRegistered(false);
      }


      // -----------------------------------------------------
      // Go to biometric step
      // -----------------------------------------------------

      setStep(2);

    } catch (error) {

      console.error(
        "Credentials verification failed:",
        error
      );

      setErrorMsg(
        error.response?.data?.error ||
        "Invalid mobile number or password."
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

      const { data } = await Axios.post(
        "face/liveness/create/"
      );

      console.log(
        "AWS Liveness Session Created:",
        data.session_id
      );

      setLivenessSessionId(
        data.session_id
      );

    } catch (error) {

      console.error(
        "Failed to create liveness session:",
        error
      );

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

      setErrorMsg(
        "Liveness session not found. Please try again."
      );

      return;
    }

    setErrorMsg("");
    setIsLoading(true);


    const cleanMobile = mobileNumber
      .replace(/\D/g, "")
      .slice(-10);


    try {

      // -----------------------------------------------------
      // Backend gets:
      //
      // 1. AWS Liveness result
      // 2. AWS ReferenceImage
      // 3. Registered employee face
      // 4. CompareFaces
      // -----------------------------------------------------

      const { data } = await Axios.post(
        "face/liveness/result/",
        {
          session_id: livenessSessionId,
          mobile_number: cleanMobile,
        }
      );


      console.log(
        "AWS Liveness + Face Verification Result:",
        data
      );


      // -----------------------------------------------------
      // Read backend verification result
      // -----------------------------------------------------

      const status = data.status;

      const verified = data.verified;


      // -----------------------------------------------------
      // Liveness OR face identity failed
      // -----------------------------------------------------

      if (
        status !== "SUCCEEDED" ||
        !verified
      ) {

        setErrorMsg(
          data.message ||
          "Face verification failed. Please try again."
        );

        setLivenessSessionId(null);

        return;
      }


      // -----------------------------------------------------
      // Both checks passed
      //
      // 1. Real person
      // 2. Face matches registered employee
      // -----------------------------------------------------

      console.log(
        `Face verification successful for ${cleanMobile}. ` +
        `Liveness confidence: ${data.liveness_confidence}, ` +
        `Face similarity: ${data.similarity}`
      );


      // -----------------------------------------------------
      // Final member login
      // -----------------------------------------------------

      const res = await loginMember({
        mobile_number: cleanMobile,
        password: password,
      });


      if (res.success) {

        router.push("/member");

      } else {

        setErrorMsg(
          res.message ||
          "Authentication failed during final step."
        );
      }

    } catch (error) {

      console.error(
        "Liveness + face verification failed:",
        error
      );


      setErrorMsg(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Face verification failed. Please try again."
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

    console.error(
      "AWS Face Liveness Error:",
      error
    );

    setErrorMsg(
      "Face liveness could not be completed. Please try again."
    );

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

    <div className="min-h-screen flex items-center justify-center bg-[#02040a] px-4 relative overflow-hidden">


      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="absolute inset-0 aurora-flow opacity-20 pointer-events-none" />

      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-slow-pulse" />


      {/* =====================================================
          CARD
      ===================================================== */}

      <Card className="w-full max-w-md quantanex-card relative z-10 overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-xl">


        {/* ===================================================
            HEADER
        =================================================== */}

        <CardHeader className="space-y-2 pb-8 pt-10 text-center">

          <div className="mx-auto w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/10">

            <Smartphone className="text-primary w-8 h-8" />

          </div>


          <CardTitle className="text-3xl font-bold tracking-tighter text-white uppercase">

            Member Portal

          </CardTitle>


          <CardDescription className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground opacity-70">

            {step === 1
              ? "Authorized Personnel Only"
              : "Biometric Protocol"}

          </CardDescription>

        </CardHeader>


        {/* ===================================================
            CONTENT
        =================================================== */}

        <CardContent className="space-y-6 px-8 pb-12">


          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {errorMsg && (

            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-lg text-center">

              {errorMsg}

            </div>

          )}


          {/* =================================================
              STEP 1
          ================================================= */}

          {step === 1 ? (

            <form
              onSubmit={handleCredentialsSubmit}
              className="space-y-6"
            >

              <div className="space-y-4">


                {/* MOBILE */}

                <div className="space-y-2">

                  <div className="flex items-center justify-between mb-1">

                    <Label
                      htmlFor="mobile"
                      className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1"
                    >

                      Mobile Number

                    </Label>

                    <Smartphone className="h-3 w-3 text-primary/40" />

                  </div>


                  <Input
                    id="mobile"
                    type="text"
                    placeholder="10-digit number"
                    className="h-12 bg-white/5 border-white/10 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder:text-muted-foreground/30"
                    value={mobileNumber}
                    onChange={(e) =>
                      setMobileNumber(e.target.value)
                    }
                    required
                  />

                </div>


                {/* PASSWORD */}

                <div className="space-y-2">

                  <div className="flex items-center justify-between mb-1">

                    <Label
                      htmlFor="password"
                      className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1"
                    >

                      Member Password

                    </Label>

                    <Lock className="h-3 w-3 text-primary/40" />

                  </div>


                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    className="h-12 bg-white/5 border-white/10 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder:text-muted-foreground/30"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                  />

                </div>

              </div>


              {/* LOGIN BUTTON */}

              <Button
                type="submit"
                className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all"
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


            /* =================================================
               STEP 2 - FACE LIVENESS
            ================================================= */

            <div className="space-y-6">


              {/* USER INFO */}

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">

                <div>

                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em]">

                    Authenticated

                  </p>


                  <p className="text-sm font-bold text-white font-mono tracking-widest">

                    {mobileNumber}

                  </p>

                </div>


                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBackToCredentials}
                  className="h-8 text-[10px] font-bold uppercase text-primary hover:text-primary/80 hover:bg-white/5"
                >

                  Change

                </Button>

              </div>


              {/* TITLE */}

              <div className="text-center space-y-2">

                <h3 className="text-sm font-bold text-white uppercase tracking-widest">

                  {isFaceRegistered
                    ? "Biometric Verification"
                    : "Secure Enrollment"}

                </h3>


                <p className="text-[10px] text-muted-foreground leading-relaxed">

                  Complete the AWS Face Liveness check.

                </p>

              </div>


              {/* =================================================
                  CREATE SESSION
              ================================================= */}

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


              {/* =================================================
                  AWS FACE LIVENESS
              ================================================= */}

              {livenessSessionId && (

                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40">

                  <FaceLivenessDetector
                    sessionId={livenessSessionId}
                    region={
                      process.env.NEXT_PUBLIC_AWS_REGION ||
                      "us-east-1"
                    }
                    onAnalysisComplete={
                      handleLivenessComplete
                    }
                    onError={
                      handleLivenessError
                    }
                  />

                </div>

              )}


              {/* SESSION STATUS */}

              {livenessSessionId && (

                <div className="text-center">

                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">

                    AWS Face Liveness Active

                  </p>

                </div>

              )}


              {/* CANCEL */}

              <Button
                variant="ghost"
                className="w-full text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] hover:text-white"
                onClick={goBackToCredentials}
                disabled={isLoading}
              >

                Cancel Protocol

              </Button>

            </div>

          )}


          {/* =================================================
              FOOTER LINK
          ================================================= */}

          <div className="mt-8 pt-6 border-t border-white/5 text-center">

            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">

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


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="absolute bottom-8 text-center w-full">

        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.3em]">

          Mukham Security Systems &copy;{" "}

          {new Date().getFullYear()}

        </p>

      </div>

    </div>
  );
}