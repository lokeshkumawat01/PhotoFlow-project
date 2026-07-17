"use client";

import { RefObject } from "react";

export type CameraStatus = "camera" | "blink-capture" | "liveness-failed" | "matching";

interface CameraStageProps {
  status: CameraStatus;
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraReady: boolean;
  cameraError: string;
  errorMessage: string;
  capturedPreview: string | null;
  onStartCamera: () => void;
  onStartBlinkCapture: () => void;
  onRetry: () => void;
}

/**
 * Renders whichever of the four "before we have results" states applies:
 * live camera + start button, the blink-capture overlay, a liveness-failed
 * card, or the "searching for your photos" matching state.
 *
 * Extracted from event/[qrToken]/page.tsx — same markup/classes, just moved
 * out of the 700-line page component.
 */
export default function CameraStage({
  status,
  videoRef,
  cameraReady,
  cameraError,
  errorMessage,
  capturedPreview,
  onStartCamera,
  onStartBlinkCapture,
  onRetry,
}: CameraStageProps) {
  return (
    <>
      {cameraError && (
        <div className="text-center mb-4">
          <p className="text-red-600 text-sm mb-3">{cameraError}</p>
          <button
            onClick={onStartCamera}
            className="focus-ring btn-secondary rounded-full px-5 py-2 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {(status === "camera" || status === "blink-capture") && (
        <div className="max-w-md mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-hairline">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full bg-black aspect-square object-cover"
            />
            {status === "blink-capture" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center px-6">
                <p className="text-white font-semibold text-lg animate-pulse">
                  Blink naturally...
                </p>
                {errorMessage && (
                  <p className="text-white/80 text-sm mt-2">{errorMessage}</p>
                )}
              </div>
            )}
          </div>

          {status === "camera" && (
            <>
              <p className="text-sm text-coral-dark bg-coral-tint rounded-xl px-4 py-3 mt-4 text-center leading-relaxed">
                When you're ready, look at the camera and blink naturally —
                this confirms you're really here.
              </p>
              <button
                onClick={onStartBlinkCapture}
                disabled={!cameraReady}
                className="focus-ring btn-primary w-full mt-4 rounded-full px-5 py-3.5 font-semibold disabled:opacity-40"
              >
                Start
              </button>
            </>
          )}
        </div>
      )}

      {status === "liveness-failed" && (
        <div className="text-center mt-4 max-w-md mx-auto">
          <div className="rounded-2xl border border-hairline p-8">
            <p className="text-4xl mb-3">👀</p>
            <p className="text-ink font-medium">{errorMessage}</p>
          </div>
          <button
            onClick={onRetry}
            className="focus-ring btn-primary w-full mt-4 rounded-full px-5 py-3.5 font-semibold"
          >
            Try Again
          </button>
        </div>
      )}

      {status === "matching" && capturedPreview && (
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl overflow-hidden border border-hairline">
            <img
              src={capturedPreview}
              alt="Captured selfie"
              className="w-full aspect-square object-cover"
            />
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-coral animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-coral animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-coral animate-bounce" />
            <p className="text-muted text-sm ml-2">Searching for your photos...</p>
          </div>
        </div>
      )}
    </>
  );
}
