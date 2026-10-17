"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { FaceLivenessDetectorCore } from "@aws-amplify/ui-react-liveness";
import { Loader2, RotateCw } from "lucide-react";

import "@aws-amplify/ui-react/styles.css";
import "@/lib/amplify-config";
import { FastAPI, apiErrorMessage } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

// AWS Face Liveness for a signed-in employee (check-in). A photo or a
// screen held up to the camera fails here; only a live face that matches
// the registered one gets the face_token that attendance/mark requires.
export default function FaceLivenessCheck({ mobileNumber, onVerified }) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const start = useCallback(async () => {
    setError("");
    setSession(null);
    setBusy(true);
    try {
      // Amplify fetches the guest AWS credentials the camera stream uses.
      await fetchAuthSession();
      const { data } = await FastAPI.post("face/liveness/create", {});
      setSession({ id: data.session_id, region: data.region || "ap-south-1" });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not start the face check. Please try again."));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    start();
  }, [start]);

  const finish = async () => {
    const sessionId = session?.id;
    // A liveness session works once; the next try needs a new one.
    setSession(null);
    setBusy(true);
    try {
      const { data } = await FastAPI.post("face/liveness/result", {
        session_id: sessionId,
        mobile_number: mobileNumber,
        mode: "verify",
      });
      if (data?.face_token) {
        onVerified(data.face_token);
        return;
      }
      setError(data?.message || "Face verification failed. Please try again.");
    } catch (err) {
      setError(apiErrorMessage(err, "Face verification failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <div className="text-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Checking your face…</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4">
        {error ? <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p> : null}
        <Button onClick={start} className="w-full h-12 font-bold text-xs">
          <RotateCw className="mr-2 h-4 w-4" />
          Try the face check again
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-foreground/10 bg-black/40">
      <FaceLivenessDetectorCore
        sessionId={session.id}
        region={session.region}
        onAnalysisComplete={finish}
        onError={() => {
          setSession(null);
          setError("The face check could not be completed. Please try again.");
        }}
        config={{
          credentialProvider: async () => {
            const auth = await fetchAuthSession();
            if (!auth.credentials) {
              throw new Error("AWS credentials not available");
            }
            return auth.credentials;
          },
        }}
      />
    </div>
  );
}
