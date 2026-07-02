"use client";

import { useState, useRef, useEffect, use } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

const API_BASE_URL = "http://127.0.0.1:8000";

interface MatchedPhoto {
  photo_id: string;
  preview_url: string;
  similarity: number;
}

type PageStatus =
  | "camera"
  | "blink-capture"
  | "liveness-failed"
  | "matching"
  | "results"
  | "no-match";

export default function EventPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = use(params);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const [status, setStatus] = useState<PageStatus>("camera");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [photos, setPhotos] = useState<MatchedPhoto[]>([]);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [guestId, setGuestId] = useState("");
  const [isVip, setIsVip] = useState(false);
   const [vipName, setVipName] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
  if (lightboxIndex === null) return;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      showNextPhoto();
    } else if (e.key === "ArrowLeft") {
      showPreviousPhoto();
    } else if (e.key === "Escape") {
      closeLightbox();
    }
  }

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [lightboxIndex, photos.length]);

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

  async function handleStartBlinkCapture() {
    setStatus("blink-capture");
    setErrorMessage("");

    let previousEar: number | null = null;
    let previousFrame: Blob | null = null;
    let attempts = 0;
    // Faster polling -- 200ms instead of 400ms -- so a blink is caught
    // almost as soon as it happens, not on the next slow tick.
    const pollIntervalMs = 200;
    // 200ms * 900 = 3 minutes total safety timeout.
    const maxAttempts = 900;
    // Gentle reminder every 30 seconds.
    const reminderInterval = 150;

    while (attempts < maxAttempts) {
      const frameBlob = await captureFrameBlob();
      if (!frameBlob) {
        attempts++;
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        continue;
      }

      const form = new FormData();
      form.append("frame", frameBlob, "frame.jpg");

      try {
        const res = await fetch(`${API_BASE_URL}/api/guest/liveness-frame/`, {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        const currentEar: number | null = data.ear;

        if (currentEar !== null && previousEar !== null) {
          const dropRatio = currentEar / previousEar;
          if (dropRatio <= 0.88) {
            // Blink detected right now -- use the frame we already have
            // (no extra capture step) and move straight into matching.
            setStatus("matching");
            stopCamera();
            setCapturedPreview(URL.createObjectURL(frameBlob));
            await submitSelfie(frameBlob);
            return;
          }
        }

        if (currentEar !== null) {
          previousEar = currentEar;
          previousFrame = frameBlob;
        }
      } catch {
        // Ignore a single failed frame check and keep monitoring.
      }

      attempts++;
      if (attempts % reminderInterval === 0) {
        setErrorMessage("Still waiting — please look at the camera and blink naturally.");
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    stopCamera();
    setErrorMessage("We couldn't detect a blink in time. Make sure you're in good lighting and your face is clearly visible, then try again.");
    setStatus("camera");
  }

  async function submitSelfie(selfieBlob: Blob) {
    setStatus("matching");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("selfie", selfieBlob, "selfie.jpg");

    // Retry the match request itself up to 2 times -- a single dropped
    // packet on a venue's WiFi shouldn't force the guest to blink again.
    let lastError = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/guest/event/${qrToken}/match/`,
          { method: "POST", body: formData }
        );
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.error || "Something went wrong. Please try again.");
          setStatus("camera");
          return;
        }

        if (!data.photos || data.photos.length === 0) {
          setStatus("no-match");
          return;
        }

        setGuestId(data.guest_id);
        setIsVip(Boolean(data.is_vip));
        setVipName(data.vip_name || "");
        setPhotos(data.photos);
        setStatus("results");
        return;
      } catch {
        lastError = "Could not connect to the server.";
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    setErrorMessage(`${lastError} Please check your connection and try again.`);
    setStatus("camera");
  }

  function handleRetry() {
    setErrorMessage("");
    setCapturedPreview(null);
    setPhotos([]);
    setStatus("camera");
    startCamera();
  }

  async function handleDownloadAll() {
    setDownloadingAll(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/guest/download-all/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_id: guestId, quality: "hd" }),   // <-- changed from "preview"
      });
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "my-photos.zip";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMessage("Could not download your photos. Please try again.");
    }
    setDownloadingAll(false);
  }


  async function handleDownloadSingle(previewUrl: string, photoId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/guest/photo/${photoId}/request-hd/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_id: guestId }),
      });

      // Fall back to the preview image if HD isn't available for some reason
      // (e.g. the original file is missing) so the download still works.
      const downloadUrl = res.ok ? (await res.json()).hd_url : previewUrl;

      const imgRes = await fetch(downloadUrl);
      const blob = await imgRes.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `photo-${photoId}.jpg`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setErrorMessage("Could not download this photo. Please try again.");
    }
  }

function closeLightbox() {
  setLightboxIndex(null);
}

function showNextPhoto() {
  if (lightboxIndex === null) return;
  setLightboxIndex((lightboxIndex + 1) % photos.length);
}

function showPreviousPhoto() {
  if (lightboxIndex === null) return;
  setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
}

function handleTouchStart(e: React.TouchEvent) {
  touchEndX.current = null;
  touchStartX.current = e.targetTouches[0].clientX;
}

function handleTouchMove(e: React.TouchEvent) {
  touchEndX.current = e.targetTouches[0].clientX;
}

function handleTouchEnd() {
  if (touchStartX.current === null || touchEndX.current === null) return;

  const distance = touchStartX.current - touchEndX.current;
  const minSwipeDistance = 50; // pixels -- avoids triggering on tiny accidental drags

  if (distance > minSwipeDistance) {
    // swiped left -> show next photo (like a native gallery)
    showNextPhoto();
  } else if (distance < -minSwipeDistance) {
    // swiped right -> show previous photo
    showPreviousPhoto();
  }

  touchStartX.current = null;
  touchEndX.current = null;
}


  return (
    <div className="bg-white min-h-screen">
      <SiteHeader />

      <div
        className={`mx-auto px-6 py-16 ${
          status === "results" ? "max-w-5xl" : "max-w-xl"
        }`}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-coral-tint px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-coral" />
            <p className="text-xs font-semibold text-coral-dark uppercase tracking-wide">
              Live event gallery
            </p>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink">
            Find Your Photos
          </h1>
          <p className="text-muted mt-2">
            Take a live selfie and we'll find every photo you appear in.
          </p>
        </div>

        {cameraError && (
          <div className="text-center mb-4">
            <p className="text-red-600 text-sm mb-3">{cameraError}</p>
            <button
              onClick={startCamera}
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
                  onClick={handleStartBlinkCapture}
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
              onClick={handleRetry}
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
              <p className="text-muted text-sm ml-2">
                Searching for your photos...
              </p>
            </div>
          </div>
        )}

        {errorMessage && status !== "liveness-failed" && (
          <p className="text-red-600 text-sm text-center mt-3">{errorMessage}</p>
        )}

        {status === "no-match" && (
          <div className="text-center mt-4 max-w-md mx-auto">
            <div className="rounded-2xl border border-hairline p-8">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-ink font-medium">
                We didn't match any pictures with your selfie.
              </p>
              <p className="text-muted text-sm mt-1">
                Try again with better lighting, or make sure your face is
                clearly visible.
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="focus-ring btn-primary w-full mt-4 rounded-full px-5 py-3.5 font-semibold"
            >
              Try Again
            </button>
          </div>
        )}

        {status === "results" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-ink">
                {isVip
                  ? `Welcome, ${vipName}!`
                  : `${photos.length} Photo${photos.length > 1 ? "s" : ""} Found`}
              </h2>
              <span className="text-xs font-semibold text-coral-dark bg-coral-tint rounded-full px-3 py-1">
                {isVip ? "VIP Access · Full Album" : "Matched to you"}
              </span>
            </div>

            {isVip && (
              <p className="text-sm text-coral-dark bg-coral-tint rounded-xl px-4 py-3 mb-6 text-center leading-relaxed">
                You have full access to all {photos.length} photos from this event.
              </p>
            )}

            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="focus-ring btn-primary w-full mb-6 rounded-full px-5 py-3.5 font-semibold disabled:opacity-50"
            >
              {downloadingAll ? "Preparing download..." : "Download all photos"}
            </button>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.photo_id}
                  className="group relative rounded-xl overflow-hidden border border-hairline"
                >
                  <img
                    src={photo.preview_url}
                    alt="Matched photo"
                    onClick={() => setLightboxIndex(index)}
                    className="w-full aspect-square object-cover cursor-pointer"
                  />

                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                  <button
                    onClick={() => handleDownloadSingle(photo.preview_url, photo.photo_id)}
                    className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 hover:bg-coral hover:[&>svg]:stroke-white sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Download this photo"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v12" />
                      <path d="M7 10l5 5 5-5" />
                      <path d="M5 21h14" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleRetry}
              className="focus-ring btn-secondary w-full mt-6 rounded-full px-5 py-3.5 font-semibold"
            >
              Search Again
            </button>
            
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>

            {/* Arrow buttons -- hidden on touch devices (sm and below), swipe is used instead there */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                showPreviousPhoto();
              }}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors"
              aria-label="Previous photo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <img
              src={photos[lightboxIndex].preview_url}
              alt="Matched photo, enlarged"
              onClick={(e) => e.stopPropagation()}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg select-none"
              draggable={false}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                showNextPhoto();
              }}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors"
              aria-label="Next photo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Small position indicator -- helps on mobile where arrow buttons are hidden */}
            <p className="sm:hidden absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
              {lightboxIndex + 1} / {photos.length}
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadSingle(photos[lightboxIndex].preview_url, photos[lightboxIndex].photo_id);
              }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 btn-primary rounded-full px-6 py-2.5 text-sm font-semibold"
            >
              Download this photo
            </button>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}