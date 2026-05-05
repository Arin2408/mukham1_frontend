"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function FaceCamera({ onCapture, isLoading, isRegistered }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const stopVideo = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Track stopped:", track.label);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startVideo = useCallback(async () => {
    try {
      stopVideo();
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 400, height: 400, facingMode: "user" } 
      });
      streamRef.current = mediaStream;
      setIsCameraActive(true);
      
      // We need to wait for the next render for videoRef to be available if it was hidden
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 50);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Webcam access denied. Please check your browser permissions.");
    }
  }, [stopVideo]);

  useEffect(() => {
    startVideo();
    return () => stopVideo();
  }, [startVideo, stopVideo]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 400, 400);
      const dataUrl = canvasRef.current.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      
      // HARD STOP: Kill tracks and clear reference
      stopVideo();
      
      const base64 = dataUrl.split(",")[1];
      onCapture(base64);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startVideo();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl bg-black">
        {isCameraActive && !capturedImage && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}
        
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}

        {!isCameraActive && !capturedImage && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 p-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-[10px] text-destructive font-medium">{error}</p>
          </div>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} width="400" height="400" className="hidden" />

      <div className="flex gap-2 w-full">
        {!capturedImage ? (
          <Button 
            onClick={capturePhoto} 
            className="w-full gap-2 h-11"
            disabled={!!error || isLoading || !isCameraActive}
          >
            <Camera className="h-4 w-4" />
            {isRegistered ? "Capture & Verify" : "Set Reference Photo"}
          </Button>
        ) : (
          <Button 
            onClick={retake} 
            variant="outline" 
            className="w-full gap-2 h-11"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Retake
          </Button>
        )}
      </div>
      
      <p className="text-[10px] text-muted-foreground text-center">
        {isRegistered 
          ? "Align your face in the circle for verification." 
          : "This will be your base image for future logins."}
      </p>
    </div>
  );
}
