"use client";

import { useState, useEffect, use } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { API_BASE_URL } from "../../lib/config";
import { useCameraCapture } from "../../hooks/useCameraCapture";
import { useBlinkLiveness } from "../../hooks/useBlinkLiveness";
import CameraStage, { CameraStatus } from "../../components/guest/CameraStage";
import MatchedGallery, {
  MatchedPhoto,
  FulfilledVideo,
} from "../../components/guest/MatchedGallery";
import PhotoLightbox from "../../components/guest/PhotoLightbox";

type PageStatus = CameraStatus | "results" | "no-match";

export default function EventPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = use(params);

  const { videoRef, canvasRef, cameraReady, cameraError, startCamera, stopCamera, captureFrameBlob } =
    useCameraCapture();
  const { waitForBlink } = useBlinkLiveness(captureFrameBlob);

  const [status, setStatus] = useState<PageStatus>("camera");
  const [errorMessage, setErrorMessage] = useState("");
  const [photos, setPhotos] = useState<MatchedPhoto[]>([]);
  const [videos, setVideos] = useState<FulfilledVideo[]>([]);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [guestId, setGuestId] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [vipName, setVipName] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [newPhotoToast, setNewPhotoToast] = useState("");

  // Poll for newly-added photos while the guest is looking at their results.
  useEffect(() => {
    if (status !== "results" || !guestId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/guest/${guestId}/check-new-photos/?known_count=${photos.length}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (data.has_new && data.new_photos?.length > 0) {
          setPhotos((prev) => [...prev, ...data.new_photos]);
          setNewPhotoToast(
            `${data.new_photos.length} new photo${data.new_photos.length > 1 ? "s" : ""} just added!`
          );
          setTimeout(() => setNewPhotoToast(""), 4000);
        }
        if (data.videos) setVideos(data.videos);
      } catch {
        // Silently ignore -- polling will retry on the next interval
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [status, guestId, photos.length]);

  async function handleStartBlinkCapture() {
    setStatus("blink-capture");
    setErrorMessage("");

    const result = await waitForBlink((message) => setErrorMessage(message));

    if (!result.blinked) {
      stopCamera();
      setErrorMessage(
        "We couldn't detect a blink in time. Make sure you're in good lighting and your face is clearly visible, then try again."
      );
      setStatus("camera");
      return;
    }

    setStatus("matching");
    stopCamera();
    setCapturedPreview(URL.createObjectURL(result.frame));
    await submitSelfie(result.frame);
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
        setVideos(data.videos || []);
        setStatus("results");
        return;
      } catch {
        lastError = "Could not connect to the server.";
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
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
        body: JSON.stringify({ guest_id: guestId, quality: "hd" }),
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

  const isCameraStage =
    status === "camera" ||
    status === "blink-capture" ||
    status === "liveness-failed" ||
    status === "matching";

  return (
    <div className="bg-white min-h-screen">
      <SiteHeader />

      <div className={`mx-auto px-6 py-16 ${status === "results" ? "max-w-5xl" : "max-w-xl"}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-coral-tint px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-coral" />
            <p className="text-xs font-semibold text-coral-dark uppercase tracking-wide">
              Live event gallery
            </p>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink">Find Your Photos</h1>
          <p className="text-muted mt-2">
            Take a live selfie and we'll find every photo you appear in.
          </p>
        </div>

        {isCameraStage && (
          <CameraStage
            status={status as CameraStatus}
            videoRef={videoRef}
            cameraReady={cameraReady}
            cameraError={cameraError}
            errorMessage={errorMessage}
            capturedPreview={capturedPreview}
            onStartCamera={startCamera}
            onStartBlinkCapture={handleStartBlinkCapture}
            onRetry={handleRetry}
          />
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
                Try again with better lighting, or make sure your face is clearly visible.
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
          <MatchedGallery
            photos={photos}
            videos={videos}
            isVip={isVip}
            vipName={vipName}
            downloadingAll={downloadingAll}
            newPhotoToast={newPhotoToast}
            onDownloadAll={handleDownloadAll}
            onDownloadSingle={handleDownloadSingle}
            onOpenLightbox={setLightboxIndex}
            onSearchAgain={handleRetry}
          />
        )}

        <canvas ref={canvasRef} className="hidden" />

        {lightboxIndex !== null && photos[lightboxIndex] && (
          <PhotoLightbox
            photos={photos}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onIndexChange={setLightboxIndex}
            onDownload={handleDownloadSingle}
          />
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
