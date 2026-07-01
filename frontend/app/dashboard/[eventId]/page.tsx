"use client";

import { useState, useEffect, useRef, use } from "react";
import Image from "next/image";

const API_BASE_URL = "http://127.0.0.1:8000";

interface UploadStatus {
  total: number;
  done: number;
  processing: number;
  queued: number;
  failed: number;
}

export default function EventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setQrUrl(`${API_BASE_URL}/api/events/${eventId}/qr/`);
  }, [eventId]);

  // Poll the backend every 3 seconds once an upload has started, so the
  // organizer can watch the album finish processing in real time.
  useEffect(() => {
    if (!uploading && !status) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/events/${eventId}/upload-status/`
        );
        const data: UploadStatus = await res.json();
        setStatus(data);
      } catch {
        // Silently ignore -- polling will retry on the next interval
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [eventId, uploading, status]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage("");
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage("Please choose a ZIP file first.");
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
      setErrorMessage("Only .zip files are supported.");
      return;
    }

    setUploading(true);
    setErrorMessage("");
    setUploadProgress(0);

    const CHUNK_SIZE = 10 * 1024 * 1024;
    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
      const chunkBlob = selectedFile.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunkBlob, "chunk");
      formData.append("chunk_index", String(i));
      formData.append("total_chunks", String(totalChunks));
      formData.append("upload_id", uploadId);
      formData.append("filename", selectedFile.name);

      let attempt = 0;
      let success = false;
      let lastErrorDetail = "";

      while (attempt < 3 && !success) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/events/${eventId}/upload-chunk/`,
            { method: "POST", body: formData }
          );
          if (res.ok) {
            success = true;
          } else {
            const data = await res.json().catch(() => ({}));
            lastErrorDetail = data.error || `Server returned ${res.status}`;
            attempt++;
            if (attempt < 3) await new Promise((r) => setTimeout(r, 1500));
          }
        } catch {
          lastErrorDetail = "Network connection lost";
          attempt++;
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1500));
        }
      }

      if (!success) {
        const percentDone = Math.round((i / totalChunks) * 100);
        setErrorMessage(
          `Upload stopped at ${percentDone}% (piece ${i + 1} of ${totalChunks} failed: ${lastErrorDetail}). ` +
          `Please check your internet connection and try uploading again.`
        );
        setUploading(false);
        return;
      }

      setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
    }

    setStatus({ total: 0, done: 0, processing: 0, queued: 0, failed: 0 });
    setUploading(false);
  }


  const progressPercent =
    status && status.total > 0
      ? Math.round((status.done / status.total) * 100)
      : 0;

  return (
    <div className="bg-white min-h-screen">
      <header className="border-b border-hairline px-6 h-16 flex items-center">
        <p className="text-xl font-bold text-ink">
          Photo<span className="text-coral">Flow</span>
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-ink mb-2">Upload your album</h1>
        <p className="text-muted mb-10">
          Upload the full event album as a single ZIP file. JPG, PNG, and
          iPhone (HEIC) photos are all supported.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="lift-on-hover cursor-pointer rounded-2xl border-2 border-dashed border-hairline hover:border-coral bg-coral-tint/40 p-12 text-center transition-colors"
        >
          <p className="text-4xl mb-3">📁</p>
          <p className="font-semibold text-ink">
            {selectedFile ? selectedFile.name : "Click to choose a ZIP file"}
          </p>
          <p className="text-sm text-muted mt-1">
            {selectedFile
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
              : "Up to 2GB per album"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {errorMessage && (
          <p className="text-red-600 text-sm mt-4">{errorMessage}</p>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="focus-ring btn-primary w-full mt-6 rounded-full px-7 py-3.5 font-semibold disabled:opacity-40"
        >
          {uploading ? "Uploading..." : "Upload album"}
        </button>
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-coral-tint overflow-hidden">
              <div
                className="h-full bg-coral transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {status && (
          <div className="mt-10 rounded-2xl border border-hairline p-6">
            <div className="flex justify-between text-sm text-muted mb-2">
              <span>Processing photos</span>
              <span>
                {status.done} / {status.total || "…"}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-coral-tint overflow-hidden">
              <div
                className="h-full bg-coral transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {status.failed > 0 && (
              <p className="text-sm text-red-600 mt-3">
                {status.failed} photo{status.failed > 1 ? "s" : ""} failed to
                process.
              </p>
            )}
            {status.total > 0 && status.done === status.total && (
              <p className="text-sm text-coral font-medium mt-3">
                ✓ All photos processed. Your event is ready for guests.
              </p>
            )}
          </div>
        )}

        {qrUrl && (
          <div className="mt-10 text-center">
            <p className="text-sm text-muted mb-3">
              Your guest QR code — display it at the venue
            </p>
            <div className="relative w-48 h-48 mx-auto rounded-xl border border-hairline overflow-hidden">
              <Image src={qrUrl} alt="Event QR code" fill className="object-contain p-3" unoptimized />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}