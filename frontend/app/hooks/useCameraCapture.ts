"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Owns the getUserMedia lifecycle: starting/stopping the stream, wiring it
 * to a <video> element, and grabbing single frames as JPEG blobs for the
 * liveness check and the final selfie submission.
 *
 * Extracted from event/[qrToken]/page.tsx (was previously inline state +
 * two free functions in a ~700 line component).
 */
export function useCameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setCameraError("");
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setCameraError(
            "Camera access was denied. Tap the lock icon in your browser's address bar, allow camera access, then refresh this page."
          );
        } else if (err.name === "NotFoundError") {
          setCameraError(
            "No camera was found on this device. Please try a different device."
          );
        } else if (err.name === "NotReadableError") {
          setCameraError(
            "Your camera is already in use by another app. Please close other apps using the camera and try again."
          );
        } else {
          setCameraError(
            "Could not access your camera. Please check your browser permissions and try again."
          );
        }
      } else {
        setCameraError("Could not access your camera. Please try again.");
      }
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function captureFrameBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return resolve(null);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
    });
  }

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    canvasRef,
    cameraReady,
    cameraError,
    startCamera,
    stopCamera,
    captureFrameBlob,
  };
}
